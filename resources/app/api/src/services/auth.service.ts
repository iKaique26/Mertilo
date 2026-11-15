import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { randomUUID } from 'node:crypto';
import { logger } from '../utils/logger.js';
import { usersRepository, type User } from '../repositories/users.repository.js';
import { emailService } from './email.service.js';
import { LEGAL_DOCUMENTS, legalDocumentHash } from '../legal-documents.js';

function randomNumericCode(len = 6) {
  const digits = '0123456789';
  let s = '';
  for (let i = 0; i < len; i++) s += digits[Math.floor(Math.random() * digits.length)];
  return s;
}

const isProduction = process.env.NODE_ENV === 'production';
const JWT_SECRET = process.env.JWT_SECRET ?? (isProduction ? 'mertilo-production-secret-must-be-set' : 'dev-secret');
if (isProduction && !process.env.JWT_SECRET) {
  logger.warn('JWT_SECRET não configurado em produção; usando fallback inseguro temporário. Defina uma secret forte em variáveis de ambiente.');
}
const JWT_EXP = process.env.JWT_EXPIRATION ?? '7d';
const VERIFICATION_TTL_MS = 1000 * 60 * 60;
const VERIFICATION_MAX_ATTEMPTS = 5;
const VERIFICATION_RETRY_INTERVAL_MS = 60 * 1000;
const VERIFICATION_RETRY_MAX_PER_WINDOW = 3;

/**
 * Mutex em memória por usuário para o reenvio de verificação.
 *
 * `better-sqlite3` é síncrono, mas `resendVerification` contém `await bcrypt.hash(...)`,
 * que cede o event loop. Sem serialização, duas chamadas concorrentes no MESMO processo
 * podem tentar abrir transações simultâneas na mesma conexão e ambas lerem o estado antes
 * da escrita — a race condition real.
 *
 * Mantemos o bloqueio por usuário para reduzir contenção e evitar que usuários diferentes
 * fiquem presos em uma fila global. `BEGIN IMMEDIATE` segue sendo a proteção principal para
 * SQLite multi-processo; o mutex complementa isso dentro do próprio processo.
 */
const _resendVerificationMutexes = new Map<string, Promise<unknown>>();
let _databaseWriteQueue: Promise<unknown> = Promise.resolve();

function withResendMutex<T>(userId: string, fn: () => Promise<T>): Promise<T> {
  const previous = _resendVerificationMutexes.get(userId) ?? Promise.resolve();
  let release!: () => void;
  const current = new Promise<void>((resolve) => {
    release = resolve;
  });

  _resendVerificationMutexes.set(userId, previous.then(() => current, () => current));

  return previous
    .catch(() => undefined)
    .then(() => fn())
    .finally(() => {
      release();
      if (_resendVerificationMutexes.get(userId) === current) {
        _resendVerificationMutexes.delete(userId);
      }
    });
}

function withDatabaseWriteLock<T>(fn: () => Promise<T>): Promise<T> {
  const previous = _databaseWriteQueue;
  let release!: () => void;
  const current = new Promise<void>((resolve) => {
    release = resolve;
  });

  _databaseWriteQueue = previous.then(() => current, () => current);

  return previous
    .catch(() => undefined)
    .then(() => fn())
    .finally(() => {
      release();
      if (_databaseWriteQueue === current) {
        _databaseWriteQueue = Promise.resolve();
      }
    });
}

/**
 * Emite o JWT da sessão com `jti` único. Sem ele, dois tokens do mesmo usuário emitidos no
 * mesmo segundo (mesmos `sub`/`iat`/`exp`) são idênticos, e uma sessão nova "ressuscita" o
 * token anterior já invalidado (ex.: login logo após redefinição de senha).
 */
function signSessionToken(userId: string) {
  return jwt.sign({ sub: userId }, JWT_SECRET, { expiresIn: JWT_EXP, jwtid: randomUUID() });
}

function maskEmail(email: string) {
  const [local, domain] = email.split('@');
  if (!domain) return email;
  const maskedLocal = local.length <= 2 ? `${local[0] ?? ''}*` : `${local.slice(0, 2)}***`;
  return `${maskedLocal}@${domain}`;
}

