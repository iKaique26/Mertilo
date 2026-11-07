import assert from 'node:assert/strict';
import fs from 'node:fs';
import http from 'node:http';
import os from 'node:os';
import path from 'node:path';
import { spawn } from 'node:child_process';
import test, { after, before } from 'node:test';

const root = fs.mkdtempSync(path.join(os.tmpdir(), 'mertilo-integrity-'));
process.env.MERTILO_DATA_DIR = root;
process.env.MERTILO_DB_PATH = path.join(root, 'mertilo.db');
process.env.NODE_ENV = 'test';

const { default: app } = await import('../app.js');
const { initializeDatabase, shutdownDatabase } = await import('../database/index.js');
const { usersRepository } = await import('../repositories/users.repository.js');
const { authService } = await import('../services/auth.service.js');
const { readUserData, writeUserData } = await import('../data/store.js');
const { accountService } = await import('../services/account.service.js');
const { salaryService } = await import('../services/salary.service.js');
const { vehicleExpenseService } = await import('../services/vehicle-expense.service.js');
const { historyService } = await import('../services/history.service.js');

let server: http.Server;
let baseUrl = '';
let tokenA = '';
let tokenB = '';

async function request(route: string, options: RequestInit = {}) {
  const response = await fetch(`${baseUrl}${route}`, { ...options, headers: { 'content-type': 'application/json', ...(options.headers || {}) } });
  const text = await response.text();
  return { status: response.status, body: text ? JSON.parse(text) : null };
}

function json(method: string, body: unknown, token: string): RequestInit {
  return { method, body: JSON.stringify(body), headers: { authorization: `Bearer ${token}` } };
}

async function createUser(id: string, email: string): Promise<string> {
  const bcryptModule = await import('bcryptjs');
  const bcrypt = (bcryptModule as any).default ?? bcryptModule;
  const hash = await bcrypt.hash('Password123!', 4);
  usersRepository.create({ id, name: id, email, password_hash: hash, is_verified: true });
  return (await authService.login(email, 'Password123!')).token;
}

async function waitForHealth(port: number): Promise<void> {
  for (let attempt = 0; attempt < 100; attempt += 1) {
    try {
      const response = await fetch(`http://127.0.0.1:${port}/api/health`);
      if (response.ok) return;
    } catch { /* child still starting */ }
    await new Promise((resolve) => setTimeout(resolve, 25));
  }
  throw new Error('child process HTTP server did not start');
}

before(async () => {
  await initializeDatabase();
  server = app.listen(0, '127.0.0.1');
  await new Promise<void>((resolve) => server.once('listening', resolve));
  baseUrl = `http://127.0.0.1:${(server.address() as { port: number }).port}`;
  tokenA = await createUser('integrity-a', 'integrity-a@example.com');
  tokenB = await createUser('integrity-b', 'integrity-b@example.com');
  await salaryService.set(1111, 'integrity-a');
  await salaryService.set(2222, 'integrity-b');
  await accountService.create('A persistida', 10, 'Outros', true, 'integrity-a');
  await accountService.create('B persistida', 20, 'Outros', true, 'integrity-b');
  await vehicleExpenseService.create(5, 10, 20, 'cliente', 10, 0, -10, 'integrity-a');
  await vehicleExpenseService.create(6, 10, 30, 'cliente', 18, 0, -18, 'integrity-b');
  await historyService.create({ id: 'integrity-history-a', mes: '2026-01', salario: 1, totalContas: 1, saldoDisponivel: 0, totalExtras: 0, rendaTotal: 1, criadoEm: new Date().toISOString() } as any, 'integrity-a');
  await historyService.create({ id: 'integrity-history-b', mes: '2026-01', salario: 2, totalContas: 2, saldoDisponivel: 0, totalExtras: 0, rendaTotal: 2, criadoEm: new Date().toISOString() } as any, 'integrity-b');
});

test('falha real de leitura não usa fallback nem destrói arquivo', () => {
  const file = path.join(root, 'data.json');
  const before = fs.readFileSync(file, 'utf8');
  process.env.MERTILO_TEST_STORAGE_FAILURE = 'read';
  assert.throws(() => readUserData('integrity-a'), /Falha de armazenamento injetada: read/);
  delete process.env.MERTILO_TEST_STORAGE_FAILURE;
  assert.equal(fs.readFileSync(file, 'utf8'), before);
});

test('JSON corrompido falha sem fallback owner-scoped', () => {
  const file = path.join(root, 'data.json');
  const before = fs.readFileSync(file, 'utf8');
  fs.writeFileSync(file, '{corrompido', 'utf8');
  assert.throws(() => readUserData('integrity-a'), /SyntaxError|Expected property/);
  fs.writeFileSync(file, before, 'utf8');
  assert.equal(readUserData('integrity-a').salario, 0);
});

test('falhas reais de escrita preservam estado persistido', () => {
  const before = fs.readFileSync(path.join(root, 'data.json'), 'utf8');
  const current = readUserData('integrity-a');
  for (const stage of ['write-before', 'write-after-temp', 'rename'] as const) {
    process.env.MERTILO_TEST_STORAGE_FAILURE = stage;
    assert.throws(() => writeUserData('integrity-a', { ...current, salario: 9999 }), /Falha de armazenamento injetada/);
    assert.equal(fs.readFileSync(path.join(root, 'data.json'), 'utf8'), before);
  }
  delete process.env.MERTILO_TEST_STORAGE_FAILURE;
  assert.equal(readUserData('integrity-a').salario, 0);
  assert.equal(readUserData('integrity-b').salario, 0);
});

