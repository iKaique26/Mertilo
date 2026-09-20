import test from 'node:test';
import assert from 'node:assert';
import { spawn } from 'node:child_process';
import path from 'node:path';

const PORT = process.env.TEST_PORT || '6010';
const BASE = `http://127.0.0.1:${PORT}/api`;
let serverProc: any = null;

async function waitForServer(timeout = 15000) {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    try {
      const res = await fetch(`http://127.0.0.1:${PORT}/`);
      if (res.status < 500) return;
    } catch (err) {
      // ignore
    }
    await new Promise((r) => setTimeout(r, 250));
  }
  throw new Error('Server not ready');
}

async function api(pathUrl: string, opts: any = {}) {
  const url = `${BASE}${pathUrl}`;
  const res = await fetch(url, { ...opts, headers: { 'Content-Type': 'application/json', ...(opts.headers || {}) } });
  const text = await res.text();
  let body = null;
  try { body = text ? JSON.parse(text) : null; } catch { body = text; }
  return { status: res.status, body };
}

test('setup: start server', async () => {
  const testDb = path.join(process.cwd(), 'data', `mertilo.test.twousers.${Date.now()}.db`);
  serverProc = spawn(process.execPath, ['dist/index.js'], { env: { ...process.env, PORT, MERTILO_DB_PATH: testDb, NODE_ENV: 'test' }, stdio: ['ignore', 'pipe', 'pipe'] });
  serverProc.stdout?.on('data', (d: any) => process.stdout.write(`[server] ${d}`));
  serverProc.stderr?.on('data', (d: any) => process.stderr.write(`[server-err] ${d}`));
  await waitForServer(15000);
});

let tokenA: string;
let tokenB: string;
let idsA: Record<string, any> = {};

test('register and auth two users', async () => {
  const uA = await api('/auth/register', { method: 'POST', body: JSON.stringify({ name: 'User A', email: 'a@example.test', password: 'password' }) });
  assert.strictEqual(uA.status, 201);
  const codeA = uA.body.verification_code;
  const vA = await api('/auth/verify-email', { method: 'POST', body: JSON.stringify({ email: 'a@example.test', code: codeA }) });
  assert.strictEqual(vA.status, 200);
  const lA = await api('/auth/login', { method: 'POST', body: JSON.stringify({ email: 'a@example.test', password: 'password' }) });
  assert.strictEqual(lA.status, 200);
  tokenA = lA.body.token;

  const uB = await api('/auth/register', { method: 'POST', body: JSON.stringify({ name: 'User B', email: 'b@example.test', password: 'password' }) });
  assert.strictEqual(uB.status, 201);
  const codeB = uB.body.verification_code;
  const vB = await api('/auth/verify-email', { method: 'POST', body: JSON.stringify({ email: 'b@example.test', code: codeB }) });
  assert.strictEqual(vB.status, 200);
  const lB = await api('/auth/login', { method: 'POST', body: JSON.stringify({ email: 'b@example.test', password: 'password' }) });
  assert.strictEqual(lB.status, 200);
  tokenB = lB.body.token;
});

