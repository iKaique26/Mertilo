import assert from 'node:assert/strict';
import test from 'node:test';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

// Isolamento: banco SQLite e diretório de dados (data.json + backups) temporários, definidos
// ANTES de importar os módulos que resolvem o caminho no carregamento (store.ts / getDatabase()).
const TEST_DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'mertilo-csv-import-'));
process.env.NODE_ENV = 'test';
process.env.MERTILO_DATA_DIR = TEST_DIR;
process.env.MERTILO_DB_PATH = path.join(TEST_DIR, 'mertilo.db');

const { readUserData, writeUserData } = await import('../data/store.js');
const { confirmCsvImport, parseCsvPreview, undoCsvImport, deleteImportedTransaction, sanitizeCsvFormula, exportCsvRow } = await import('../services/csv-import.service.js');
const { exercisesRepository, documentsRepository, incomeRepository } = await import('../repositories/irpf.repository.js');
const { irpfService } = await import('../services/irpf.service.js');
const { initializeDatabase, shutdownDatabase } = await import('../database/index.js');

await initializeDatabase();

test.after(async () => {
  try { await shutdownDatabase(); } catch { /* ignore */ }
  fs.rmSync(TEST_DIR, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 });
});

function resetData() {
  writeUserData('user-a', {
    salario: 0,
    contas: [],
    categorias: [],
    historico: [],
    vexpenses: [],
    importHistory: [],
    importedTransactions: [],
  });
}

test('detecta extrato em padrão brasileiro e classifica saídas e entradas', () => {
  const csv = `Data;Descricao;Debito;Credito
01/08/2026;Supermercado Extra;120,45;;
02/08/2026;Uber;45,90;;
03/08/2026;Salario; ;5000,00`;

  const result = parseCsvPreview(csv, { userId: 'user-a', fileName: 'extrato.csv' });

  assert.equal(result.errors.length, 0);
  assert.equal(result.records.length, 3);
  assert.equal(result.summary.exits, 2);
  assert.equal(result.summary.entries, 1);
  assert.ok(result.records[0].category === 'Alimentação' || result.records[0].category === 'Compras');
  assert.equal(result.records[0].type, 'saída');
  assert.equal(result.records[2].type, 'entrada');
});

test('identifica possíveis duplicatas antes da importação', () => {
  const csv = `Data;Descricao;Debito;Credito
01/08/2026;Supermercado Extra;120,45;;`;

  const result = parseCsvPreview(csv, {
    userId: 'user-a',
    fileName: 'extrato_duplicate.csv',
    existingRecords: [{
      date: '2026-08-01',
      description: 'Supermercado Extra',
      value: -120.45,
      account: 'Nubank',
      duplicateHash: 'Nubank::2026-08-01::120.45::supermercado extra',
    }],
  });

  assert.equal(result.summary.duplicates, 1);
  assert.equal(result.records[0].potentialDuplicate, true);
});

test('normaliza corretamente valores monetários do Nubank e Neon Bank', () => {
  const csv = `Data;Descricao;Valor
01/08/2026;Nubank decimal;2896.62
02/08/2026;Neon decimal;150.00
03/08/2026;Nubank negativo;-45.90
04/08/2026;Nubank brasil;2.896,62
05/08/2026;Neon brasil;1.234,56
06/08/2026;Nubank simples;1234.56
07/08/2026;Centavos;0.99`;

  const result = parseCsvPreview(csv, { userId: 'user-a', fileName: 'mixed-formats.csv' });

  assert.equal(result.errors.length, 0);
  assert.deepEqual(result.records.map((record) => Number(record.value.toFixed(2))), [
    2896.62,
    150,
    -45.9,
    2896.62,
    1234.56,
    1234.56,
    0.99,
  ]);
});

test('confirmCsvImport atualiza o histórico mensal e mantém a categoria automática', () => {
  resetData();

  const result = confirmCsvImport({
    userId: 'user-a',
    fileName: 'mes.csv',
    records: [
      {
        userId: 'user-a',
        id: 'r-1',
        date: '2026-08-01',
        description: 'Supermercado Extra',
        normalizedDescription: 'supermercado extra',
        originalDescription: 'Supermercado Extra',
        value: -120.45,
        type: 'saída',
        category: 'Alimentação',
        subcategory: 'Supermercado',
        confidence: 0.8,
        source: 'mes.csv',
        status: 'importado',
        line: 2,
        importSource: 'csv_import',
        importedAt: '2026-08-12T00:00:00.000Z',
      },
      {
        userId: 'user-a',
        id: 'r-2',
        date: '2026-08-05',
        description: 'Salário',
        normalizedDescription: 'salario',
        originalDescription: 'Salário',
        value: 4200,
        type: 'entrada',
        category: 'Salário e outras receitas',
        subcategory: 'Salário',
        confidence: 0.96,
        source: 'mes.csv',
        status: 'importado',
        line: 3,
        importSource: 'csv_import',
        importedAt: '2026-08-12T00:00:00.000Z',
      },
    ],
  });

  assert.equal(result.ok, true);
  assert.equal(result.importedCount, 2);

  const data = readUserData('user-a');
  assert.equal(data.historico.length, 1);
  assert.equal(data.historico[0].mes, '2026-08');
  assert.equal(data.historico[0].totalContas, 120.45);
  assert.equal(data.historico[0].rendaTotal, 4200);
  assert.equal(data.historico[0].saldoDisponivel, 4079.55);
  assert.ok(data.categorias.some((category) => category.nome === 'Alimentação'));
  assert.ok(data.importedTransactions.some((entry) => entry.category === 'Alimentação' && entry.subcategory === 'Supermercado'));
});

