import { getDatabase } from '../database/db.js';

export type User = {
  id: string;
  name: string;
  email: string;
  password_hash: string;
  is_verified?: boolean;
  created_at: string;
};

export const usersRepository = {
  create(user: Omit<User, 'id' | 'created_at'> & { id?: string }) {
    const db = getDatabase();
    const id = user.id ?? Date.now().toString();
    const now = new Date().toISOString();
    const normalizedEmail = (user.email ?? '').trim().toLowerCase();

    db.prepare(`INSERT INTO users (id, name, email, password_hash, is_verified, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)`)
      .run(id, user.name, normalizedEmail, user.password_hash, user.is_verified ? 1 : 0, now, now);

    return {
      id,
      name: user.name,
      email: normalizedEmail,
      password_hash: user.password_hash,
      is_verified: user.is_verified ?? false,
      created_at: now,
    } as User;
  },

  findByEmail(email: string) {
    const db = getDatabase();
    const normalizedEmail = (email ?? '').trim().toLowerCase();
    const row = db.prepare('SELECT * FROM users WHERE lower(email) = ?').get(normalizedEmail) as any;
    if (!row) return null;
    return {
      id: row.id,
      name: row.name,
      email: row.email,
      password_hash: row.password_hash,
      is_verified: Boolean(row.is_verified),
      created_at: row.created_at,
    } as User;
  },

  findById(id: string) {
    const db = getDatabase();
    const row = db.prepare('SELECT * FROM users WHERE id = ?').get(id) as any;
    if (!row) return null;
    return {
      id: row.id,
      name: row.name,
      email: row.email,
      password_hash: row.password_hash,
      is_verified: Boolean(row.is_verified),
      created_at: row.created_at,
    } as User;
  }
  ,

  countUsers() {
    const db = getDatabase();
    const row = db.prepare('SELECT COUNT(1) as c FROM users').get() as any;
    return row ? Number(row.c) : 0;
  },

  // Assign existing legacy rows (without user_id) to the provided user id.
  // This is best-effort and only used for first-user bootstrap in single-user installs or tests.
  assignLegacyDataToUser(userId: string) {
    const db = getDatabase();
    const tables = [
      'accounts',
      'irpf_exercises',
      'irpf_documents',
      'irpf_income',
      'irpf_assets',
      'irpf_deductions',
      'irpf_dependents',
      'irpf_alerts'
    ];
    const tx = db.transaction(() => {
      for (const t of tables) {
        try {
          db.prepare(`UPDATE ${t} SET user_id = ? WHERE user_id IS NULL OR user_id = ''`).run(userId);
        } catch (err) {
          // ignore tables that don't exist in older DBs
        }
      }
    });
    tx();
  },

  // Verification codes
  createVerificationCode(userId: string, codeHash: string, expiresAt: string) {
    const db = getDatabase();
    const id = Date.now().toString();
    const now = new Date().toISOString();
    db.prepare(`INSERT INTO verification_codes (id, user_id, code_hash, expires_at, attempts, used, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)`)
      .run(id, userId, codeHash, expiresAt, 0, 0, now);
    return id;
  },

  getActiveVerificationCode(userId: string) {
    const db = getDatabase();
    const now = new Date().toISOString();
    const row = db.prepare('SELECT * FROM verification_codes WHERE user_id = ? AND used = 0 AND expires_at > ? ORDER BY created_at DESC LIMIT 1').get(userId, now) as any;
    return row || null;
  },

  getLatestVerificationCode(userId: string) {
    const db = getDatabase();
    const row = db.prepare('SELECT * FROM verification_codes WHERE user_id = ? ORDER BY created_at DESC LIMIT 1').get(userId) as any;
    return row || null;
  },

  invalidatePreviousVerificationCodes(userId: string) {
    const db = getDatabase();
    db.prepare('UPDATE verification_codes SET used = 1 WHERE user_id = ? AND used = 0').run(userId);
  },

  markVerificationUsed(id: string) {
    const db = getDatabase();
    db.prepare('UPDATE verification_codes SET used = 1 WHERE id = ?').run(id);
  },
  incrementVerificationAttempts(id: string) {
    const db = getDatabase();
    db.prepare('UPDATE verification_codes SET attempts = attempts + 1 WHERE id = ?').run(id);
  },

  // Password resets
  createPasswordReset(userId: string, tokenHash: string, expiresAt: string) {
    const db = getDatabase();
    const id = Date.now().toString();
    const now = new Date().toISOString();
    db.prepare(`INSERT INTO password_resets (id, user_id, token_hash, expires_at, used, attempts, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)`)
      .run(id, userId, tokenHash, expiresAt, 0, 0, now);
    return id;
  },

  getActivePasswordReset(userId: string) {
    const db = getDatabase();
    const now = new Date().toISOString();
    const row = db.prepare('SELECT * FROM password_resets WHERE user_id = ? AND used = 0 AND expires_at > ? ORDER BY created_at DESC LIMIT 1').get(userId, now) as any;
    return row || null;
  },

  markPasswordResetUsed(id: string) {
    const db = getDatabase();
    db.prepare('UPDATE password_resets SET used = 1 WHERE id = ?').run(id);
  },
  incrementPasswordResetAttempts(id: string) {
    const db = getDatabase();
    db.prepare('UPDATE password_resets SET attempts = attempts + 1 WHERE id = ?').run(id);
  },

  // Sessions
  createSession(userId: string, token: string, expiresAt?: string) {
    const db = getDatabase();
    const id = Date.now().toString();
    const now = new Date().toISOString();
    db.prepare(`INSERT INTO user_sessions (id, user_id, token, created_at, expires_at)
      VALUES (?, ?, ?, ?, ?)`).run(id, userId, token, now, expiresAt || null);
    return id;
  },

  findSessionByToken(token: string) {
    const db = getDatabase();
    const now = new Date().toISOString();
    const row = db.prepare('SELECT * FROM user_sessions WHERE token = ? AND (expires_at IS NULL OR expires_at > ?) LIMIT 1').get(token, now) as any;
    return row || null;
  },

  invalidateSession(token: string) {
    const db = getDatabase();
    db.prepare('DELETE FROM user_sessions WHERE token = ?').run(token);
  }
};
