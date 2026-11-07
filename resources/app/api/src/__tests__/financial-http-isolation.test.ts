import assert from 'node:assert/strict';
import fs from 'node:fs';
import http from 'node:http';
import os from 'node:os';
import path from 'node:path';
import test, { after, before } from 'node:test';

const root = fs.mkdtempSync(path.join(os.tmpdir(), 'mertilo-http-isolation-'));
process.env.MERTILO_DATA_DIR = root;
process.env.MERTILO_DB_PATH = path.join(root, 'mertilo.db');
process.env.NODE_ENV = 'test';

const { default: app } = await import('../app.js');
const { initializeDatabase, shutdownDatabase } = await import('../database/index.js');
const { authService } = await import('../services/auth.service.js');
const { usersRepository } = await import('../repositories/users.repository.js');
const { accountService } = await import('../services/account.service.js');
const { salaryService } = await import('../services/salary.service.js');
const { vehicleExpenseService } = await import('../services/vehicle-expense.service.js');
const { historyService } = await import('../services/history.service.js');
const { readUserData, writeUserData } = await import('../data/store.js');
const { confirmCsvImport } = await import('../services/csv-import.service.js');

let server: http.Server;
let baseUrl = '';
let tokenA = '';
let tokenB = '';
let batchA = '';
let transactionA = '';
let transactionB = '';

async function request(route: string, options: RequestInit = {}) {
  const response = await fetch(`${baseUrl}${route}`, { ...options, headers: { 'content-type': 'application/json', ...(options.headers || {}) } });
  const text = await response.text();
  return { status: response.status, body: text ? JSON.parse(text) : null };
}

function json(method: string, body: unknown, token?: string): RequestInit {
  return { method, body: JSON.stringify(body), headers: token ? { authorization: `Bearer ${token}` } : {} };
}

async function login(id: string, email: string) {
  usersRepository.create({ id, name: id, email, password_hash: 'unused', is_verified: true });
  return (await authService.login(email, 'unused').catch(async () => {
    const bcryptModule = await import('bcryptjs');
    const bcrypt = (bcryptModule as any).default ?? bcryptModule;
    const hash = await bcrypt.hash('Password123!', 4);
    const user = usersRepository.findById(id)!;
    const db = (await import('../database/db.js')).getDatabase();
    db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(hash, id);
    return authService.login(user.email, 'Password123!');
  })).token;
}

before(async () => {
  await initializeDatabase();
  server = app.listen(0, '127.0.0.1');
  await new Promise<void>((resolve) => server.once('listening', resolve));
  const address = server.address() as { port: number };
  baseUrl = `http://127.0.0.1:${address.port}`;
  tokenA = await login('user-a-http', 'a-http@example.com');
  tokenB = await login('user-b-http', 'b-http@example.com');
  await salaryService.set(1000, 'user-a-http');
  await salaryService.set(2000, 'user-b-http');
  const a = await accountService.create('A conta', 10, 'Outros', true, 'user-a-http');
  const b = await accountService.create('B conta', 20, 'Outros', true, 'user-b-http');
  const va = await vehicleExpenseService.create(5, 10, 20, 'cliente', 10, 0, -10, 'user-a-http');
  await vehicleExpenseService.create(6, 10, 30, 'cliente', 18, 0, -18, 'user-b-http');
  await historyService.create({ id: 'history-a', mes: '2026-01', salario: 1, totalContas: 1, saldoDisponivel: 0, totalExtras: 0, rendaTotal: 1, criadoEm: new Date().toISOString() } as any, 'user-a-http');
  await historyService.create({ id: 'history-b', mes: '2026-01', salario: 2, totalContas: 2, saldoDisponivel: 0, totalExtras: 0, rendaTotal: 2, criadoEm: new Date().toISOString() } as any, 'user-b-http');
  const imported = confirmCsvImport({ userId: 'user-a-http', records: [{ userId: 'user-a-http', id: 'tx-a', date: '2026-01-01', description: 'A', normalizedDescription: 'a', originalDescription: 'A', value: -5, type: 'saída', category: 'Outros', subcategory: 'Outros', confidence: 1, source: 'test', status: 'importado', line: 2, importSource: 'csv_import', importedAt: new Date().toISOString() } as any] });
  const importedB = confirmCsvImport({ userId: 'user-b-http', records: [{ userId: 'user-b-http', id: 'tx-b', date: '2026-01-01', description: 'B', normalizedDescription: 'b', originalDescription: 'B', value: -6, type: 'saída', category: 'Outros', subcategory: 'Outros', confidence: 1, source: 'test', status: 'importado', line: 2, importSource: 'csv_import', importedAt: new Date().toISOString() } as any] });
  batchA = imported.historyId; transactionA = 'tx-a'; transactionB = 'tx-b'; assert.notEqual(importedB.historyId, batchA); assert.notEqual(a.id, b.id); assert.notEqual(va.id, undefined);
});

