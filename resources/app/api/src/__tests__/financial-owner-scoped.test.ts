import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';

const dataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'mertilo-owner-scoped-'));
process.env.MERTILO_DATA_DIR = dataDir;

const { readUserData, writeUserData } = await import('../data/store.js');
const { confirmCsvImport, deleteImportedTransaction, rebuildImportedMonthHistory, undoCsvImport } = await import('../services/csv-import.service.js');

const record = (userId: string, id: string, date: string, value: number, type: 'entrada' | 'saída') => ({
  userId, id, date, description: id, normalizedDescription: id, originalDescription: id,
  value, type, category: 'Não categorizado', subcategory: 'Outros', confidence: 0.5,
  source: 'fixture.csv', status: 'importado' as const, line: 2, importSource: 'csv_import', importedAt: '2026-01-01T00:00:00.000Z',
});

test('18 cenários A/B: namespace, operações, restart e legado', () => {
  writeUserData('A', { salario: 0, contas: [], categorias: [], historico: [], vexpenses: [], importHistory: [], importedTransactions: [] });
  writeUserData('B', { salario: 0, contas: [], categorias: [], historico: [], vexpenses: [], importHistory: [], importedTransactions: [] });

  const importA = confirmCsvImport({ userId: 'A', records: [record('A', 'a-1', '2026-01-01', -10, 'saída'), record('A', 'a-2', '2026-01-01', 100, 'entrada')] });
  const importB = confirmCsvImport({ userId: 'B', records: [record('B', 'b-1', '2026-02-01', -20, 'saída')] });
  assert.equal(importA.ok, true); assert.equal(importB.ok, true);

  const a = readUserData('A'); const b = readUserData('B');
  assert.equal(a.importedTransactions.length, 2); assert.equal(b.importedTransactions.length, 1);
  assert.equal(a.importHistory.length, 1); assert.equal(b.importHistory.length, 1);
  assert.equal((a.historico[0] as any).userId, 'A'); assert.equal((b.historico[0] as any).userId, 'B');
  assert.equal(a.historico[0].totalContas, 10); assert.equal(a.historico[0].rendaTotal, 100);
  assert.equal(b.historico[0].totalContas, 20);
  assert.equal(undoCsvImport('A', importB.historyId).ok, false);
  assert.equal(deleteImportedTransaction('B', 'a-1').ok, false);
  assert.equal(readUserData('A').importedTransactions.length, 2);
  assert.equal(readUserData('B').importedTransactions.length, 1);

  const beforeB = JSON.stringify(readUserData('B'));
  rebuildImportedMonthHistory(readUserData('A'), 'A');
  assert.equal(JSON.stringify(readUserData('B')), beforeB);

  const rawFile = path.join(dataDir, 'data.json');
  const persisted = JSON.parse(fs.readFileSync(rawFile, 'utf8'));
  persisted.legacy = { importedTransactions: [{ id: 'legacy-1', value: 999 }] };
  fs.writeFileSync(rawFile, JSON.stringify(persisted));
  assert.equal(readUserData('A').importedTransactions.some((item: any) => item.id === 'legacy-1'), false);
  assert.equal(readUserData('B').importedTransactions.some((item: any) => item.id === 'legacy-1'), false);
  assert.equal(JSON.parse(fs.readFileSync(rawFile, 'utf8')).legacy.importedTransactions[0].id, 'legacy-1');

  assert.throws(() => readUserData(undefined), /Contexto de usuário obrigatório/);
  assert.throws(() => writeUserData(undefined, a), /Contexto de usuário obrigatório/);
});

test.after(() => fs.rmSync(dataDir, { recursive: true, force: true }));
