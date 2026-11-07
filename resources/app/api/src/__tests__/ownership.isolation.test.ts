import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const dbPath = path.join(os.tmpdir(), `mertilo-ownership-${Date.now()}.db`);
process.env.MERTILO_DB_PATH = dbPath;

const { getDatabase, closeDatabase } = await import('../database/db.js');
const { runMigrations } = await import('../database/migrations.js');
const { correctionsRepository } = await import('../modules/irpf/repositories/corrections.repository.js');
const { validationsRepository } = await import('../modules/irpf/repositories/validations.repository.js');
const { dependentsRepository } = await import('../modules/irpf/repositories/dependents.repository.js');
const { AssistantService } = await import('../services/irpf-assistant.js');

const db = getDatabase();
runMigrations(db);
const now = new Date().toISOString();
const userA = 'owner-a';
const userB = 'owner-b';
for (const [id, email] of [[userA, 'a@ownership.test'], [userB, 'b@ownership.test']]) {
  db.prepare('INSERT INTO users (id, name, email, password_hash, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)').run(id, id, email, 'hash', now, now);
}
for (const [id, year, userId] of [['exercise-a', 2031, userA], ['exercise-b', 2032, userB]]) {
  db.prepare('INSERT INTO irpf_exercises (id, year, user_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?)').run(id, year, userId, now, now);
}
const docA = 'document-a';
const docB = 'document-b';
for (const [id, exerciseId] of [[docA, 'exercise-a'], [docB, 'exercise-b']]) {
  db.prepare('INSERT INTO irpf_documents (id, exercise_id, filename, file_path, file_type, mime_type, file_size, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)').run(id, exerciseId, `${id}.pdf`, `/tmp/${id}.pdf`, 'pdf', 'application/pdf', 1, now, now);
}
correctionsRepository.create('exercise-b', { document_id: docB, field_name: 'name', original_value: 'B', corrected_value: 'B2' });
validationsRepository.upsert('exercise-b', 'validation-b', { status: 'PENDING' });

const dependentB = dependentsRepository.create('exercise-b', { exercise_id: 'exercise-b', name: 'B', relationship: 'child', is_verified: false });

test('document corrections and validations stay owner-scoped', () => {
  assert.equal(correctionsRepository.getByDocument(docB, userA).length, 0);
  assert.equal(correctionsRepository.getByDocument(docB, userB).length, 1);
  assert.equal(validationsRepository.getByExercise('exercise-b', userA).length, 0);
  assert.equal(validationsRepository.getByExercise('exercise-b', userB).length, 1);
  assert.equal(validationsRepository.updateStatus('val_missing', 'RESOLVED', userA), undefined);
  const validation = validationsRepository.getByExercise('exercise-b', userB)[0] as any;
  assert.equal(validationsRepository.updateStatus(validation.id, 'RESOLVED', userA), undefined);
  assert.equal((validationsRepository.getById(validation.id, userB) as any).status, 'PENDING');
});

test('dependent access and assistant analysis stay owner-scoped', () => {
  assert.equal(dependentB && dependentsRepository.getById(dependentB.id, userA), null);
  assert.equal(dependentsRepository.getAll('exercise-b', userA).length, 0);
  const analysis = new AssistantService(db).analyze('exercise-b', userA);
  assert.equal(analysis.summary.documentsAnalyzed, 0);
  assert.equal(analysis.summary.dependentRecords, 0);
});

test.after(() => {
  closeDatabase();
  for (const suffix of ['', '-wal', '-shm']) {
    try { fs.rmSync(`${dbPath}${suffix}`, { force: true }); } catch {}
  }
});
