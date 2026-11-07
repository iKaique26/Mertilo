import { getDatabase } from '../../../database/db.js';

export const correctionsRepository = {
  create(exerciseId: string, data: { document_id?: string; extracted_data_id?: string; field_name: string; original_value: any; corrected_value: any; actor?: string; reason?: string; }) {
    const db = getDatabase();
    const id = `corr_${Date.now()}`;
    const now = new Date().toISOString();
    const sql = `
      INSERT INTO irpf_correction_history (id, exercise_id, document_id, extracted_data_id, field_name, original_value, corrected_value, actor, reason, created_at)
      VALUES (:id, :exercise_id, :document_id, :extracted_data_id, :field_name, :original_value, :corrected_value, :actor, :reason, :created_at)
    `;
    const stmt = db.prepare(sql);

    const params = {
      id,
      exercise_id: exerciseId,
      document_id: data.document_id || null,
      extracted_data_id: data.extracted_data_id || null,
      field_name: data.field_name,
      original_value: data.original_value == null ? null : String(data.original_value),
      corrected_value: data.corrected_value == null ? null : String(data.corrected_value),
      actor: data.actor == null ? null : String(data.actor),
      reason: data.reason == null ? null : String(data.reason),
      created_at: now,
    };

    console.error('DEBUG correctionsRepository.create params:', params);

    try {
      stmt.run(params);
    } catch (err) {
      console.error('correctionsRepository.create failed', { sql, params, err: err instanceof Error ? err.message : String(err) });
      throw err;
    }

    return { id, exercise_id: exerciseId, document_id: data.document_id, extracted_data_id: data.extracted_data_id, field_name: data.field_name, original_value: data.original_value, corrected_value: data.corrected_value, actor: data.actor, reason: data.reason, created_at: now };
  },

  getByDocument(documentId: string, userId?: string) {
    const db = getDatabase();
    if (userId) {
      const stmt = db.prepare('SELECT c.* FROM irpf_correction_history c JOIN irpf_exercises e ON c.exercise_id = e.id WHERE c.document_id = ? AND e.user_id = ? ORDER BY c.created_at DESC');
      return stmt.all(documentId, userId);
    }
    const stmt = db.prepare('SELECT * FROM irpf_correction_history WHERE document_id = ? ORDER BY created_at DESC');
    return stmt.all(documentId);
  },

  getByExercise(exerciseId: string, userId?: string) {
    const db = getDatabase();
    if (userId) {
      const stmt = db.prepare('SELECT c.* FROM irpf_correction_history c JOIN irpf_exercises e ON c.exercise_id = e.id WHERE c.exercise_id = ? AND e.user_id = ? ORDER BY c.created_at DESC');
      return stmt.all(exerciseId, userId);
    }
    const stmt = db.prepare('SELECT * FROM irpf_correction_history WHERE exercise_id = ? ORDER BY created_at DESC');
    return stmt.all(exerciseId);
  },
};
