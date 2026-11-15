/**
 * Testes de concorrência do reenvio de códigos de verificação.
 *
 * A regra de negócio é consistente:
 * - reenvio imediato dentro da janela é rejeitado;
 * - duas ou mais requisições concorrentes só podem criar um novo código quando
 *   o código anterior já saiu da janela de espera;
 * - cada usuário é tratado de forma isolada;
 * - a concorrência entre processos usa o SQLite real e não o mutex em memória.
 */
import test from 'node:test';
import assert from 'node:assert';
import path from 'node:path';
import fs from 'node:fs';
import os from 'node:os';
import { assertRealOverlap, formatTimeline, outcomeOf, runCrossProcessRace } from './helpers/cross-process-race.js';

const VERIFICATION_RETRY_INTERVAL_MS = 60 * 1000;

const TEMP_DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'mertilo-concurrency-'));
const DB_PATH = path.join(TEMP_DIR, `concurrency.${Date.now()}.db`);

process.env.MERTILO_DB_PATH = DB_PATH;
process.env.NODE_ENV = 'test';
process.env.EMAIL_PROVIDER = 'mock';

type TestDb = import('better-sqlite3').Database;

let db: TestDb;
let authService: typeof import('../services/auth.service.js').authService;
let usersRepository: typeof import('../repositories/users.repository.js').usersRepository;
let getDatabase: typeof import('../database/db.js').getDatabase;
let closeDatabase: typeof import('../database/db.js').closeDatabase;

async function setup() {
  ({ authService } = await import('../services/auth.service.js'));
  ({ usersRepository } = await import('../repositories/users.repository.js'));
  ({ getDatabase, closeDatabase } = await import('../database/db.js'));
  const { runMigrations } = await import('../database/migrations.js');

  db = getDatabase();
  runMigrations(db);
}

function teardown() {
  try { closeDatabase(); } catch { /* ignore */ }
  try { fs.rmSync(TEMP_DIR, { recursive: true, force: true }); } catch { /* ignore */ }
}

function codesFor(email: string) {
  return db
    .prepare(
      `SELECT * FROM verification_codes WHERE user_id = (SELECT id FROM users WHERE lower(email) = ?) ORDER BY created_at DESC, rowid DESC`,
    )
    .all(email.toLowerCase()) as any[];
}

function activeCodesFor(email: string) {
  const now = new Date().toISOString();
  return db
    .prepare(
      `SELECT * FROM verification_codes
       WHERE user_id = (SELECT id FROM users WHERE lower(email) = ?)
         AND used = 0 AND expires_at > ?
       ORDER BY created_at DESC, rowid DESC`,
    )
    .all(email.toLowerCase(), now) as any[];
}

async function register(email: string) {
  const result: any = await authService.register('Concorrência User', email, 'Password123!', true, '1990-01-01');
  return result.verification_code as string;
}

function shiftCreatedAt(email: string, deltaMs: number) {
  const target = new Date(Date.now() + deltaMs).toISOString();
  db.prepare(
    `UPDATE verification_codes SET created_at = ?
     WHERE user_id = (SELECT id FROM users WHERE lower(email) = ?)`,
  ).run(target, email.toLowerCase());
}

// ---------------------------------------------------------------------------
// Grupo 1 — Concorrência
// ---------------------------------------------------------------------------

