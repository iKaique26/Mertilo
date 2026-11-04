import assert from 'node:assert/strict';
import test from 'node:test';
import { readData, writeData } from '../data/store.js';
import { confirmCsvImport, parseCsvPreview, undoCsvImport, deleteImportedTransaction } from '../services/csv-import.service.js';
import { exercisesRepository, documentsRepository, incomeRepository } from '../repositories/irpf.repository.js';
import { irpfService } from '../services/irpf.service.js';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

function resetData() {
  writeData({
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

  const result = parseCsvPreview(csv, { fileName: 'extrato.csv' });

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

  const result = parseCsvPreview(csv, { fileName: 'mixed-formats.csv' });

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
    fileName: 'mes.csv',
    records: [
      {
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

  const data = readData();
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
    fileName: 'revert.csv',
    records: [
      { id: 'rx-1', date: '2026-09-01', description: 'Supermercado Extra', normalizedDescription: 'supermercado extra', originalDescription: 'Supermercado Extra', value: -120.45, type: 'saída', category: 'Alimentação', subcategory: 'Supermercado', confidence: 0.82, source: 'revert.csv', status: 'importado', line: 2, importSource: 'csv_import', importedAt: '2026-09-12T00:00:00.000Z' },
      { id: 'rx-2', date: '2026-09-05', description: 'Salário', normalizedDescription: 'salario', originalDescription: 'Salário', value: 4200, type: 'entrada', category: 'Salário e outras receitas', subcategory: 'Salário', confidence: 0.96, source: 'revert.csv', status: 'importado', line: 3, importSource: 'csv_import', importedAt: '2026-09-12T00:00:00.000Z' },
    ],
  });

  const historyBefore = readData();
  assert.equal(historyBefore.importHistory.length, 1);
  assert.equal(historyBefore.importedTransactions.length, 2);

  const undo = undoCsvImport(result.historyId);
  assert.equal(undo.ok, true);
  assert.equal(undo.revertedCount, 2);

  const next = readData();
  assert.equal(next.importHistory.length, 0);
  assert.equal(next.importedTransactions.length, 0);
  assert.deepEqual(next.historico, []);
});

test('deleteImportedTransaction remove uma linha de importação e recalcula o mês', () => {
  resetData();

  const result = confirmCsvImport({
    fileName: 'single.csv',
    records: [
      { id: 'single-1', date: '2026-10-01', description: 'Uber', normalizedDescription: 'uber', originalDescription: 'Uber', value: -45.9, type: 'saída', category: 'Transporte', subcategory: 'Aplicativos', confidence: 0.76, source: 'single.csv', status: 'importado', line: 2, importSource: 'csv_import', importedAt: '2026-10-12T00:00:00.000Z' },
      { id: 'single-2', date: '2026-10-05', description: 'Salário', normalizedDescription: 'salario', originalDescription: 'Salário', value: 3300, type: 'entrada', category: 'Salário e outras receitas', subcategory: 'Salário', confidence: 0.96, source: 'single.csv', status: 'importado', line: 3, importSource: 'csv_import', importedAt: '2026-10-12T00:00:00.000Z' },
    ],
  });

  const deleted = deleteImportedTransaction('single-1');
  assert.equal(deleted.ok, true);
  assert.equal(deleted.removed, true);

  const after = readData();
  assert.equal(after.importedTransactions.length, 1);
  assert.equal(after.historico[0].mes, '2026-10');
  assert.equal(after.historico[0].rendaTotal, 3300);
  assert.equal(after.historico[0].totalContas, 0);
  assert.equal(after.historico[0].saldoDisponivel, 3300);
});

test('deleteDocument remove arquivo físico e registros relacionados do IRPF', async () => {
  const exercise = exercisesRepository.create(2027 + Math.floor(Math.random() * 1000));
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'mertilo-irpf-'));
  const filePath = path.join(dir, 'holerite.pdf');
  fs.writeFileSync(filePath, 'fake pdf');

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
});
