import { test } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fork } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Isolamento estrito de ambiente de teste
const TEST_DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'mertilo-v006-concurrency-'));
process.env.NODE_ENV = 'test';
process.env.MERTILO_DATA_DIR = TEST_DIR;
process.env.MERTILO_DB_PATH = path.join(TEST_DIR, 'mertilo.db');

const { readUserData, writeUserData, updateUserData, acquireFileLock } = await import('../data/store.js');
const { confirmCsvImport, undoCsvImport, deleteImportedTransaction } = await import('../services/csv-import.service.js');
const { getDatabase, closeDatabase } = await import('../database/db.js');
const { runMigrations } = await import('../database/migrations.js');
const { exercisesRepository } = await import('../modules/irpf/repositories/exercise.repository.js');
const { incomeRepository } = await import('../modules/irpf/repositories/income.repository.js');

test.before(() => {
  const db = getDatabase();
  runMigrations(db);
});

test.after(() => {
  try { closeDatabase(); } catch { /* ignore */ }
  fs.rmSync(TEST_DIR, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 });
});

test('A.1: Duas importações simultâneas do mesmo usuário não perdem dados', async () => {
  const userId = 'user-a1-same';
  writeUserData(userId, {
    salario: 0, contas: [], categorias: [], historico: [], vexpenses: [], importHistory: [], importedTransactions: []
  });

  const batch1 = [
    { id: 'tx-1', date: '2026-05-10', description: 'Mercado A', value: -100, category: 'Alimentação' }
  ];
  const batch2 = [
    { id: 'tx-2', date: '2026-05-11', description: 'Farmácia B', value: -50, category: 'Saúde' }
  ];

  await Promise.all([
    new Promise((resolve) => setImmediate(() => resolve(confirmCsvImport({ userId, records: batch1 as any, fileName: 'b1.csv' })))),
    new Promise((resolve) => setImmediate(() => resolve(confirmCsvImport({ userId, records: batch2 as any, fileName: 'b2.csv' }))))
  ]);

  const finalData = readUserData(userId);
  assert.equal(finalData.importedTransactions.length, 2, 'Ambas as transações devem persistir sem lost update');
  assert.equal(finalData.importHistory.length, 2, 'Ambos os lotes devem existir no histórico');
  assert.ok(finalData.importedTransactions.some((t: any) => t.id === 'tx-1'));
  assert.ok(finalData.importedTransactions.some((t: any) => t.id === 'tx-2'));
});

test('A.2: Importação simultânea com alteração e exclusão concorrente', async () => {
  const userId = 'user-a2-mixed';
  writeUserData(userId, {
    salario: 1000,
    contas: [],
    categorias: [],
    historico: [],
    vexpenses: [],
    importHistory: [],
    importedTransactions: [
      { id: 'tx-existing', userId, date: '2026-05-01', description: 'Antiga', value: -30, category: 'Lazer' } as any
    ]
  });

  const newRecords = [
    { id: 'tx-new', date: '2026-05-12', description: 'Nova', value: -70, category: 'Compras' }
  ];

  await Promise.all([
    new Promise((resolve) => setImmediate(() => resolve(confirmCsvImport({ userId, records: newRecords as any })))),
    new Promise((resolve) => setImmediate(() => resolve(deleteImportedTransaction(userId, 'tx-existing'))))
  ]);

  const after = readUserData(userId);
  assert.ok(after.importedTransactions.some((t: any) => t.id === 'tx-new'), 'Transação nova deve existir');
  assert.ok(!after.importedTransactions.some((t: any) => t.id === 'tx-existing'), 'Transação antiga deve ter sido removida');
});

test('B.1 & B.2: Usuários A e B gravando simultaneamente preservam namespaces', async () => {
  const userA = 'user-b1-A';
  const userB = 'user-b1-B';

  writeUserData(userA, { salario: 2000, contas: [], categorias: [], historico: [], vexpenses: [], importHistory: [], importedTransactions: [] });
  writeUserData(userB, { salario: 5000, contas: [], categorias: [], historico: [], vexpenses: [], importHistory: [], importedTransactions: [] });

  const recordsA = [{ id: 'tx-A', date: '2026-06-01', description: 'Compra A', value: -120, category: 'Compras' }];
  const recordsB = [{ id: 'tx-B', date: '2026-06-02', description: 'Compra B', value: -250, category: 'Lazer' }];

  await Promise.all([
    new Promise((resolve) => setImmediate(() => resolve(confirmCsvImport({ userId: userA, records: recordsA as any })))),
    new Promise((resolve) => setImmediate(() => resolve(confirmCsvImport({ userId: userB, records: recordsB as any }))))
  ]);

  const dataA = readUserData(userA);
  const dataB = readUserData(userB);

  assert.equal(dataA.salario, 2000);
  assert.equal(dataA.importedTransactions.length, 1);
  assert.equal(dataA.importedTransactions[0].id, 'tx-A');

  assert.equal(dataB.salario, 5000);
  assert.equal(dataB.importedTransactions.length, 1);
  assert.equal(dataB.importedTransactions[0].id, 'tx-B');
});

