import { getDatabase } from '../../../database/db.js';

export const validationsRepository = {
  upsert(exerciseId: string, validationKey: string, data: { type?: string; severity?: string; title?: string; description?: string; status?: string; source_document_id?: string; related_document_id?: string; related_entity?: string; }) {
    const db = getDatabase();
    const now = new Date().toISOString();
    // Try update
    const existing: any = db.prepare('SELECT * FROM irpf_validations WHERE exercise_id = ? AND validation_key = ?').get(exerciseId, validationKey);
    if (existing) {
      const stmt = db.prepare(`
        UPDATE irpf_validations SET type = ?, severity = ?, title = ?, description = ?, status = ?, source_document_id = ?, related_document_id = ?, related_entity = ?, updated_at = ? WHERE id = ?
      `);
      stmt.run(data.type || existing.type, data.severity || existing.severity, data.title || existing.title, data.description || existing.description, data.status || existing.status, data.source_document_id || existing.source_document_id, data.related_document_id || existing.related_document_id, data.related_entity || existing.related_entity, now, existing.id);
      return { ...existing, ...data, updated_at: now };
    }

    const id = `val_${Date.now()}_${Math.floor(Math.random() * 1000000)}`;
    const stmt = db.prepare(`
      INSERT INTO irpf_validations (id, exercise_id, validation_key, type, severity, title, description, status, source_document_id, related_document_id, related_entity, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(id, exerciseId, validationKey, data.type || null, data.severity || null, data.title || null, data.description || null, data.status || 'PENDING', data.source_document_id || null, data.related_document_id || null, data.related_entity || null, now);
    return { id, exercise_id: exerciseId, validation_key: validationKey, ...data, status: data.status || 'PENDING', created_at: now };
  },

  getByExercise(exerciseId: string, userId?: string) {
    const db = getDatabase();
    if (userId) {
      const stmt = db.prepare('SELECT v.* FROM irpf_validations v JOIN irpf_exercises e ON v.exercise_id = e.id WHERE v.exercise_id = ? AND e.user_id = ? ORDER BY v.created_at DESC');
      return stmt.all(exerciseId, userId);
    }
    const stmt = db.prepare('SELECT * FROM irpf_validations WHERE exercise_id = ? ORDER BY created_at DESC');
    return stmt.all(exerciseId);
  },

  getById(id: string, userId?: string) {
    const db = getDatabase();
    if (userId) {
      const stmt = db.prepare('SELECT v.* FROM irpf_validations v JOIN irpf_exercises e ON v.exercise_id = e.id WHERE v.id = ? AND e.user_id = ?');
      return stmt.get(id, userId) as any;
    }
    const stmt = db.prepare('SELECT * FROM irpf_validations WHERE id = ?');
    return stmt.get(id) as any;
  },

  updateStatus(id: string, status: string, userId?: string) {
    const db = getDatabase();
    const now = new Date().toISOString();
    if (userId) {
      const stmt = db.prepare('UPDATE irpf_validations SET status = ?, updated_at = ?, resolved_at = CASE WHEN ? IN (\'RESOLVED\',\'IGNORED\') THEN ? ELSE resolved_at END WHERE id = ? AND exercise_id IN (SELECT id FROM irpf_exercises WHERE user_id = ?)');
      stmt.run(status, now, status, now, id, userId);
    } else {
      const stmt = db.prepare('UPDATE irpf_validations SET status = ?, updated_at = ?, resolved_at = CASE WHEN ? IN (\'RESOLVED\',\'IGNORED\') THEN ? ELSE resolved_at END WHERE id = ?');
      stmt.run(status, now, status, now, id);
    }
    return this.getById(id, userId);
  }
};