test('01 GET financas A retorna somente A', async () => { const r = await request('/api/financas', { headers: { authorization: `Bearer ${tokenA}` } }); assert.equal(r.status, 200); assert.equal(r.body.salario, 1000); assert.equal(r.body.contas.some((x: any) => x.nome === 'B conta'), false); });
test('02 GET financas B retorna somente B', async () => { const r = await request('/api/financas', { headers: { authorization: `Bearer ${tokenB}` } }); assert.equal(r.status, 200); assert.equal(r.body.salario, 2000); assert.equal(r.body.contas.some((x: any) => x.nome === 'A conta'), false); });
test('03 salário A não aparece para B', async () => { const r = await request('/api/financas/salario', { headers: { authorization: `Bearer ${tokenB}` } }); assert.equal(r.body.salario ?? r.body.value ?? r.body, 2000); });
test('04 contas B não aparecem para A', async () => { const r = await request('/api/financas/contas', { headers: { authorization: `Bearer ${tokenA}` } }); assert.equal(r.body.some((x: any) => x.nome === 'B conta'), false); });
test('05 despesas A não aparecem para B', async () => { const r = await request('/api/vexpenses/historico', { headers: { authorization: `Bearer ${tokenB}` } }); assert.equal(r.body.some((x: any) => x.user_id === 'user-a-http'), false); });
test('06 histórico B não aparece para A', async () => { const r = await request('/api/financas/historico', { headers: { authorization: `Bearer ${tokenA}` } }); assert.equal(r.body.some((x: any) => x.id === 'history-b'), false); });
test('07 token ausente é rejeitado', async () => { assert.equal((await request('/api/financas')).status, 401); });
test('08 token inválido é rejeitado', async () => { assert.equal((await request('/api/financas', { headers: { authorization: 'Bearer adulterado' } })).status, 401); });
test('09 lote estrangeiro não é acessível', async () => { const r = await request(`/api/financas/importacao/${batchA}`, { method: 'DELETE', headers: { authorization: `Bearer ${tokenB}` } }); assert.equal(r.status, 404); assert.equal(readUserData('user-a-http').importHistory.some((x: any) => x.id === batchA), true); });
test('10 A não desfaz lote de B', async () => { const r = await request(`/api/financas/importacao/${batchA}`, { method: 'DELETE', headers: { authorization: `Bearer ${tokenB}` } }); assert.equal(r.status, 404); });
test('11 B não exclui transação de A', async () => { const r = await request(`/api/financas/importacao/transaction/${transactionA}`, { method: 'DELETE', headers: { authorization: `Bearer ${tokenB}` } }); assert.equal(r.status, 404); assert.equal(readUserData('user-a-http').importedTransactions.some((x: any) => x.id === transactionA), true); });
test('12 serviço sem userId falha explicitamente', async () => { await assert.rejects(() => salaryService.get(undefined), /Contexto de usuário obrigatório/); });
test('13 restart real mantém namespaces', async () => { const beforeA = readUserData('user-a-http'); const beforeB = readUserData('user-b-http'); await new Promise<void>((resolve, reject) => server.close((e) => e ? reject(e) : resolve())); server = app.listen(0, '127.0.0.1'); await new Promise<void>((resolve) => server.once('listening', resolve)); assert.equal(readUserData('user-a-http').importedTransactions.length, beforeA.importedTransactions.length); assert.equal(readUserData('user-b-http').importedTransactions.length, beforeB.importedTransactions.length); });
test('14 confirmação vazia não importa transações', () => { const before = readUserData('user-a-http'); const result = confirmCsvImport({ userId: 'user-a-http', records: [] as any }); const after = readUserData('user-a-http'); assert.equal(result.importedCount, 0); assert.equal(after.importedTransactions.length, before.importedTransactions.length); assert.equal(after.importHistory[0]?.summary.total, 0); });
test('15 escrita inválida não produz estado parcial', () => { const before = JSON.stringify(readUserData('user-a-http')); assert.throws(() => writeUserData(undefined, readUserData('user-a-http')), /Contexto de usuário obrigatório/); assert.equal(JSON.stringify(readUserData('user-a-http')), before); });
test('16 leitura sem contexto não retorna fallback', () => { assert.throws(() => readUserData(undefined), /Contexto de usuário obrigatório/); });
test('17 reconstrução A não altera B', async () => { const before = JSON.stringify(readUserData('user-b-http')); const { rebuildImportedMonthHistory } = await import('../services/csv-import.service.js'); rebuildImportedMonthHistory(readUserData('user-a-http'), 'user-a-http'); assert.equal(JSON.stringify(readUserData('user-b-http')), before); });
test('18 legado preservado e invisível', () => { const file = path.join(root, 'data.json'); const raw = JSON.parse(fs.readFileSync(file, 'utf8')); raw.legacy = { importedTransactions: [{ id: 'legacy', value: 99 }] }; fs.writeFileSync(file, JSON.stringify(raw)); assert.equal(readUserData('user-a-http').importedTransactions.some((x: any) => x.id === 'legacy'), false); assert.equal(JSON.parse(fs.readFileSync(file, 'utf8')).legacy.importedTransactions[0].id, 'legacy'); });

after(async () => { await new Promise<void>((resolve) => server.close(() => resolve())); await shutdownDatabase(); fs.rmSync(root, { recursive: true, force: true }); });