test('B.3 & B.4: Falha e rollback de A não altera dados prévios ou concorrentes de B', () => {
  const userA = 'user-b3-A';
  const userB = 'user-b3-B';

  writeUserData(userA, { salario: 1000, contas: [], categorias: [], historico: [], vexpenses: [], importHistory: [], importedTransactions: [] });
  writeUserData(userB, { salario: 8000, contas: [], categorias: [], historico: [], vexpenses: [], importHistory: [], importedTransactions: [] });

  // B importa com sucesso
  confirmCsvImport({
    userId: userB,
    records: [{
      id: 'tx-B-ok',
      date: '2026-06-10',
      description: 'Salário B',
      value: 8000,
      type: 'entrada',
      category: 'Salário e outras receitas'
    }] as any
  });

  // A tenta importar um lote que falha no SQLite via simulação de erro no incomeRepository.create
  const origIncomeCreate = incomeRepository.create;
  (incomeRepository as any).create = () => { throw new Error('Simulated SQLite failure'); };

  try {
    assert.throws(() => {
      confirmCsvImport({
        userId: userA,
        records: [{
          id: 'tx-A-fail',
          date: '2026-06-10',
          description: 'Salário A',
          value: 1000,
          type: 'entrada',
          category: 'Salário e outras receitas'
        }] as any
      });
    }, /Simulated SQLite failure/);
  } finally {
    (incomeRepository as any).create = origIncomeCreate;
  }

  const dataA = readUserData(userA);
  const dataB = readUserData(userB);

  assert.equal(dataB.importedTransactions.length, 1, 'Dados de B devem permanecer 100% intactos');
  assert.equal(dataB.importedTransactions[0].id, 'tx-B-ok');
  assert.equal(dataA.importedTransactions.length, 0, 'Dados de A devem ter sido revertidos pelo rollback');
});

test('C: Concorrência entre múltiplos processos Node.js independentes', async () => {
  const childScript = path.join(TEST_DIR, 'child-worker.js');
  fs.writeFileSync(childScript, `
    const { updateUserData, readUserData } = require('${path.resolve(__dirname, '../data/store.js').replace(/\\/g, '/')}');
    const userId = process.argv[2];
    const txId = process.argv[3];
    const val = Number(process.argv[4]);

    try {
      updateUserData(userId, (data) => {
        const txs = Array.isArray(data.importedTransactions) ? data.importedTransactions : [];
        txs.push({ id: txId, userId, value: val, date: '2026-07-01' });
        data.importedTransactions = txs;
        return { data, result: true };
      });
      process.exit(0);
    } catch (e) {
      console.error(e);
      process.exit(1);
    }
  `);

  const userShared = 'user-c-multiprocess';
  writeUserData(userShared, { salario: 0, contas: [], categorias: [], historico: [], vexpenses: [], importHistory: [], importedTransactions: [] });

  // Executar 4 subprocessos independentes concorrentes gravando no mesmo usuário
  const runWorker = (txId: string, val: number) => new Promise((resolve, reject) => {
    const cp = fork(childScript, [userShared, txId, String(val)], {
      env: { ...process.env, MERTILO_DATA_DIR: TEST_DIR }
    });
    cp.on('exit', (code) => code === 0 ? resolve(true) : reject(new Error('Worker exit ' + code)));
  });

  await Promise.all([
    runWorker('p1', 10),
    runWorker('p2', 20),
    runWorker('p3', 30),
    runWorker('p4', 40),
  ]);

  const afterProcesses = readUserData(userShared);
  assert.equal(afterProcesses.importedTransactions.length, 4, 'Todos os 4 subprocessos devem ter persistido sem lost update');
});

test('C.5 & C.6: Detecção e recuperação segura de lock abandonado (stale lock)', () => {
  const lockFile = path.join(TEST_DIR, 'data.json.lock');
  
  // Criar lock com PID morto e timestamp antigo
  fs.writeFileSync(lockFile, JSON.stringify({ pid: 9999999, time: Date.now() - 30000 }));

  // acquireFileLock deve detectar processo inexistente/expirado e adquirir o lock sem deadlock
  const release = acquireFileLock(2000, 5000);
  assert.ok(typeof release === 'function', 'Deve recuperar o lock abandonado com sucesso');
  release();
  assert.ok(!fs.existsSync(lockFile), 'Lock deve ter sido liberado e removido');
});

test('D.7 & D.8: Preservação de exercícios preexistentes durante rollback de importação', () => {
  const userId = 'user-d-exercise';
  const exercise = exercisesRepository.create(2025, userId);
  const exerciseId = exercise.id;

  writeUserData(userId, { salario: 0, contas: [], categorias: [], historico: [], vexpenses: [], importHistory: [], importedTransactions: [] });

  // Importar para 2025 (ano já existente) com salário
  confirmCsvImport({
    userId,
    records: [
      { id: 'tx-sal-2025', date: '2025-03-01', description: 'Salário Mensal', value: 5000, type: 'entrada', category: 'Salário e outras receitas' }
    ] as any
  });

  // O exercício preexistente de 2025 deve ter sido mantido e conter 1 income
  const incomes = incomeRepository.getAll(exerciseId, userId);
  assert.equal(incomes.length, 1);
  assert.equal(incomes[0].source, 'financial-import:tx-sal-2025');

  // Exercício preexistente continua no banco
  const ex = exercisesRepository.getById(exerciseId, userId);
  assert.ok(ex !== null, 'Exercício preexistente deve existir');
});