test('User A creates financial and IRPF resources', async () => {
  // Category (may be global)
  const cat = await api('/categories', { method: 'POST', headers: { Authorization: `Bearer ${tokenA}` }, body: JSON.stringify({ nome: 'Cat A', cor: '#fff', percentual: 0.1 }) });
  assert.strictEqual(cat.status, 201);
  idsA.category = cat.body.id;

  // Account
  const acc = await api('/financas/contas', { method: 'POST', headers: { Authorization: `Bearer ${tokenA}` }, body: JSON.stringify({ nome: 'Acc A', valor: 100, categoria: idsA.category, isFixed: false }) });
  assert.strictEqual(acc.status, 201);
  idsA.account = acc.body.id;

  // History / transaction
  const hist = await api('/financas/historico', { method: 'POST', headers: { Authorization: `Bearer ${tokenA}` }, body: JSON.stringify({ mes: '09/2026', salario: 1000, totalContas: 1, saldoDisponivel: 100, totalExtras: 0, rendaTotal: 1000 }) });
  assert.strictEqual(hist.status, 201);
  idsA.history = hist.body.id;

  // Salary config
  const sal = await api('/financas/salario', { method: 'POST', headers: { Authorization: `Bearer ${tokenA}` }, body: JSON.stringify({ salario: 1234 }) });
  assert.ok(sal.status === 200 || sal.status === 201);

  // IRPF exercise and document
  const ex = await api('/irpf/exercises', { method: 'POST', headers: { Authorization: `Bearer ${tokenA}` }, body: JSON.stringify({ year: 2026 }) });
  assert.strictEqual(ex.status, 201);
  idsA.exercise = ex.body.id;

  const doc = await api('/irpf/documents', { method: 'POST', headers: { Authorization: `Bearer ${tokenA}` }, body: JSON.stringify({ exercise_id: idsA.exercise, filename: 'd.pdf', file_path: '/tmp/d.pdf', file_type: 'pdf', mime_type: 'application/pdf', file_size: 10, document_type: 'holerite' }) });
  assert.strictEqual(doc.status, 201);
  idsA.document = doc.body.id;

  // Confirm document to create income
  const extracted = { documentType: 'holerite', holeriteData: { competencia: '09/2026', salario_bruto: 3000, empresa: 'ACME' }, fields: [{ name: 'salario_bruto', value: 3000, confidence: 90 }], confidence: 90 };
  await api(`/irpf/documents/${idsA.document}`, { method: 'PUT', headers: { Authorization: `Bearer ${tokenA}` }, body: JSON.stringify({ extracted_data: JSON.stringify(extracted), status: 'extracted', extraction_progress: 100, confidence_score: 90 }) });
  const conf = await api(`/irpf/documents/${idsA.document}/confirm`, { method: 'POST', headers: { Authorization: `Bearer ${tokenA}` }, body: JSON.stringify({ extracted_data: JSON.stringify(extracted) }) });
  assert.strictEqual(conf.status, 200);

  // Fetch incomes for exercise
  const incomes = await api(`/irpf/income/exercise/${idsA.exercise}`, { method: 'GET', headers: { Authorization: `Bearer ${tokenA}` } });
  assert.strictEqual(incomes.status, 200);
  assert.ok(incomes.body.length >= 1);
  idsA.income = incomes.body[0].id;
});

test('User B cannot access or modify User A resources', async () => {
  const bHeaders = { Authorization: `Bearer ${tokenB}` };

  async function assertNoAccess(method: string, path: string, expectedId?: string) {
    const opts: any = { method, headers: bHeaders };
    if (method !== 'GET' && method !== 'HEAD') opts.body = JSON.stringify({});
    const res = await api(path, opts);
    if (res.status === 200 && expectedId && res.body && (res.body.id === expectedId || (Array.isArray(res.body) && res.body.find((x: any) => x.id === expectedId)))) {
      assert.fail(`${method} ${path} returned resource for other user`);
    }
  }

  await assertNoAccess('GET', `/financas/contas/${idsA.account}`, idsA.account);
  await assertNoAccess('PUT', `/financas/contas/${idsA.account}`, idsA.account);
  await assertNoAccess('DELETE', `/financas/contas/${idsA.account}`, idsA.account);

  await assertNoAccess('GET', `/financas/historico/${idsA.history}`, idsA.history);
  await assertNoAccess('PUT', `/financas/historico/${idsA.history}`, idsA.history);
  await assertNoAccess('DELETE', `/financas/historico/${idsA.history}`, idsA.history);

  await assertNoAccess('GET', `/categories/${idsA.category}`, idsA.category);
  await assertNoAccess('PUT', `/categories/${idsA.category}`, idsA.category);
  await assertNoAccess('DELETE', `/categories/${idsA.category}`, idsA.category);

  await assertNoAccess('GET', `/irpf/documents/${idsA.document}`, idsA.document);
  await assertNoAccess('PUT', `/irpf/documents/${idsA.document}`, idsA.document);
  await assertNoAccess('DELETE', `/irpf/documents/${idsA.document}`, idsA.document);

  await assertNoAccess('GET', `/irpf/income/${idsA.income}`, idsA.income);
  await assertNoAccess('PUT', `/irpf/income/${idsA.income}`, idsA.income);
  await assertNoAccess('DELETE', `/irpf/income/${idsA.income}`, idsA.income);
});

test('teardown: stop server', async () => {
  serverProc.kill();
});
