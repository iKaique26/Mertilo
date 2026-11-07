import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const dbPath = path.join(os.tmpdir(), `mertilo-dependents-${Date.now()}.db`);
process.env.MERTILO_DB_PATH = dbPath;

const { getDatabase, closeDatabase } = await import('../database/db.js');
const { runMigrations } = await import('../database/migrations.js');
const { dependentsRepository } = await import('../modules/irpf/repositories/dependents.repository.js');

const db = getDatabase();
runMigrations(db);
const userA = 'user-a';
const userB = 'user-b';
const exerciseA = 'exercise-a';
const exerciseB = 'exercise-b';
db.prepare('INSERT INTO users (id, name, email, password_hash, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)').run(userA, 'A', 'a@test.local', 'hash', new Date().toISOString(), new Date().toISOString());
db.prepare('INSERT INTO users (id, name, email, password_hash, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)').run(userB, 'B', 'b@test.local', 'hash', new Date().toISOString(), new Date().toISOString());
db.prepare('INSERT INTO irpf_exercises (id, year, user_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?)').run(exerciseA, 2026, userA, new Date().toISOString(), new Date().toISOString());
db.prepare('INSERT INTO irpf_exercises (id, year, user_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?)').run(exerciseB, 2027, userB, new Date().toISOString(), new Date().toISOString());

const dependentA = dependentsRepository.create(exerciseA, { exercise_id: exerciseA, name: 'A', cpf: '1', relationship: 'child', birth_date: '2020-01-01', is_verified: false });
const dependentB = dependentsRepository.create(exerciseB, { exercise_id: exerciseB, name: 'B', cpf: '2', relationship: 'child', birth_date: null, is_verified: false } as any);

test('updates allowed fields and preserves falsy values', () => {
  const updated = dependentsRepository.update(dependentA.id, { name: '', cpf: null, is_verified: false } as any, userA);
  assert.equal(updated?.name, '');
  assert.equal(updated?.cpf, null);
  assert.equal(updated?.is_verified, false);
});

test('rejects protected and unknown fields', () => {
  for (const key of ['id', 'created_at', 'updated_at', 'user_id', 'exercise_id', 'malicious column; DROP TABLE users;']) {
    assert.throws(() => dependentsRepository.update(dependentA.id, { [key]: 'x' } as any, userA), /Campos não permitidos/);
  }
  assert.ok(db.prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'users'").get());
});

test('empty update respects ownership', () => {
  assert.equal(dependentsRepository.update(dependentA.id, {}, userA)?.id, dependentA.id);
  assert.equal(dependentsRepository.update(dependentA.id, {}, userB), null);
  assert.equal(dependentsRepository.update('missing', {}, userA), null);
  assert.equal(dependentsRepository.update(dependentA.id, {})?.id, dependentA.id);
});

test('real consumer update remains ownership-protected', () => {
  assert.equal(dependentsRepository.update(dependentB.id, { name: 'blocked' }, userA), null);
  assert.equal(dependentsRepository.getById(dependentB.id, userB)?.name, 'B');
});

test.after(() => {
  closeDatabase();
  for (const suffix of ['', '-wal', '-shm']) {
    try { fs.rmSync(`${dbPath}${suffix}`, { force: true }); } catch {}
  }
});
