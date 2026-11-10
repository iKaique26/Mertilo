import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { createHash } from 'node:crypto';

process.env.NODE_ENV = 'test';
process.env.MERTILO_DB_PATH = path.join(process.cwd(), 'data', `mertilo.password-reset.${process.pid}.db`);

const { initializeDatabase, shutdownDatabase } = await import('../database/index.js');
const { getDatabase } = await import('../database/db.js');
const { usersRepository } = await import('../repositories/users.repository.js');
const { authService } = await import('../services/auth.service.js');
const { emailService } = await import('../services/email.service.js');

await initializeDatabase();

test.after(async () => {
  await shutdownDatabase();
});

async function createVerifiedUser(email: string, password = 'OldPassword123!') {
  const bcrypt = await import('bcryptjs');
  return usersRepository.create({
    name: 'Synthetic Reset User',
    email,
    password_hash: await bcrypt.default.hash(password, 10),
    is_verified: true,
  });
}

test('password reset persists SHA-256 only and delivery failure revokes created token', async () => {
  const user = await createVerifiedUser(`delivery.${Date.now()}@example.test`);
  const original = emailService.sendPasswordReset;
  emailService.sendPasswordReset = async () => { throw new Error('synthetic delivery failure'); };

  try {
    await assert.rejects(() => authService.forgotPassword(user.email), /synthetic delivery failure/);
    const row = getDatabase().prepare('SELECT token_hash, used FROM password_resets WHERE user_id = ? ORDER BY created_at DESC LIMIT 1').get(user.id) as { token_hash: string; used: number };
    assert.match(row.token_hash, /^[a-f0-9]{64}$/);
    assert.equal(row.used, 1);
  } finally {
    emailService.sendPasswordReset = original;
  }
});

test('simultaneous reset consumes one token once and invalidates old sessions', async () => {
  const user = await createVerifiedUser(`concurrent.${Date.now()}@example.test`);
  const priorLogin = await authService.login(user.email, 'OldPassword123!');
  const original = emailService.sendPasswordReset;
  emailService.sendPasswordReset = async () => ({ provider: 'mock' } as any);

  try {
    const issued = await authService.forgotPassword(user.email) as { token: string };
    assert.equal(issued.token.length, 64);
    const tokenHash = createHash('sha256').update(issued.token).digest('hex');
    const stored = getDatabase().prepare('SELECT token_hash FROM password_resets WHERE user_id = ? ORDER BY created_at DESC LIMIT 1').get(user.id) as { token_hash: string };
    assert.equal(stored.token_hash, tokenHash);
    assert.notEqual(stored.token_hash, issued.token);

    const results = await Promise.allSettled([
      authService.resetPassword(issued.token, 'WinnerPassword123!'),
      authService.resetPassword(issued.token, 'LoserPassword123!'),
    ]);
    assert.equal(results.filter((result) => result.status === 'fulfilled').length, 1);
    assert.equal(results.filter((result) => result.status === 'rejected').length, 1);
    await assert.rejects(() => authService.login(user.email, 'OldPassword123!'));
    const winner = results[0].status === 'fulfilled' ? 'WinnerPassword123!' : 'LoserPassword123!';
    await authService.login(user.email, winner);
    assert.equal(usersRepository.findSessionByToken(priorLogin.token), null);
    const reset = getDatabase().prepare('SELECT used FROM password_resets WHERE token_hash = ?').get(tokenHash) as { used: number };
    assert.equal(reset.used, 1);
  } finally {
    emailService.sendPasswordReset = original;
  }
});

test('expired, altered, and malformed reset tokens cannot change password', async () => {
  const user = await createVerifiedUser(`invalid.${Date.now()}@example.test`);
  const rawToken = 'a'.repeat(64);
  const hash = createHash('sha256').update(rawToken).digest('hex');
  getDatabase().prepare('INSERT INTO password_resets (id, user_id, token_hash, expires_at, used, attempts, created_at) VALUES (?, ?, ?, ?, 0, 0, ?)')
    .run(`expired-${Date.now()}`, user.id, hash, new Date(Date.now() - 1).toISOString(), new Date().toISOString());

  await assert.rejects(() => authService.resetPassword(rawToken, 'ChangedPassword123!'));
  await assert.rejects(() => authService.resetPassword(`${rawToken.slice(0, -1)}b`, 'ChangedPassword123!'));
  await assert.rejects(() => authService.resetPassword('', 'ChangedPassword123!'));
  await authService.login(user.email, 'OldPassword123!');
});
