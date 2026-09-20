import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { logger } from '../utils/logger.js';
import { usersRepository, type User } from '../repositories/users.repository.js';
import { emailService } from './email.service.js';

function randomNumericCode(len = 6) {
  const digits = '0123456789';
  let s = '';
  for (let i = 0; i < len; i++) s += digits[Math.floor(Math.random() * digits.length)];
  return s;
}

const JWT_SECRET = process.env.JWT_SECRET ?? 'dev-secret';
const JWT_EXP = process.env.JWT_EXPIRATION ?? '7d';
const VERIFICATION_TTL_MS = 1000 * 60 * 60;
const VERIFICATION_MAX_ATTEMPTS = 5;
const RESEND_INTERVAL_MS = 60 * 1000;
const RESEND_MAX_PER_WINDOW = 3;

function maskEmail(email: string) {
  const [local, domain] = email.split('@');
  if (!domain) return email;
  const maskedLocal = local.length <= 2 ? `${local[0] ?? ''}*` : `${local.slice(0, 2)}***`;
  return `${maskedLocal}@${domain}`;
}

export const authService = {
  async register(name: string, email: string, password: string) {
    if (typeof name !== 'string' || !name.trim()) throw new Error('Nome inválido');
    if (typeof email !== 'string' || !email.includes('@')) throw new Error('Email inválido');
    if (typeof password !== 'string' || password.length < 8) throw new Error('Senha deve ter ao menos 8 caracteres');

    const normalizedEmail = email.trim().toLowerCase();
    const safeEmail = maskEmail(normalizedEmail);
    const normalizedName = name.trim();
    logger.info('[EMAIL] register requested', { email: safeEmail, name: normalizedName });

    const existing = usersRepository.findByEmail(normalizedEmail);
    if (existing && existing.is_verified) throw new Error('Email já cadastrado');

    const password_hash = await bcrypt.hash(password, 10);

    let user: User;
    if (!existing) {
      user = usersRepository.create({ name: normalizedName, email: normalizedEmail, password_hash, is_verified: false });
    } else {
      const db = (await import('../database/db.js')).getDatabase();
      db.prepare('UPDATE users SET name = ?, email = ?, password_hash = ?, is_verified = 0, updated_at = ? WHERE id = ?')
        .run(normalizedName, normalizedEmail, password_hash, new Date().toISOString(), existing.id);
      const reloadedUser = usersRepository.findById(existing.id);
      if (!reloadedUser) throw new Error('Usuário pendente não encontrado');
      user = reloadedUser;
    }

    usersRepository.invalidatePreviousVerificationCodes(user.id);
    const code = randomNumericCode(6);
    logger.info('[EMAIL] verification code generated', { userId: user.id, email: safeEmail });
    const codeHash = await bcrypt.hash(code, 10);
    const expiresAt = new Date(Date.now() + VERIFICATION_TTL_MS).toISOString();
    usersRepository.createVerificationCode(user.id, codeHash, expiresAt);
    logger.info('[EMAIL] verification code persisted', { userId: user.id, email: safeEmail, expiresAt });
    logger.info('[EMAIL] email service called', { userId: user.id, email: safeEmail });
    await emailService.sendVerificationCode(user.email, code, 60);
    logger.info('[EMAIL] email service returned', { userId: user.id, email: safeEmail });

    const totalUsers = usersRepository.countUsers();
    if (totalUsers === 1) {
      try {
        usersRepository.assignLegacyDataToUser(user.id);
      } catch (err) {
        // fail silently; not critical
      }
    }

    const result: any = { user: { id: user.id, name: user.name, email: user.email, is_verified: false } };
    if (process.env.NODE_ENV === 'test') result.verification_code = code;
    return result;
  },

  async login(email: string, password: string) {
    const user = usersRepository.findByEmail(email);
    if (!user) throw new Error('Usuário ou senha inválidos');
    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) throw new Error('Usuário ou senha inválidos');
    if (!user.is_verified) throw new Error('Conta não verificada');
    const token = jwt.sign({ sub: user.id }, JWT_SECRET, { expiresIn: JWT_EXP });
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

    const token = jwt.sign({ sub: verifiedUser.id }, JWT_SECRET, { expiresIn: JWT_EXP });
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

    if (process.env.NODE_ENV !== 'test') {
      const latest = usersRepository.getLatestVerificationCode(user.id);
      if (latest && Date.now() - new Date(latest.created_at).getTime() < RESEND_INTERVAL_MS) {
        throw new Error('Aguarde um momento antes de solicitar outro código.');
      }

      const db = (await import('../database/db.js')).getDatabase();
      const windowStart = new Date(Date.now() - 1000 * 60 * 60).toISOString();
      const recentRow = db.prepare('SELECT COUNT(*) as c FROM verification_codes WHERE user_id = ? AND created_at > ?').get(user.id, windowStart) as { c?: number } | undefined;
      const recentCount = Number(recentRow?.c ?? 0);
      if (recentCount >= RESEND_MAX_PER_WINDOW) {
        throw new Error('Muitas tentativas de reenvio. Tente novamente mais tarde.');
      }
    }

    usersRepository.invalidatePreviousVerificationCodes(user.id);
    const code = randomNumericCode(6);
    const codeHash = await bcrypt.hash(code, 10);
    const expiresAt = new Date(Date.now() + VERIFICATION_TTL_MS).toISOString();
    usersRepository.createVerificationCode(user.id, codeHash, expiresAt);
    await emailService.sendVerificationCode(user.email, code, 60);
    if (process.env.NODE_ENV === 'test') return { code, email: maskEmail(user.email) };
    return { success: true, email: maskEmail(user.email) };
  },

  async forgotPassword(email: string) {
    const user = usersRepository.findByEmail(email);
    if (!user) return true; // don't reveal
    const token = (await import('crypto')).randomBytes(32).toString('hex');
    const tokenHash = await bcrypt.hash(token, 10);
    const expiresAt = new Date(Date.now() + 1000 * 60 * 60).toISOString(); // 1h
    usersRepository.createPasswordReset(user.id, tokenHash, expiresAt);
    const resetLink = `https://app.mertilo.local/reset-password?email=${encodeURIComponent(email)}&token=${encodeURIComponent(token)}`;
    await emailService.sendPasswordReset(user.email, resetLink);
    // in test env return token to allow automated tests to reset password
    if (process.env.NODE_ENV === 'test') return { token };
    return true;
  },

  async resetPassword(email: string, token: string, newPassword: string) {
    if (typeof newPassword !== 'string' || newPassword.length < 8) throw new Error('Senha deve ter ao menos 8 caracteres');
    const user = usersRepository.findByEmail(email);
    if (!user) throw new Error('Usuário não encontrado');
    const record = usersRepository.getActivePasswordReset(user.id);
    if (!record) throw new Error('Token inválido ou expirado');
    if (record.attempts >= 5) throw new Error('Limite de tentativas excedido');
    const ok = await bcrypt.compare(token, record.token_hash);
    if (!ok) {
      usersRepository.incrementPasswordResetAttempts(record.id);
      throw new Error('Token inválido');
    }
    // update password
    const password_hash = await bcrypt.hash(newPassword, 10);
    const db = (await import('../database/db.js')).getDatabase();
    db.prepare('UPDATE users SET password_hash = ?, updated_at = ? WHERE id = ?').run(password_hash, new Date().toISOString(), user.id);
    usersRepository.markPasswordResetUsed(record.id);
    return true;
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