test('falha posterior em confirmação não grava estado parcial', async () => {
  const before = fs.readFileSync(path.join(root, 'data.json'), 'utf8');
  const csv = 'Data;Descricao;Debito;Credito\n01/08/2026;Falha;10,00;';
  const preview = await request('/api/financas/importacao/preview', json('POST', { csvText: csv, fileName: 'rollback.csv' }, tokenA));
  assert.equal(preview.status, 200);
  process.env.MERTILO_TEST_STORAGE_FAILURE = 'rename';
  const confirmation = await request('/api/financas/importacao/confirm', json('POST', { records: preview.body.records, fileName: 'rollback.csv' }, tokenA));
  delete process.env.MERTILO_TEST_STORAGE_FAILURE;
  assert.equal(confirmation.status, 400);
  assert.equal(fs.readFileSync(path.join(root, 'data.json'), 'utf8'), before);
  assert.equal(readUserData('integrity-b').salario, 0);
});

test('Nubank e Neon passam por preview, confirmação, consulta e undo HTTP isolados', async () => {
  const fixtures = [
    ['Nubank', 'Data;Descricao;Debito;Credito\n01/08/2026;Nubank compra;2.896,62;\n02/08/2026;Nubank entrada;;5000,00'],
    ['Neon', 'Data;Descricao;Debito;Credito\n03/09/2026;Neon compra;45,90;\n04/09/2026;Neon entrada;;1.234,56'],
  ] as const;
  const batches: string[] = [];
  for (const [bank, csv] of fixtures) {
    const ownerToken = bank === 'Nubank' ? tokenA : tokenB;
    const otherToken = bank === 'Nubank' ? tokenB : tokenA;
    const preview = await request('/api/financas/importacao/preview', json('POST', { csvText: csv, fileName: `${bank}.csv` }, ownerToken));
    assert.equal(preview.status, 200);
    assert.equal(preview.body.errors.length, 0);
    assert.ok(preview.body.records.some((record: any) => Number(record.value) > 0));
    assert.ok(preview.body.records.some((record: any) => Number(record.value) < 0));
    const duplicatePreview = await request('/api/financas/importacao/preview', json('POST', { csvText: csv, fileName: `${bank}-duplicate.csv`, mapping: { account: bank }, existingRecords: preview.body.records }, ownerToken));
    assert.ok(duplicatePreview.body.summary.duplicates >= 0);
    assert.equal(duplicatePreview.status, 200);
    const confirmation = await request('/api/financas/importacao/confirm', json('POST', { records: preview.body.records, fileName: `${bank}.csv` }, ownerToken));
    assert.equal(confirmation.status, 200);
    batches.push(confirmation.body.historyId);
    const own = await request('/api/financas', { headers: { authorization: `Bearer ${ownerToken}` } });
    const foreign = await request('/api/financas', { headers: { authorization: `Bearer ${otherToken}` } });
    assert.ok(own.body.importHistory.some((batch: any) => batch.id === confirmation.body.historyId));
    assert.equal(foreign.body.importHistory.some((batch: any) => batch.id === confirmation.body.historyId), false);
    assert.ok(Array.isArray(own.body.importedTransactions));
  }
  for (const [index, batchId] of batches.entries()) {
    const ownerToken = index === 0 ? tokenA : tokenB;
    const undone = await request(`/api/financas/importacao/${batchId}`, { method: 'DELETE', headers: { authorization: `Bearer ${ownerToken}` } });
    assert.equal(undone.status, 200);
  }
});

test('restart real em child process preserva todo namespace HTTP', async () => {
  const beforeA = await request('/api/financas', { headers: { authorization: `Bearer ${tokenA}` } });
  const beforeB = await request('/api/financas', { headers: { authorization: `Bearer ${tokenB}` } });
  await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  await shutdownDatabase();
  const distIndex = path.resolve(process.cwd(), 'dist/index.js');
  const port = 6300 + Math.floor(Math.random() * 500);
  const child = spawn(process.execPath, [distIndex], { env: { ...process.env, PORT: String(port), MERTILO_DATA_DIR: root, MERTILO_DB_PATH: path.join(root, 'mertilo.db'), NODE_ENV: 'test' }, stdio: 'ignore' });
  try {
    await waitForHealth(port);
    const afterA = await fetch(`http://127.0.0.1:${port}/api/financas`, { headers: { authorization: `Bearer ${tokenA}` } }).then((response) => response.json());
    const afterB = await fetch(`http://127.0.0.1:${port}/api/financas`, { headers: { authorization: `Bearer ${tokenB}` } }).then((response) => response.json());
    assert.deepEqual(afterA, beforeA.body);
    assert.deepEqual(afterB, beforeB.body);
  } finally {
    child.kill();
    await new Promise<void>((resolve) => child.once('exit', () => resolve()));
  }
});

after(async () => {
  if (server.listening) await new Promise<void>((resolve) => server.close(() => resolve()));
  await shutdownDatabase();
  fs.rmSync(root, { recursive: true, force: true });
});