test('undoCsvImport reverte a importação e recalcula o histórico', () => {
  resetData();

  const result = confirmCsvImport({
    userId: 'user-a',
    fileName: 'revert.csv',
    records: [
      { userId: 'user-a', id: 'rx-1', date: '2026-09-01', description: 'Supermercado Extra', normalizedDescription: 'supermercado extra', originalDescription: 'Supermercado Extra', value: -120.45, type: 'saída', category: 'Alimentação', subcategory: 'Supermercado', confidence: 0.82, source: 'revert.csv', status: 'importado', line: 2, importSource: 'csv_import', importedAt: '2026-09-12T00:00:00.000Z' },
      { userId: 'user-a', id: 'rx-2', date: '2026-09-05', description: 'Salário', normalizedDescription: 'salario', originalDescription: 'Salário', value: 4200, type: 'entrada', category: 'Salário e outras receitas', subcategory: 'Salário', confidence: 0.96, source: 'revert.csv', status: 'importado', line: 3, importSource: 'csv_import', importedAt: '2026-09-12T00:00:00.000Z' },
    ],
  });

  const historyBefore = readUserData('user-a');
  assert.equal(historyBefore.importHistory.length, 1);
  assert.equal(historyBefore.importedTransactions.length, 2);

  const undo = undoCsvImport('user-a', result.historyId);
  assert.equal(undo.ok, true);
  assert.equal(undo.revertedCount, 2);

  const next = readUserData('user-a');
  assert.equal(next.importHistory.length, 0);
  assert.equal(next.importedTransactions.length, 0);
  assert.deepEqual(next.historico, []);
});

test('deleteImportedTransaction remove uma linha de importação e recalcula o mês', () => {
  resetData();

  const result = confirmCsvImport({
    userId: 'user-a',
    fileName: 'single.csv',
    records: [
      { userId: 'user-a', id: 'single-1', date: '2026-10-01', description: 'Uber', normalizedDescription: 'uber', originalDescription: 'Uber', value: -45.9, type: 'saída', category: 'Transporte', subcategory: 'Aplicativos', confidence: 0.76, source: 'single.csv', status: 'importado', line: 2, importSource: 'csv_import', importedAt: '2026-10-12T00:00:00.000Z' },
      { userId: 'user-a', id: 'single-2', date: '2026-10-05', description: 'Salário', normalizedDescription: 'salario', originalDescription: 'Salário', value: 3300, type: 'entrada', category: 'Salário e outras receitas', subcategory: 'Salário', confidence: 0.96, source: 'single.csv', status: 'importado', line: 3, importSource: 'csv_import', importedAt: '2026-10-12T00:00:00.000Z' },
    ],
  });

  const deleted = deleteImportedTransaction('user-a', 'single-1');
  assert.equal(deleted.ok, true);
  assert.equal(deleted.removed, true);

  const after = readUserData('user-a');
  assert.equal(after.importedTransactions.length, 1);
  assert.equal(after.historico[0].mes, '2026-10');
  assert.equal(after.historico[0].rendaTotal, 3300);
  assert.equal(after.historico[0].totalContas, 0);
  assert.equal(after.historico[0].saldoDisponivel, 3300);
});

