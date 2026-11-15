import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { assertRealOverlap, formatTimeline, outcomeOf, runCrossProcessRace } from './helpers/cross-process-race.js';

// Isolamento: banco SQLite temporário (fora do diretório data/ do projeto), descartado em test.after.
const TEST_DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'mertilo-password-reset-'));
process.env.NODE_ENV = 'test';
process.env.MERTILO_DATA_DIR = TEST_DIR;
process.env.MERTILO_DB_PATH = path.join(TEST_DIR, 'mertilo.password-reset.db');

const { initializeDatabase, shutdownDatabase } = await import('../database/index.js');
const { getDatabase } = await import('../database/db.js');
const { usersRepository } = await import('../repositories/users.repository.js');
const { authService } = await import('../services/auth.service.js');
const { emailService } = await import('../services/email.service.js');

await initializeDatabase();

test.after(async () => {
  try { await shutdownDatabase(); } catch { /* ignore */ }
  fs.rmSync(TEST_DIR, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 });
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
  let resetToken = '';
  emailService.sendPasswordReset = async (_to, resetLink) => {
    resetToken = resetLink.match(/Reset-password\/([a-f0-9]{64})/)?.[1] ?? '';
    return { provider: 'mock' } as any;
  };

  try {
    await authService.forgotPassword(user.email);
    assert.equal(resetToken.length, 64);
    const issued = { token: resetToken };
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

test('logins do mesmo usuário no mesmo segundo geram tokens de sessão distintos e revogação é individual', async () => {
  const user = await createVerifiedUser(`unique.token.${Date.now()}@example.test`);
  const first = await authService.login(user.email, 'OldPassword123!');
  const second = await authService.login(user.email, 'OldPassword123!');
  assert.notEqual(first.token, second.token);

  await authService.logout(first.token);
  assert.equal(usersRepository.findSessionByToken(first.token), null);
  assert.ok(usersRepository.findSessionByToken(second.token));
});

test('cross-process simultaneous reset consumes the token once via SQLite, without a shared in-memory mutex', async (t) => {
  const user = await createVerifiedUser(`xproc.${Date.now()}@example.test`);
  await authService.login(user.email, 'OldPassword123!');
  await authService.login(user.email, 'OldPassword123!');
  assert.equal((getDatabase().prepare('SELECT COUNT(*) AS c FROM user_sessions WHERE user_id = ?').get(user.id) as { c: number }).c, 2);

  const original = emailService.sendPasswordReset;
  let resetToken = '';
  emailService.sendPasswordReset = async (_to, resetLink) => {
    resetToken = resetLink.match(/Reset-password\/([a-f0-9]{64})/)?.[1] ?? '';
    return { provider: 'mock' } as any;
  };

  try {
    await authService.forgotPassword(user.email);
    assert.equal(resetToken.length, 64);

    // Barreira de prontidão + portão de contenção: dois processos filhos (memórias independentes)
    // disparam juntos sobre o MESMO arquivo SQLite, com o pai segurando o lock até ambos baterem no BEGIN IMMEDIATE.
    const race = await runCrossProcessRace({
      tempDir: TEST_DIR,
      gateDb: getDatabase(),
      calls: [
        { method: 'resetPassword', args: [resetToken, 'ChildPasswordA123!'] },
        { method: 'resetPassword', args: [resetToken, 'ChildPasswordB123!'] },
      ],
    });
    for (const line of formatTimeline(race)) t.diagnostic(line);
    const [a, b] = race.children;

    // Integridade primeiro (validada diretamente no banco).
    for (const child of [a, b]) {
      assert.equal(child.exitCode, 0, `child failed: ${child.stderr.slice(0, 300)}`);
    }
    const outcomes = [a, b].map(outcomeOf);
    assert.equal(outcomes.filter((o) => o.ok).length, 1, JSON.stringify(outcomes));
    assert.equal(outcomes.filter((o) => !o.ok).length, 1, JSON.stringify(outcomes));

    const tokenHash = createHash('sha256').update(resetToken).digest('hex');
    const row = getDatabase().prepare('SELECT used FROM password_resets WHERE token_hash = ?').get(tokenHash) as { used: number };
    assert.equal(row.used, 1);
    assert.equal((getDatabase().prepare('SELECT COUNT(*) AS c FROM user_sessions WHERE user_id = ?').get(user.id) as { c: number }).c, 0);

    const winnerPassword = outcomes[0].ok ? 'ChildPasswordA123!' : 'ChildPasswordB123!';
    const loserPassword = outcomes[0].ok ? 'ChildPasswordB123!' : 'ChildPasswordA123!';
    await assert.rejects(() => authService.login(user.email, 'OldPassword123!'));
    await assert.rejects(() => authService.login(user.email, loserPassword));
    await authService.login(user.email, winnerPassword);

    // Prova de concorrência real (somente depois da integridade): barreira, sobreposição e exclusão mútua.
    assertRealOverlap(race, { loserMessage: /Token inválido ou já utilizado/ });
    const winnerChild = outcomes[0].ok ? a : b;
    const loserChild = outcomes[0].ok ? b : a;
    const consumeChanges = (child: typeof a) => child.events.find((e) => e.ev === 'consume')?.changes;
    assert.equal(consumeChanges(winnerChild), 1, 'vencedor consome o token (changes = 1)');
    assert.equal(consumeChanges(loserChild), 0, 'perdedor chega à região crítica e não consome nada (changes = 0)');
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
