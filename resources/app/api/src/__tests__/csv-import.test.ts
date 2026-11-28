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
const {
  confirmCsvImport,
  parseCsvPreview,
  undoCsvImport,
  deleteImportedTransaction,
  sanitizeCsvFormula,
  exportCsvRow,
  getPendingImportCompensations,
  recoverPendingImportCompensations,
  IncompleteImportCompensationError,
} = await import('../services/csv-import.service.js');
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


test('3.4B.6: rastreamento de linha fisica com registros multilinhas, vazios e cabecalho deslocado', () => {
  // Fixture 3.4B.6:
  // L1: preamble
  // L2: (empty)
  // L3: header
  // L4-L6: record 1 (quoted field spanning L4-L6, 2 embedded LF)
  // L7: record 2
  // L8: (empty)
  // L9: record 3
  // L10: invalid record (bad date/value)
    const csv = [
      '123', // numeric preamble line
      '', // empty line 2
      'Data;Descricao;Valor', // header line 3
      '01/08/2026;"Pagamento\nlinha dois\nlinha tres";-150,00', // record 1 spans lines 4-6
      '02/08/2026;Uber;-45,90', // record 2 line 7
      '', // empty line 8
      '03/08/2026;Salario;5000,00', // record 3 line 9
      'invalido;SEM_DATA_VALOR;abc', // invalid line 10
    ].join('\n');

  const result = parseCsvPreview(csv, { userId: 'user-a', fileName: 'fixture-346.csv' });

  assert.equal(result.records.length, 3, `expected 3 records, got ${result.records.length}`);
  assert.equal(result.records[0].line, 4, `record 0 expected line 4, got ${result.records[0].line}`);
  assert.equal(result.records[1].line, 7, `record 1 expected line 7, got ${result.records[1].line}`);
  assert.equal(result.records[2].line, 9, `record 2 expected line 9, got ${result.records[2].line}`);

  assert.equal(result.errors.length, 1, `expected 1 error, got ${result.errors.length}`);
  assert.equal(result.errors[0].line, 10, `invalid record expected error line 10, got ${result.errors[0].line}`);
});

test('3.4B.6 CRLF: mesmo comportamento com terminadores CRLF', () => {
  const csv = [
    '123',
    '',
    'Data;Descricao;Valor',
    '01/08/2026;"Pagamento\nlinha dois\nlinha tres";-150,00',
    '02/08/2026;Uber;-45,90',
    '',
    '03/08/2026;Salario;5000,00',
  ].join('\r\n');

  const result = parseCsvPreview(csv, { userId: 'user-a', fileName: 'fixture-346-crlf.csv' });

  assert.equal(result.records.length, 3);
  assert.equal(result.records[0].line, 4);
  assert.equal(result.records[1].line, 7);
  assert.equal(result.records[2].line, 9);
});

test('3.4B.8 parser CRLF interno/externo: CRLF conta uma unica quebra de linha sem duplicacao', () => {
  const csv = [
    '',
    '123',
    'Data;Descricao;Valor',
    '01/08/2026;"Pagamento\r\nlinha dois\r\nlinha tres";-150,00',
    '02/08/2026;Uber;-45,90',
    '',
    '03/08/2026;Salario;5000,00',
    'invalido;SEM_DATA_VALOR;abc',
  ].join('\r\n');

  const result = parseCsvPreview(csv, { userId: 'user-a', fileName: 'fixture-348-crlf.csv' });

  assert.equal(result.records.length, 3);
  assert.equal(result.records[0].line, 4);
  assert.equal(result.records[1].line, 7);
  assert.equal(result.records[2].line, 9);
  assert.equal(result.errors.length, 1);
  assert.equal(result.errors[0].line, 10);
});