export const authService = {
  async register(name: string, email: string, password: string, acceptTerms: boolean, dateOfBirth?: string) {
    if (acceptTerms !== true) {
      throw new Error('Você deve aceitar os Termos de Uso e a Política de Privacidade');
    }
    if (typeof name !== 'string' || !name.trim()) throw new Error('Nome inválido');
    if (typeof email !== 'string' || !email.includes('@')) throw new Error('Email inválido');
    if (typeof password !== 'string' || password.length < 8) throw new Error('Senha deve ter ao menos 8 caracteres');
    
    // Validar maioridade (18+)
    if (!dateOfBirth || typeof dateOfBirth !== 'string') {
      throw new Error('Data de nascimento é obrigatória');
    }
    const birthDate = new Date(dateOfBirth);
    if (isNaN(birthDate.getTime())) {
      throw new Error('Data de nascimento inválida');
    }
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    if (age < 18) {
      throw new Error('O cadastro é permitido apenas para maiores de 18 anos');
    }

    const normalizedEmail = email.trim().toLowerCase();
    const safeEmail = maskEmail(normalizedEmail);
    const normalizedName = name.trim();
    logger.info('[EMAIL] register requested', { email: safeEmail, name: normalizedName });

    const previousUser = usersRepository.findByEmail(normalizedEmail);
    if (previousUser && previousUser.is_verified) throw new Error('Email já cadastrado');

    const previousSnapshot = previousUser ? { ...previousUser } : null;
    const password_hash = await bcrypt.hash(password, 10);

    let user: User | null = null;
    let createdVerificationId: string | null = null;
    const db = (await import('../database/db.js')).getDatabase();
    db.exec('BEGIN');

    try {
      if (!previousUser) {
        user = usersRepository.create({ name: normalizedName, email: normalizedEmail, password_hash, is_verified: false, date_of_birth: birthDate.toISOString().split('T')[0] });
      } else {
        const db = (await import('../database/db.js')).getDatabase();
        db.prepare('UPDATE users SET name = ?, email = ?, password_hash = ?, is_verified = 0, updated_at = ?, date_of_birth = ? WHERE id = ?')
          .run(normalizedName, normalizedEmail, password_hash, new Date().toISOString(), birthDate.toISOString().split('T')[0], previousUser.id);
        const reloadedUser = usersRepository.findById(previousUser.id);
        if (!reloadedUser) throw new Error('Usuário pendente não encontrado');
        user = reloadedUser;
      }

      usersRepository.invalidatePreviousVerificationCodes(user.id);
      const code = randomNumericCode(6);
      logger.info('[EMAIL] verification code generated', { userId: user.id, email: safeEmail });
      const codeHash = await bcrypt.hash(code, 10);
      const expiresAt = new Date(Date.now() + VERIFICATION_TTL_MS).toISOString();
      createdVerificationId = usersRepository.createVerificationCode(user.id, codeHash, expiresAt);
      logger.info('[EMAIL] verification code persisted', { userId: user.id, email: safeEmail, expiresAt });

      // Save legal acceptances
      const db = (await import('../database/db.js')).getDatabase();
      const now = new Date().toISOString();
      const terms = LEGAL_DOCUMENTS.TERMS_OF_USE;
      const privacy = LEGAL_DOCUMENTS.PRIVACY_NOTICE;
      
      db.prepare(`INSERT INTO legal_acceptances (id, user_id, document_type, document_version, accepted_at, acceptance_method, created_at, content_hash, legal_basis, purpose)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
        .run(`acc_${Date.now()}_terms`, user.id, terms.type, terms.version, now, 'WEB_REGISTRATION', now, legalDocumentHash(terms), 'CONTRACT', 'ACCOUNT_CREATION');
      
      db.prepare(`INSERT INTO legal_acceptances (id, user_id, document_type, document_version, accepted_at, acceptance_method, created_at, content_hash, legal_basis, purpose)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
        .run(`acc_${Date.now() + 1}_privacy`, user.id, privacy.type, privacy.version, now, 'WEB_REGISTRATION', now, legalDocumentHash(privacy), 'NOTICE', 'ACCOUNT_CREATION');

      logger.info('[EMAIL] email service called', { userId: user.id, email: safeEmail });
      await emailService.sendVerificationCode(user.email, code, 60);
      logger.info('[EMAIL] email service returned', { userId: user.id, email: safeEmail });
      db.exec('COMMIT');

      const result: any = { user: { id: user.id, name: user.name, email: user.email, is_verified: false } };
      if (process.env.NODE_ENV === 'test') result.verification_code = code;
      return result;
    } catch (error) {
      if (db.inTransaction) db.exec('ROLLBACK');
      throw error;
    }
  },

  async login(email: string, password: string) {
    const user = usersRepository.findByEmail(email);
    if (!user) throw new Error('Usuário ou senha inválidos');
    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) throw new Error('Usuário ou senha inválidos');
    if (!user.is_verified) throw new Error('Conta não verificada');
    const token = signSessionToken(user.id);
    // persist session
    const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 7).toISOString();
    usersRepository.createSession(user.id, token, expiresAt);
    return { user: { id: user.id, name: user.name, email: user.email, is_verified: user.is_verified }, token };
  },

  async verifyEmail(email: string, code: string) {
    const user = usersRepository.findByEmail(email);
    if (!user) throw new Error('Usuário não encontrado');
    const record = usersRepository.getActiveVerificationCode(user.id);
    if (!record) throw new Error('Código não encontrado ou expirado');
    if (record.attempts >= VERIFICATION_MAX_ATTEMPTS) throw new Error('Limite de tentativas excedido');
    const ok = await bcrypt.compare(code, record.code_hash);
    if (!ok) {
      usersRepository.incrementVerificationAttempts(record.id);
      throw new Error('Código inválido');
    }
    usersRepository.markVerificationUsed(record.id);
    const db = (await import('../database/db.js')).getDatabase();
    db.prepare('UPDATE users SET is_verified = 1, updated_at = ? WHERE id = ?').run(new Date().toISOString(), user.id);

    const verifiedUser = usersRepository.findById(user.id);
    if (!verifiedUser) throw new Error('Usuário não encontrado após verificação');

    const token = signSessionToken(verifiedUser.id);
    const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 7).toISOString();
    usersRepository.createSession(verifiedUser.id, token, expiresAt);

    return {
      user: {
        id: verifiedUser.id,
        name: verifiedUser.name,
        email: verifiedUser.email,
        is_verified: true,
      },
      token,
    };
  },

  async resendVerification(email: string) {
    const user = usersRepository.findByEmail(email);
    if (!user) throw new Error('Usuário não encontrado');
    if (user.is_verified) throw new Error('Conta já verificada');

    let preferBrevo = false;
    let code: string;

    // Serialização: mutex in-process + BEGIN IMMEDIATE (cross-process).
    // As verificações E a criação ficam no mesmo bloco crítico.
    const db = (await import('../database/db.js')).getDatabase();
    ({ code, preferBrevo } = await withResendMutex(user.id, async () => {
      return await withDatabaseWriteLock(async () => {
        db.exec('BEGIN IMMEDIATE');
        try {
          const latest = usersRepository.getLatestVerificationCode(user.id);
          if (latest && Date.now() - new Date(latest.created_at).getTime() < VERIFICATION_RETRY_INTERVAL_MS) {
            throw new Error('Aguarde um momento antes de solicitar outro código.');
          }

          const windowStart = new Date(Date.now() - 1000 * 60 * 60).toISOString();
          const recentRow = db.prepare('SELECT COUNT(*) as c FROM verification_codes WHERE user_id = ? AND created_at > ?').get(user.id, windowStart) as { c?: number } | undefined;
          const recentCount = Number(recentRow?.c ?? 0);
          if (recentCount >= VERIFICATION_RETRY_MAX_PER_WINDOW) {
            throw new Error('Muitas tentativas de reenvio. Tente novamente mais tarde.');
          }

          const priorCountRow = db.prepare('SELECT COUNT(*) as c FROM verification_codes WHERE user_id = ? AND used = 1').get(user.id) as { c?: number } | undefined;
          const priorCount = Number(priorCountRow?.c ?? 0);
          if (priorCount > 0) {
            preferBrevo = true;
            logger.info('[EMAIL] Segundo clique (ou posterior) detectado para reenvio de verificação. Priorizando Brevo.', { userId: user.id, priorCount });
          }

          usersRepository.invalidatePreviousVerificationCodes(user.id);
          const newCode = randomNumericCode(6);
          const codeHash = await bcrypt.hash(newCode, 10);
          const expiresAt = new Date(Date.now() + VERIFICATION_TTL_MS).toISOString();
          usersRepository.createVerificationCode(user.id, codeHash, expiresAt);
          db.exec('COMMIT');
          return { code: newCode, preferBrevo };
        } catch (error) {
          if (db.inTransaction) db.exec('ROLLBACK');
          throw error;
        }
      });
    }));

    // Email delivery happens after COMMIT; a failure here must not roll back the
    // persisted code (retry-window still protects against spam) nor mask errors
    // with a spurious ROLLBACK on a closed transaction.
    try {
      await emailService.sendVerificationCode(user.email, code, 60, preferBrevo);
    } catch (error) {
      logger.error('[EMAIL] Falha ao enviar código de verificação no reenvio', { userId: user.id, error: (error as Error).message });
      throw error;
    }
    if (process.env.NODE_ENV === 'test') return { code, email: maskEmail(user.email) };
    return { success: true, email: maskEmail(user.email) };
  },

  async forgotPassword(email: string) {
    const user = usersRepository.findByEmail(email);
    if (!user) return true; // don't reveal
    const crypto = await import('crypto');
    const token = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const expiresAt = new Date(Date.now() + 1000 * 60 * 30).toISOString(); // 30 min
    const resetId = usersRepository.createPasswordReset(user.id, tokenHash, expiresAt);
    const resetLink = `https://www.mertiloo.com.br/#/Reset-password/${token}`;
    try {
      await emailService.sendPasswordReset(user.email, resetLink);
    } catch (error) {
      usersRepository.revokePasswordReset(resetId);
      throw error;
    }
    return true;
  },

  async validateResetToken(token: string) {
    const crypto = await import('crypto');
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const record = usersRepository.getPasswordResetByHash(tokenHash);
    if (!record) throw new Error('Token inválido ou expirado');
    if (record.used) throw new Error('Token já utilizado');
    if (new Date(record.expires_at) < new Date()) throw new Error('Token expirado');
    return { valid: true };
  },

  async resetPassword(token: string, newPassword: string) {
    if (typeof newPassword !== 'string' || newPassword.length < 8) throw new Error('Senha deve ter ao menos 8 caracteres');
    const crypto = await import('crypto');
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    
    const db = (await import('../database/db.js')).getDatabase();
    const record = usersRepository.getPasswordResetRecordByHash(tokenHash);
    if (!record) throw new Error('Token inválido ou expirado');
    if (record.used) throw new Error('Token já utilizado');
    if (Number.isNaN(new Date(record.expires_at).getTime()) || new Date(record.expires_at) <= new Date()) throw new Error('Token expirado');

    const user = usersRepository.findById(record.user_id);
    if (!user) throw new Error('Token inválido ou expirado');
    const password_hash = await bcrypt.hash(newPassword, 10);

    db.exec('BEGIN IMMEDIATE TRANSACTION');
    try {
      const consumed = usersRepository.consumePasswordReset(record.id, tokenHash, new Date().toISOString());
      if (consumed !== 1) throw new Error('Token inválido ou já utilizado');
      db.prepare('UPDATE users SET password_hash = ?, updated_at = ? WHERE id = ?').run(password_hash, new Date().toISOString(), user.id);
      usersRepository.invalidateUserSessions(user.id);
      db.prepare('UPDATE password_resets SET used = 1 WHERE user_id = ? AND used = 0 AND id != ?').run(user.id, record.id);
      db.exec('COMMIT');
      return true;
    } catch (error) {
      if (db.inTransaction) db.exec('ROLLBACK');
      throw error;
    }
  },

  async changePassword(userId: string, currentPassword: string, newPassword: string) {
    const user = usersRepository.findById(userId);
    if (!user) throw new Error('Usuário não encontrado');
    if (typeof newPassword !== 'string' || newPassword.length < 8) throw new Error('Senha deve ter ao menos 8 caracteres');
    const ok = await bcrypt.compare(currentPassword, user.password_hash);
    if (!ok) throw new Error('Senha atual incorreta');
    const password_hash = await bcrypt.hash(newPassword, 10);
    const db = (await import('../database/db.js')).getDatabase();
    db.prepare('UPDATE users SET password_hash = ?, updated_at = ? WHERE id = ?').run(password_hash, new Date().toISOString(), user.id);
    usersRepository.invalidateUserSessions(user.id);
    return true;
  },

  async logout(token: string) {
    usersRepository.invalidateSession(token);
    return true;
  },

  verifyToken(token: string) {
    try {
      const payload = jwt.verify(token, JWT_SECRET) as any;
      return payload.sub as string;
    } catch (err) {
      return null;
    }
  }
};