test('Grupo 1: duas requisições simultâneas para o mesmo usuário após a janela criam apenas um código ativo', async (t) => {
  await setup();
  t.after(teardown);

  const email = 'a.simultaneous@example.com';
  await register(email);
  shiftCreatedAt(email, -(VERIFICATION_RETRY_INTERVAL_MS + 1000));

  const results = await Promise.all([
    authService.resendVerification(email).then(() => 'ok' as const).catch((e: Error) => e),
    authService.resendVerification(email).then(() => 'ok' as const).catch((e: Error) => e),
  ]);

  const succeeded = results.filter((r) => r === 'ok').length;
  const failed = results.filter((r) => r !== 'ok') as Error[];

  assert.strictEqual(succeeded, 1, 'apenas uma requisição deve succeed após a janela');
  assert.strictEqual(failed.length, 1, 'a segunda requisição deve falhar');
  assert.match(failed[0].message, /Aguarde um momento/i);

  assert.strictEqual(codesFor(email).length, 2, 'deve existir 1 código do cadastro + 1 do reenvio');
  assert.strictEqual(activeCodesFor(email).length, 1, 'não pode haver dois códigos ativos');
});

test('Grupo 1: cinco requisições simultâneas para o mesmo usuário respeitam a regra de exclusão mútua', async (t) => {
  await setup();
  t.after(teardown);

  const email = 'b.multiple@example.com';
  await register(email);
  shiftCreatedAt(email, -(VERIFICATION_RETRY_INTERVAL_MS + 1000));

  const results = await Promise.all(
    Array.from({ length: 5 }, () =>
      authService.resendVerification(email).then(() => 'ok' as const).catch((e: Error) => e),
    ),
  );

  const succeeded = results.filter((r) => r === 'ok').length;
  const failed = results.filter((r) => r !== 'ok') as Error[];

  assert.strictEqual(succeeded, 1, 'apenas uma requisição deve succeed');
  assert.strictEqual(failed.length, 4, 'as demais devem ser rejeitadas pela janela');
  for (const err of failed) {
    assert.match(err.message, /Aguarde um momento|Muitas tentativas/i);
  }

  assert.strictEqual(codesFor(email).length, 2, 'somente um código novo deve persistir');
  assert.strictEqual(activeCodesFor(email).length, 1, 'há exatamente um código ativo');
});

test('Grupo 1: concorrência entre usuários diferentes não se interfere', async (t) => {
  await setup();
  t.after(teardown);

  const emails = ['c.user1@example.com', 'c.user2@example.com', 'c.user3@example.com'];
  for (const email of emails) {
    await register(email);
    shiftCreatedAt(email, -(VERIFICATION_RETRY_INTERVAL_MS + 1000));
  }

  const results = await Promise.all(
    emails.map((email) =>
      authService.resendVerification(email).then(() => 'ok' as const).catch((e: Error) => e),
    ),
  );

  assert.deepStrictEqual(results, ['ok', 'ok', 'ok'], 'cada usuário deve poder reenviar independentemente');

  for (const email of emails) {
    assert.strictEqual(codesFor(email).length, 2, `${email}: 1 código do cadastro + 1 do reenvio`);
    assert.strictEqual(activeCodesFor(email).length, 1, `${email}: exatamente 1 código ativo`);
  }
});

test('Grupo 1: concorrência entre processos independentes para o mesmo usuário mantém integridade do SQLite', async (t) => {
  await setup();
  t.after(teardown);

  const email = 'd.process@example.com';
  await register(email);
  shiftCreatedAt(email, -(VERIFICATION_RETRY_INTERVAL_MS + 1000));

  // Barreira de prontidão + portão de contenção: dois processos filhos (memórias independentes)
  // disparam juntos sobre o MESMO arquivo SQLite, com o pai segurando o lock até ambos baterem no BEGIN IMMEDIATE.
  const race = await runCrossProcessRace({
    tempDir: TEMP_DIR,
    gateDb: db,
    calls: [
      { method: 'resendVerification', args: [email] },
      { method: 'resendVerification', args: [email] },
    ],
  });
  for (const line of formatTimeline(race)) t.diagnostic(line);

  // Integridade primeiro (validada diretamente no banco compartilhado).
  const outcomes = race.children.map(outcomeOf);
  const successCount = outcomes.filter((o) => o.ok).length;

  assert.strictEqual(successCount, 1, 'apenas uma requisição em processo filho deve criar o novo código');
  assert.strictEqual(codesFor(email).length, 2, 'somente 1 código novo deve persistir no banco compartilhado');
  assert.strictEqual(activeCodesFor(email).length, 1, 'não podem existir códigos ativos duplicados');

  // Prova de concorrência real: barreira, sobreposição, exclusão mútua e rejeição sob o lock.
  assertRealOverlap(race, { loserMessage: /Aguarde um momento/i });
  assert.strictEqual(db.inTransaction, false, 'o pai não pode ficar com o portão de contenção aberto');
});