test('3.4B.8 rollback JSON+SQLite: falha parcial em DELETE registra compensacao pendente e recupera com idempotencia', () => {
  const userId = 'user-348-recovery';
  const preExercise = exercisesRepository.create(2030, userId);
  const preIncome = incomeRepository.create(preExercise.id, {
    exercise_id: preExercise.id,
    income_type: 'salary',
    description: 'Salario preexistente 2030',
    amount: 4500,
    month: 12,
    source: 'manual',
    confidence_score: 100,
    is_verified: true,
  });

  const preExistingTx = {
    userId,
    id: 'pre-tx-1',
    date: '2030-12-10',
    description: 'Supermercado Preexistente',
    normalizedDescription: 'supermercado preexistente',
    originalDescription: 'Supermercado Preexistente',
    value: -200,
    type: 'saída' as const,
    category: 'Alimentação',
    subcategory: 'Supermercado',
    confidence: 0.9,
    source: 'pre.csv',
    status: 'importado' as const,
    line: 2,
    importSource: 'csv_import',
    importedAt: '2030-12-10T00:00:00.000Z',
  };

  writeUserData(userId, {
    salario: 4500,
    contas: [],
    categorias: [],
    historico: [],
    vexpenses: [],
    importHistory: [
      {
        userId,
        id: 'pre-batch-1',
        fileName: 'pre.csv',
        importedAt: '2030-12-10T00:00:00.000Z',
        summary: { total: 1, imported: 1, duplicates: 0, invalid: 0, toReview: 0 },
        transactions: [preExistingTx],
      },
    ],
    importedTransactions: [preExistingTx],
  });

  const batchRecords = [1, 2, 3, 4, 5].map((idx) => ({
    userId,
    id: `rec-348-${idx}`,
    date: `2031-0${idx}-05`,
    description: `Salario Mes ${idx}`,
    normalizedDescription: `salario mes ${idx}`,
    originalDescription: `Salario Mes ${idx}`,
    value: 3000 + idx * 100,
    type: 'entrada' as const,
    category: 'Salário e outras receitas',
    subcategory: 'Salário',
    confidence: 0.95,
    source: 'lote-348.csv',
    status: 'importado' as const,
    line: idx + 1,
    importSource: 'csv_import',
    importedAt: '2031-06-01T00:00:00.000Z',
  }));

  const origCreate = incomeRepository.create.bind(incomeRepository);
  const origDelete = incomeRepository.delete.bind(incomeRepository);
  let createCalls = 0;
  let deleteCalls = 0;

  (incomeRepository as any).create = (exerciseId: string, payload: any) => {
    createCalls += 1;
    if (createCalls === 5) {
      throw new Error('Simulated SQLite failure on 5th transaction');
    }
    return origCreate(exerciseId, payload);
  };

  (incomeRepository as any).delete = (incomeId: string, ownerId?: string) => {
    deleteCalls += 1;
    if (deleteCalls >= 3) {
      throw new Error(`Simulated partial DELETE failure for ${incomeId}`);
    }
    return origDelete(incomeId, ownerId);
  };

  let thrownError: any = null;
  try {
    confirmCsvImport({ userId, fileName: 'lote-348.csv', records: batchRecords });
  } catch (err) {
    thrownError = err;
  } finally {
    (incomeRepository as any).create = origCreate;
    (incomeRepository as any).delete = origDelete;
  }

  assert.ok(thrownError instanceof IncompleteImportCompensationError);
  assert.equal(thrownError.compensationIncomplete, true);
  assert.equal(thrownError.pendingIncomeIds.length, 2);
  assert.equal(thrownError.pendingExerciseIds.length, 1);

  const pending = getPendingImportCompensations(userId);
  assert.equal(pending.length, 1);
  assert.equal(pending[0].batchId, thrownError.batchId);
  assert.equal(pending[0].status, 'compensation_incomplete');
  assert.equal(pending[0].pendingIncomeIds.length, 2);
  assert.equal(pending[0].pendingExerciseIds.length, 1);
  assert.equal(pending[0].attempts, 1);

  // JSON nao fica incorretamente marcado como consistente
  const midData = readUserData(userId);
  assert.equal(midData.pendingCompensations?.length, 1);
  const failedBatchEntry = midData.importHistory.find((entry) => entry.id === thrownError.batchId);
  assert.ok(failedBatchEntry);
  assert.equal(failedBatchEntry.compensationStatus, 'incomplete');

  // Preexistentes em JSON permanecem intactos
  assert.equal(midData.importedTransactions.length, 1);
  assert.equal(midData.importedTransactions[0].id, 'pre-tx-1');
  assert.ok(midData.importHistory.some((entry) => entry.id === 'pre-batch-1'));

  // Preexistentes no SQLite permanecem intactos e orfaos do lote falho ainda existem
  assert.ok(exercisesRepository.getById(preExercise.id, userId) !== null);
  assert.ok(incomeRepository.getById(preIncome.id, userId) !== null);
  const ex2031 = exercisesRepository.getByYear(2031, userId);
  assert.ok(ex2031 !== null);
  assert.equal(incomeRepository.getAll(ex2031.id, userId).length, 2);

  // Tentar desfazer manualmente enquanto delete ainda falha nao apaga estado pendente
  let retryDeleteCalls = 0;
  (incomeRepository as any).delete = (incomeId: string, ownerId?: string) => {
    retryDeleteCalls += 1;
    if (retryDeleteCalls === 2) {
      throw new Error('Second retry still failing on last item');
    }
    return origDelete(incomeId, ownerId);
  };
  try {
    const partialRetry = recoverPendingImportCompensations(userId);
    assert.equal(partialRetry.ok, false);
    assert.equal(partialRetry.remaining, 1);
    const afterPartial = getPendingImportCompensations(userId);
    assert.equal(afterPartial[0].pendingIncomeIds.length, 1);
    assert.equal(afterPartial[0].attempts, 2);
  } finally {
    (incomeRepository as any).delete = origDelete;
  }

  // Nova tentativa de recuperacao sem falhas conclui operacao com seguranca
  const finalRecovery = recoverPendingImportCompensations(userId);
  assert.equal(finalRecovery.ok, true);
  assert.deepEqual(finalRecovery.recoveredBatches, [thrownError.batchId]);
  assert.equal(finalRecovery.failedBatches.length, 0);
  assert.equal(finalRecovery.remaining, 0);

  // Idempotencia: segunda execucao sem pendencias nao gera erro nem efeitos colaterais
  const idempotentRecovery = recoverPendingImportCompensations(userId);
  assert.equal(idempotentRecovery.ok, true);
  assert.equal(idempotentRecovery.recoveredBatches.length, 0);
  assert.equal(idempotentRecovery.remaining, 0);

  // Estado final limpo preservando preexistentes
  const finalData = readUserData(userId);
  assert.equal(finalData.pendingCompensations, undefined);
  assert.equal(finalData.importHistory.length, 1);
  assert.equal(finalData.importHistory[0].id, 'pre-batch-1');
  assert.equal(finalData.importedTransactions.length, 1);
  assert.equal(finalData.importedTransactions[0].id, 'pre-tx-1');

  assert.equal(exercisesRepository.getByYear(2031, userId), null);
  assert.ok(exercisesRepository.getById(preExercise.id, userId) !== null);
  assert.ok(incomeRepository.getById(preIncome.id, userId) !== null);
});