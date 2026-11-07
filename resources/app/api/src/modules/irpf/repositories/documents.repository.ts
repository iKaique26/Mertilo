import { getDatabase } from '../../../database/db.js';
import type { IRPFDocument } from '../../../types.js';

export const documentsRepository = {
  create(exerciseId: string, data: Omit<IRPFDocument, 'id' | 'created_at' | 'updated_at'>): IRPFDocument {
    const db = getDatabase();
    const id = `doc_${Date.now()}`;
    const now = new Date().toISOString();

    const stmt = db.prepare(`
      INSERT INTO irpf_documents 
      (id, exercise_id, filename, file_path, file_type, mime_type, file_size, document_type, status, extraction_progress, confidence_score, is_verified, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      id,
      exerciseId,
      data.filename,
      data.file_path,
      data.file_type,
      data.mime_type,
      data.file_size,
      data.document_type || null,
      'pending',
      0,
      0,
      0,
      now,
      now
    );

    return {
      id,
      exercise_id: exerciseId,
      filename: data.filename,
      file_path: data.file_path,
      file_type: data.file_type,
      mime_type: data.mime_type,
      file_size: data.file_size,
      document_type: data.document_type,
      status: 'pending',
      extraction_progress: 0,
      confidence_score: 0,
      is_verified: false,
      created_at: now,
      updated_at: now,
    };
  },

  getAll(exerciseId: string, userId?: string): IRPFDocument[] {
    const db = getDatabase();
    if (userId) {
      const stmt = db.prepare('SELECT d.* FROM irpf_documents d JOIN irpf_exercises e ON d.exercise_id = e.id WHERE d.exercise_id = ? AND e.user_id = ? ORDER BY d.created_at DESC');
      return stmt.all(exerciseId, userId) as IRPFDocument[];
    }
    const stmt = db.prepare('SELECT * FROM irpf_documents WHERE exercise_id = ? ORDER BY created_at DESC');
    return stmt.all(exerciseId) as IRPFDocument[];
  },

  getById(id: string, userId?: string): IRPFDocument | null {
    const db = getDatabase();
    if (userId) {
      const stmt = db.prepare('SELECT d.* FROM irpf_documents d JOIN irpf_exercises e ON d.exercise_id = e.id WHERE d.id = ? AND e.user_id = ?');
      return (stmt.get(id, userId) as IRPFDocument) || null;
    }
    const stmt = db.prepare('SELECT * FROM irpf_documents WHERE id = ?');
    return (stmt.get(id) as IRPFDocument) || null;
  },

  update(id: string, data: Partial<IRPFDocument>, userId?: string): IRPFDocument | null {
    const db = getDatabase();
    const now = new Date().toISOString();
    const doc = this.getById(id, userId);
    if (!doc) return null;

    const updated = { ...doc, ...data, updated_at: now };
    if (userId) {
      const stmt = db.prepare(`UPDATE irpf_documents SET status = ?, extraction_progress = ?, extracted_data = ?, confidence_score = ?, is_verified = ?, updated_at = ? WHERE id = ? AND exercise_id IN (SELECT id FROM irpf_exercises WHERE user_id = ?)`);
      stmt.run(updated.status, updated.extraction_progress, updated.extracted_data || null, updated.confidence_score, updated.is_verified ? 1 : 0, now, id, userId);
    } else {
      const stmt = db.prepare(`
        UPDATE irpf_documents 
        SET status = ?, extraction_progress = ?, extracted_data = ?, confidence_score = ?, is_verified = ?, updated_at = ?
        WHERE id = ?
      `);
      stmt.run(updated.status, updated.extraction_progress, updated.extracted_data || null, updated.confidence_score, updated.is_verified ? 1 : 0, now, id);
    }

    return updated;
  },

  delete(id: string, userId?: string): boolean {
    const db = getDatabase();
    if (userId) {
      const stmt = db.prepare('DELETE FROM irpf_documents WHERE id = ? AND exercise_id IN (SELECT id FROM irpf_exercises WHERE user_id = ?)');
      const result = stmt.run(id, userId);
      return (result.changes as number) > 0;
    }
    const stmt = db.prepare('DELETE FROM irpf_documents WHERE id = ?');
    stmt.run(id);
    return true;
  },
};