test('deleteDocument remove arquivo físico e registros relacionados do IRPF', async () => {
  const userId = `user_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
  const exercise = exercisesRepository.create(2027, userId);
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'mertilo-irpf-'));
  const filePath = path.join(dir, 'holerite.pdf');
  fs.writeFileSync(filePath, 'fake pdf');
  try {
  const doc = documentsRepository.create(exercise.id, {
    exercise_id: exercise.id,
    filename: 'holerite.pdf',
    file_path: filePath,
    file_type: 'pdf',
    mime_type: 'application/pdf',
    file_size: 9,
    document_type: 'holerite',
    status: 'pending',
    extraction_progress: 0,
    confidence_score: 0,
    is_verified: false,
  });

  const income = incomeRepository.create(exercise.id, {
    exercise_id: exercise.id,
    document_id: doc.id,
    income_type: 'salary',
    description: 'Salário principal',
    amount: 3500,
    month: 8,
    source: 'manual',
    confidence_score: 100,
    is_verified: true,
  });

  const deleted = await irpfService.deleteDocument(doc.id);
  assert.equal(deleted, true);
  assert.equal(documentsRepository.getById(doc.id), null);
  assert.equal(incomeRepository.getById(income.id), null);
  assert.equal(fs.existsSync(filePath), false);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test('V-002: sanitizeCsvFormula neutraliza fórmulas sem afetar números negativos', () => {
  assert.equal(sanitizeCsvFormula('=1+1'), "'=1+1");
  assert.equal(sanitizeCsvFormula('+cmd|'), "'+cmd|");
  assert.equal(sanitizeCsvFormula('-2+3'), "'-2+3");
  assert.equal(sanitizeCsvFormula('@SUM(A1)'), "'@SUM(A1)");
  assert.equal(sanitizeCsvFormula('\t=cmd'), "'\t=cmd");
  assert.equal(sanitizeCsvFormula('  -calc'), "'  -calc");
  assert.equal(sanitizeCsvFormula('Mercado Normal'), 'Mercado Normal');

  // Valores numéricos legítimos em exportCsvRow
  const rowNegative = exportCsvRow(['2026-08-01', 'Supermercado', -120.45]);
  assert.equal(rowNegative, '2026-08-01;Supermercado;-120.45');

  // Texto perigoso em exportCsvRow
  const rowDangerous = exportCsvRow(['2026-08-01', '=cmd|calc', 100]);
  assert.equal(rowDangerous, '2026-08-01;\'=cmd|calc;100');
});

test('V-004 e V-006: isolamento estrito de usuário e atomicidade/rollback no import', () => {
  resetData();
  writeUserData('user-b', {
    salario: 0,
    contas: [],
    categorias: [],
    historico: [],
    vexpenses: [],
    importHistory: [],
    importedTransactions: [],
  });

  // V-004: Tentativa de injetar userId 'user-b' pelo payload é ignorada/sobrescrita pelo auth context 'user-a'
  const result = confirmCsvImport({
    userId: 'user-a',
    fileName: 'spoof.csv',
    records: [
      {
        userId: 'user-b', // Spoofed ID
        id: 'spoof-1',
        date: '2026-08-01',
        description: 'Salário Fictício',
        normalizedDescription: 'salario ficticio',
        originalDescription: 'Salário Fictício',
        value: 5000,
        type: 'entrada',
        category: 'Salário e outras receitas',
        subcategory: 'Salário',
        confidence: 0.95,
        source: 'spoof.csv',
        status: 'importado',
        line: 2,
        importSource: 'csv_import',
        importedAt: '2026-08-01T00:00:00.000Z',
      },
    ],
  });

  assert.equal(result.ok, true);
  const dataA = readUserData('user-a');
  const dataB = readUserData('user-b');

  // Usuário A possui a transação com userId garantido
  assert.equal(dataA.importedTransactions.length, 1);
  assert.equal(dataA.importedTransactions[0].userId, 'user-a');

  // Usuário B não recebeu nada (isolamento total)
  assert.equal(dataB.importedTransactions.length, 0);

  // V-006: Se syncIncomeToIrpf falhar, o estado no data.json e banco é revertido atomicamente
  const previousA = JSON.parse(JSON.stringify(readUserData('user-a')));
  
  // Forçar falha no sync passando ano com erro de integridade ou mock de throw
  const badRecord = {
    userId: 'user-a',
    id: 'err-1',
    date: '2026-08-01',
    description: 'Salário Erro',
    normalizedDescription: 'salario erro',
    originalDescription: 'Salário Erro',
    value: 1000,
    type: 'entrada' as const,
    category: 'Salário e outras receitas',
    subcategory: 'Salário',
    confidence: 0.95,
    source: 'fail.csv',
    status: 'importado' as const,
    line: 2,
    importSource: 'csv_import',
    importedAt: '2026-08-01T00:00:00.000Z',
  };

  const origGetAll = incomeRepository.getAll;
  (incomeRepository as any).getAll = () => { throw new Error('Simulated DB failure during income sync'); };

  try {
    assert.throws(
      () => confirmCsvImport({ userId: 'user-a', fileName: 'fail.csv', records: [badRecord] }),
      /Simulated DB failure/
    );
  } finally {
    incomeRepository.getAll = origGetAll;
  }

  // Verificar que data.json do user-a foi revertido ao estado anterior (sem registros parciais)
  const revertedA = readUserData('user-a');
  assert.equal(revertedA.importedTransactions.length, previousA.importedTransactions.length);
  assert.equal(revertedA.importHistory.length, previousA.importHistory.length);
});