// ---------------------------------------------------------------------------
// Grupo 2 — Janela de espera
// ---------------------------------------------------------------------------
test('Grupo 2: reenvio imediato é bloqueado e liberado após a janela', async (t) => {
  await setup();
  t.after(teardown);

  const email = 'e.window@example.com';
  await register(email);

  await assert.rejects(() => authService.resendVerification(email), /Aguarde um momento/i);
  assert.strictEqual(codesFor(email).length, 1, 'nenhum novo código deve ter sido criado antes da janela');

  shiftCreatedAt(email, -(VERIFICATION_RETRY_INTERVAL_MS + 1000));
  const result: any = await authService.resendVerification(email);
  assert.ok(result.code, 'o reenvio após a janela deve retornar um código novo');
  assert.strictEqual(codesFor(email).length, 2, 'após a janela, um código novo deve existir');
  assert.strictEqual(activeCodesFor(email).length, 1, 'exatamente um código deve ficar ativo');
});

// ---------------------------------------------------------------------------
// Grupo 3 — Ciclo de vida do código
// ---------------------------------------------------------------------------
test('Grupo 3: código anterior é invalidado e o novo código pode ser usado após o reenvio', async (t) => {
  await setup();
  t.after(teardown);

  const email = 'f.lifecycle@example.com';
  const firstCode = await register(email);

  shiftCreatedAt(email, -(VERIFICATION_RETRY_INTERVAL_MS + 1000));
  const resent: any = await authService.resendVerification(email);
  const secondCode = resent.code as string;
  assert.ok(secondCode, 'o reenvio deve retornar um código novo');
  assert.notStrictEqual(secondCode, firstCode, 'os códigos não devem repetir');

  await assert.rejects(() => authService.verifyEmail(email, firstCode), /Código inválido|Código não encontrado ou expirado/i);
  const verifiedAgain: any = await authService.verifyEmail(email, secondCode);
  assert.ok(verifiedAgain.token, 'o novo código deve validar corretamente');
  assert.strictEqual(activeCodesFor(email).length, 0, 'nenhum código ativo deve ficar após o uso');
});

test('Grupo 3: falha durante a transação faz rollback e a conexão volta ao estado íntegro', async (t) => {
  await setup();
  t.after(teardown);

  const email = 'g.rollback@example.com';
  await register(email);
  shiftCreatedAt(email, -(VERIFICATION_RETRY_INTERVAL_MS + 1000));

  const before = codesFor(email).length;
  const originalCreate = usersRepository.createVerificationCode;
  (usersRepository as any).createVerificationCode = () => {
    throw new Error('falha injetada dentro da transação');
  };

  await assert.rejects(() => authService.resendVerification(email), /falha injetada dentro da transação/);

  (usersRepository as any).createVerificationCode = originalCreate;

  assert.strictEqual(codesFor(email).length, before, 'nenhum registro parcial pode persistir');
  assert.strictEqual(db.inTransaction, false, 'a conexão não pode ficar em transação aberta');

  shiftCreatedAt(email, -(VERIFICATION_RETRY_INTERVAL_MS + 1000));
  const result: any = await authService.resendVerification(email);
  assert.ok(result.code, 'nova operação deve funcionar depois do rollback');
  assert.strictEqual(activeCodesFor(email).length, 1, 'a operação seguinte deve deixar um código ativo único');
});


