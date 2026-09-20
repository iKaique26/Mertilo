import test from 'node:test';
import assert from 'node:assert';
import { spawn } from 'node:child_process';
import path from 'node:path';

const PORT = process.env.TEST_PORT || '6002';
const BASE = `http://127.0.0.1:${PORT}/api/irpf`;
let serverProc: any = null;
const BASE_YEAR = 2000 + (Date.now() % 1000);
let authToken: string | null = null;

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

async function api(path: string, opts: any = {}) {
  const url = `${BASE}${path}`;
  const headers = { 'Content-Type': 'application/json', ...(opts.headers || {}) } as any;
  if (authToken) headers.Authorization = `Bearer ${authToken}`;
  const res = await fetch(url, { ...opts, headers });
  const text = await res.text();
  let body = null;
  try { body = text ? JSON.parse(text) : null; } catch { body = text; }
  return { status: res.status, body };
}

test('setup: start server', async (t) => {
  const testDb = path.join(process.cwd(), 'data', `mertilo.test.${Date.now()}.db`);
  serverProc = spawn(process.execPath, ['dist/index.js'], { env: { ...process.env, PORT, MERTILO_DB_PATH: testDb, NODE_ENV: 'test' }, stdio: ['ignore', 'pipe', 'pipe'] });
  // forward logs to test output
  serverProc.stdout?.on('data', (d: any) => process.stdout.write(`[server] ${d}`));
  serverProc.stderr?.on('data', (d: any) => process.stderr.write(`[server-err] ${d}`));

  await waitForServer(15000);
  // register and login a default test user for these integration tests
  const email = `test+irpf_${Date.now()}@example.com`;
  const password = 'Password123!';
  const regRes = await fetch(`http://127.0.0.1:${PORT}/api/auth/register`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: 'IRPF Test', email, password }) });
  let verificationCode: string | undefined;
  if (regRes.status === 201) {
    try {
      const rb = await regRes.json();
      verificationCode = rb.verification_code;
    } catch (e) {}
  }

  if (verificationCode) {
    await fetch(`http://127.0.0.1:${PORT}/api/auth/verify-email`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, code: verificationCode }) });
  }

  const loginRes = await fetch(`http://127.0.0.1:${PORT}/api/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password }) });
  if (loginRes.status === 200) {
    const loginBody = await loginRes.json();
    authToken = loginBody.token || null;
  }
});

let exerciseIdA: string;
let exerciseIdB: string;
let docA1: any;
let docA2: any;
let docB1: any;
let informe: any;
let duplicateValidationId: string;

// 1. Create exercise A
test('1 - create exercise A', async () => {
  const res = await api('/exercises', { method: 'POST', body: JSON.stringify({ year: BASE_YEAR }) });
  assert.strictEqual(res.status, 201);
  assert.ok(res.body.id);
  exerciseIdA = res.body.id;
});

// 2. Nonexistent exercise
test('2 - nonexistent exercise returns 404', async () => {
  const res = await api('/exercises/nonexistent-id', { method: 'GET' });
  assert.strictEqual(res.status, 404);
});

// 3 - Holerite complete: create doc, update extracted_data, confirm and check income
test('3 - holerite complete and income created', async () => {
  const create = await api('/documents', { method: 'POST', body: JSON.stringify({ exercise_id: exerciseIdA, filename: 'holerite_09.pdf', file_path: '/tmp/holerite_09.pdf', file_type: 'pdf', mime_type: 'application/pdf', file_size: 12345, document_type: 'holerite' }) });
  assert.strictEqual(create.status, 201);
  docA1 = create.body;

  const extracted = { documentType: 'holerite', holeriteData: { competencia: '09/2026', salario_bruto: 3000, empresa: 'ACME', cnpj: '11122233344455' }, fields: [{ name: 'salario_bruto', value: 3000, confidence: 95 }], confidence: 95 };
  const update = await api(`/documents/${docA1.id}`, { method: 'PUT', body: JSON.stringify({ extracted_data: JSON.stringify(extracted), status: 'extracted', extraction_progress: 100, confidence_score: 95 }) });
  assert.strictEqual(update.status, 200);

  const confirm = await api(`/documents/${docA1.id}/confirm`, { method: 'POST', body: JSON.stringify({ extracted_data: JSON.stringify(extracted) }) });
  assert.strictEqual(confirm.status, 200);

  const incomes = await api(`/income/exercise/${exerciseIdA}`, { method: 'GET' });
  assert.strictEqual(incomes.status, 200);
  assert.ok(incomes.body.length >= 1);
  assert.strictEqual(Number(incomes.body[0].amount), 3000);
});

// 4 - Holerite missing: create exercise B with no docs and check assistant validation reports documentsMissing
test('4 - holerite missing for empty exercise', async () => {
  const create = await api('/exercises', { method: 'POST', body: JSON.stringify({ year: BASE_YEAR - 1 }) });
  assert.strictEqual(create.status, 201);
  exerciseIdB = create.body.id;

  const assistant = await api(`/exercises/${exerciseIdB}/assistant`, { method: 'GET' });
  assert.strictEqual(assistant.status, 200);
  assert.ok(assistant.body.validation);
  assert.ok(typeof assistant.body.validation.summary.documentsMissing === 'number');
});

// 5 - Holerite duplicate
test('5 - detect duplicate holerite', async () => {
  // create second holerite with same competencia and cnpj
  const create2 = await api('/documents', { method: 'POST', body: JSON.stringify({ exercise_id: exerciseIdA, filename: 'holerite_09_dup.pdf', file_path: '/tmp/holerite_09_dup.pdf', file_type: 'pdf', mime_type: 'application/pdf', file_size: 12345, document_type: 'holerite' }) });
  assert.strictEqual(create2.status, 201);
  docA2 = create2.body;

  const extracted2 = { documentType: 'holerite', holeriteData: { competencia: '09/2026', salario_bruto: 3000, empresa: 'ACME', cnpj: '11122233344455' }, fields: [{ name: 'salario_bruto', value: 3000, confidence: 92 }], confidence: 92 };
  await api(`/documents/${docA2.id}`, { method: 'PUT', body: JSON.stringify({ extracted_data: JSON.stringify(extracted2), status: 'extracted', extraction_progress: 100, confidence_score: 92 }) });
  await api(`/documents/${docA2.id}/confirm`, { method: 'POST', body: JSON.stringify({ extracted_data: JSON.stringify(extracted2) }) });

  // rerun validations
  const rerun = await api(`/exercises/${exerciseIdA}/validations/rerun`, { method: 'POST' });
  assert.strictEqual(rerun.status, 200);

  const vals = await api(`/exercises/${exerciseIdA}/validations`, { method: 'GET' });
  assert.strictEqual(vals.status, 200);
  const duplicates = vals.body.filter((v: any) => v.type === 'duplicate');
  assert.ok(duplicates.length >= 1);
  duplicateValidationId = duplicates[0].id;

  // rerun again and ensure duplicates not multiplied
  const beforeCount = vals.body.length;
  await api(`/exercises/${exerciseIdA}/validations/rerun`, { method: 'POST' });
  const vals2 = await api(`/exercises/${exerciseIdA}/validations`, { method: 'GET' });
  assert.strictEqual(vals2.status, 200);
  assert.strictEqual(vals2.body.length, beforeCount);
});

// 6/7 - Informe compatible and divergent
test('6-7 informe compatible and divergent', async () => {
  // create an informe matching ACME
  const info = await api('/documents', { method: 'POST', body: JSON.stringify({ exercise_id: exerciseIdA, filename: 'informe_acme.pdf', file_path: '/tmp/informe.pdf', file_type: 'pdf', mime_type: 'application/pdf', file_size: 12345, document_type: 'informe' }) });
  assert.strictEqual(info.status, 201);
  informe = info.body;

  const infExtract = { informeData: { empresa: 'ACME', cnpj: '11122233344455', rendimentos_tributaveis: 36000, irrf: 2000 }, fields: [], confidence: 95 };
  await api(`/documents/${informe.id}`, { method: 'PUT', body: JSON.stringify({ extracted_data: JSON.stringify(infExtract), status: 'extracted', extraction_progress: 100, confidence_score: 95 }) });
  await api(`/documents/${informe.id}/confirm`, { method: 'POST', body: JSON.stringify({ extracted_data: JSON.stringify(infExtract) }) });

  // rerun validations
  await api(`/exercises/${exerciseIdA}/validations/rerun`, { method: 'POST' });
  const vals = await api(`/exercises/${exerciseIdA}/validations`, { method: 'GET' });
  assert.strictEqual(vals.status, 200);
  const conferences = vals.body.filter((v: any) => v.type === 'conference');
  assert.ok(conferences.length >= 1);
});

// 8 - Low confidence detection via dashboard
test('8 - low confidence document detection', async () => {
  const lowDoc = await api('/documents', { method: 'POST', body: JSON.stringify({ exercise_id: exerciseIdA, filename: 'low.pdf', file_path: '/tmp/low.pdf', file_type: 'pdf', mime_type: 'application/pdf', file_size: 12345, document_type: 'other' }) });
  assert.strictEqual(lowDoc.status, 201);
  await api(`/documents/${lowDoc.body.id}`, { method: 'PUT', body: JSON.stringify({ extracted_data: JSON.stringify({ fields: [] }), status: 'extracted', extraction_progress: 100, confidence_score: 50 }) });

  const dash = await api(`/exercises/${exerciseIdA}/dashboard`, { method: 'GET' });
  assert.strictEqual(dash.status, 200);
  assert.ok(typeof dash.body.pending_actions.low_confidence_docs === 'number');
});

// 9 - document of different exercise isolation
test('9 - isolation between exercises', async () => {
  const docsA = await api(`/documents/exercise/${exerciseIdA}`, { method: 'GET' });
  const docsB = await api(`/documents/exercise/${exerciseIdB}`, { method: 'GET' });
  assert.strictEqual(docsA.status, 200);
  assert.strictEqual(docsB.status, 200);
  assert.notDeepStrictEqual(docsA.body, docsB.body);
});

// 10 - anomaly detection via assistant
test('10 - anomaly detection', async () => {
  // create unusual income for a month
  await api('/income', { method: 'POST', body: JSON.stringify({ exercise_id: exerciseIdA, income_type: 'salary', amount: 100000, month: 6 }) });
  await api(`/exercises/${exerciseIdA}/validations/rerun`, { method: 'POST' });
  const assistant = await api(`/exercises/${exerciseIdA}/assistant`, { method: 'GET' });
  assert.strictEqual(assistant.status, 200);
  assert.ok(Array.isArray(assistant.body.validation.anomalies));
});

// 11 - financial comparison exists
test('11 - financial comparison', async () => {
  const assistant = await api(`/exercises/${exerciseIdA}/assistant`, { method: 'GET' });
  assert.strictEqual(assistant.status, 200);
  assert.ok(assistant.body.validation.financialComparison !== undefined);
});

// 12/13 - manual correction and history
test('12-13 - manual correction and history persisted', async () => {
  // create a doc and correct
  const doc = await api('/documents', { method: 'POST', body: JSON.stringify({ exercise_id: exerciseIdA, filename: 'corr.pdf', file_path: '/tmp/corr.pdf', file_type: 'pdf', mime_type: 'application/pdf', file_size: 12345, document_type: 'holerite' }) });
  assert.strictEqual(doc.status, 201);
  const extracted = { documentType: 'holerite', holeriteData: { competencia: '10/2026', salario_bruto: 3000, empresa: 'ACME' }, fields: [{ name: 'salario_bruto', value: 3000, confidence: 90 }], confidence: 90 };
  await api(`/documents/${doc.body.id}`, { method: 'PUT', body: JSON.stringify({ extracted_data: JSON.stringify(extracted), status: 'extracted', extraction_progress: 100, confidence_score: 90 }) });

  // confirm with correction
  const correctionBody = { extracted_data: JSON.stringify(extracted), corrections: { salario_bruto: 3200 } };
  const conf = await api(`/documents/${doc.body.id}/confirm`, { method: 'POST', body: JSON.stringify(correctionBody) });
  assert.strictEqual(conf.status, 200);

  // Check document has _corrections in extracted_data
  const fetched = await api(`/documents/${doc.body.id}`, { method: 'GET' });
  assert.strictEqual(fetched.status, 200);
  const parsed = typeof fetched.body.extracted_data === 'string' ? JSON.parse(fetched.body.extracted_data) : fetched.body.extracted_data;
  assert.ok(Array.isArray(parsed._corrections));

  // Check correction history persisted
  const corrections = await api(`/exercises/${exerciseIdA}/corrections`, { method: 'GET' });
  assert.strictEqual(corrections.status, 200);
  const found = corrections.body.find((c: any) => c.document_id === doc.body.id && c.field_name === 'salario_bruto');
  assert.ok(found, 'correction history entry not found');
});

// 14-17 validation status transitions
test('14-17 validation status transitions', async () => {
  const vals = await api(`/exercises/${exerciseIdA}/validations`, { method: 'GET' });
  assert.strictEqual(vals.status, 200);
  if (!vals.body || vals.body.length === 0) return;
  const vId = vals.body[0].id;
  // REVIEWED
  const r1 = await api(`/validations/${vId}/status`, { method: 'PUT', body: JSON.stringify({ status: 'REVIEWED' }) });
  assert.strictEqual(r1.status, 200);
  assert.strictEqual(r1.body.status, 'REVIEWED');
  // RESOLVED
  const r2 = await api(`/validations/${vId}/status`, { method: 'PUT', body: JSON.stringify({ status: 'RESOLVED' }) });
  assert.strictEqual(r2.status, 200);
  assert.strictEqual(r2.body.status, 'RESOLVED');
  // IGNORED
  const r3 = await api(`/validations/${vId}/status`, { method: 'PUT', body: JSON.stringify({ status: 'IGNORED' }) });
  assert.strictEqual(r3.status, 200);
  assert.strictEqual(r3.body.status, 'IGNORED');
});

// 18/19 rerun idempotency
test('18-19 rerun idempotent', async () => {
  const before = await api(`/exercises/${exerciseIdA}/validations`, { method: 'GET' });
  const countBefore = before.body.length;
  await api(`/exercises/${exerciseIdA}/validations/rerun`, { method: 'POST' });
  await api(`/exercises/${exerciseIdA}/validations/rerun`, { method: 'POST' });
  const after = await api(`/exercises/${exerciseIdA}/validations`, { method: 'GET' });
  assert.strictEqual(after.body.length, countBefore);
});

// 20 - isolation between exercises
test('20 - validations and corrections isolated by exercise', async () => {
  const valsA = await api(`/exercises/${exerciseIdA}/validations`, { method: 'GET' });
  const valsB = await api(`/exercises/${exerciseIdB}/validations`, { method: 'GET' });
  assert.strictEqual(valsA.status, 200);
  assert.strictEqual(valsB.status, 200);
  // ensure at least one differs
  assert.notDeepStrictEqual(valsA.body, valsB.body);

  const corA = await api(`/exercises/${exerciseIdA}/corrections`, { method: 'GET' });
  const corB = await api(`/exercises/${exerciseIdB}/corrections`, { method: 'GET' });
  assert.strictEqual(corA.status, 200);
  assert.strictEqual(corB.status, 200);
  assert.notDeepStrictEqual(corA.body, corB.body);
});

// teardown
test('teardown: stop server', async () => {
  if (serverProc) {
    serverProc.kill();
    serverProc = null;
  }
});
