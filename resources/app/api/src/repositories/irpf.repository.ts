/**
 * IRPF Repository
 * Acesso a dados do módulo de Imposto de Renda
 */

import { getDatabase } from '../database/db.js';
import type {
  IRPFExercise,
  IRPFDocument,
  IRPFIncome,
  IRPFAsset,
  IRPFDependent,
  IRPFDeduction,
  IRPFAlert,
  IRPFRule,
} from '../types.js';

/**
 * EXERCISES
 */
export const exercisesRepository = {
  create(year: number, userId?: string): IRPFExercise {
    // legacy-compatible: allow passing user_id later; overload in service can set user_id
    const db = getDatabase();
    const id = `exercise_${Date.now()}`;
    const now = new Date().toISOString();

    const stmt = db.prepare(`
      INSERT INTO irpf_exercises (id, year, status, progress, created_at, updated_at, user_id)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(id, year, 'draft', 0, now, now, userId ?? null);

    return { id, year, status: 'draft', progress: 0, created_at: now, updated_at: now };
  },

  getAll(userId?: string): IRPFExercise[] {
    const db = getDatabase();
    const stmt = userId
      ? db.prepare('SELECT * FROM irpf_exercises WHERE user_id = ? ORDER BY year DESC')
      : db.prepare('SELECT * FROM irpf_exercises WHERE user_id IS NULL ORDER BY year DESC');
    return stmt.all(userId) as IRPFExercise[];
  },

  getById(id: string, userId?: string): IRPFExercise | null {
    const db = getDatabase();
    const stmt = userId
      ? db.prepare('SELECT * FROM irpf_exercises WHERE id = ? AND user_id = ?')
      : db.prepare('SELECT * FROM irpf_exercises WHERE id = ?');
    return (stmt.get(id, ...(userId ? [userId] : [])) as IRPFExercise) || null;
  },

  getByYear(year: number, userId?: string): IRPFExercise | null {
    const db = getDatabase();
    const stmt = userId
      ? db.prepare('SELECT * FROM irpf_exercises WHERE year = ? AND user_id = ?')
      : db.prepare('SELECT * FROM irpf_exercises WHERE year = ?');
    return (stmt.get(year, ...(userId ? [userId] : [])) as IRPFExercise) || null;
  },

  update(id: string, data: Partial<IRPFExercise>, userId?: string): IRPFExercise | null {
    const db = getDatabase();
    const now = new Date().toISOString();
    const exercise = this.getById(id, userId);
    if (!exercise) return null;

    const updated = { ...exercise, ...data, updated_at: now };
    const stmt = userId
      ? db.prepare(`
          UPDATE irpf_exercises 
          SET status = ?, progress = ?, updated_at = ?
          WHERE id = ? AND user_id = ?
        `)
      : db.prepare(`
          UPDATE irpf_exercises 
          SET status = ?, progress = ?, updated_at = ?
          WHERE id = ? AND user_id IS NULL
        `);

    stmt.run(updated.status, updated.progress, now, ...(userId ? [id, userId] : [id]));

    return updated;
  },

  delete(id: string, userId?: string): boolean {
    const db = getDatabase();
    if (userId) {
      const result = db.prepare('DELETE FROM irpf_exercises WHERE id = ? AND user_id = ?').run(id, userId);
      return (result.changes as number) > 0;
    }
    const result = db.prepare('DELETE FROM irpf_exercises WHERE id = ? AND user_id IS NULL').run(id);
    return (result.changes as number) > 0;
  },
};

/**
 * DOCUMENTS
 */
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

/**
 * INCOME
 */
export const incomeRepository = {
  create(exerciseId: string, data: Omit<IRPFIncome, 'id' | 'created_at' | 'updated_at'>): IRPFIncome {
    const db = getDatabase();
    const id = `income_${Date.now()}`;
    const now = new Date().toISOString();

    const stmt = db.prepare(`
      INSERT INTO irpf_income 
      (id, exercise_id, document_id, income_type, description, amount, month, source, confidence_score, is_verified, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      id,
      exerciseId,
      data.document_id || null,
      data.income_type,
      data.description || null,
      data.amount,
      data.month || null,
      data.source || null,
      data.confidence_score || 100,
      data.is_verified ? 1 : 0,
      now,
      now
    );

    return {
      id,
      exercise_id: exerciseId,
      document_id: data.document_id,
      income_type: data.income_type,
      description: data.description,
      amount: data.amount,
      month: data.month,
      source: data.source,
      confidence_score: data.confidence_score || 100,
      is_verified: data.is_verified || false,
      created_at: now,
      updated_at: now,
    };
  },

  getAll(exerciseId: string, userId?: string): IRPFIncome[] {
    const db = getDatabase();
    if (userId) {
      const stmt = db.prepare('SELECT i.* FROM irpf_income i JOIN irpf_exercises e ON i.exercise_id = e.id WHERE i.exercise_id = ? AND e.user_id = ? ORDER BY i.created_at DESC');
      return stmt.all(exerciseId, userId) as IRPFIncome[];
    }
    const stmt = db.prepare('SELECT * FROM irpf_income WHERE exercise_id = ? ORDER BY created_at DESC');
    return stmt.all(exerciseId) as IRPFIncome[];
  },

  getById(id: string, userId?: string): IRPFIncome | null {
    const db = getDatabase();
    if (userId) {
      const stmt = db.prepare('SELECT i.* FROM irpf_income i JOIN irpf_exercises e ON i.exercise_id = e.id WHERE i.id = ? AND e.user_id = ?');
      return (stmt.get(id, userId) as IRPFIncome) || null;
    }
    const stmt = db.prepare('SELECT * FROM irpf_income WHERE id = ?');
    return (stmt.get(id) as IRPFIncome) || null;
  },

  update(id: string, data: Partial<IRPFIncome>, userId?: string): IRPFIncome | null {
    const db = getDatabase();
    const now = new Date().toISOString();
    const income = this.getById(id, userId);
    if (!income) return null;

    const updated = { ...income, ...data, updated_at: now };
    if (userId) {
      const stmt = db.prepare('UPDATE irpf_income SET amount = ?, description = ?, confidence_score = ?, is_verified = ?, updated_at = ? WHERE id = ? AND exercise_id IN (SELECT id FROM irpf_exercises WHERE user_id = ?)');
      stmt.run(updated.amount, updated.description, updated.confidence_score, updated.is_verified ? 1 : 0, now, id, userId);
    } else {
      const stmt = db.prepare(`
        UPDATE irpf_income 
        SET amount = ?, description = ?, confidence_score = ?, is_verified = ?, updated_at = ?
        WHERE id = ?
      `);
      stmt.run(updated.amount, updated.description, updated.confidence_score, updated.is_verified ? 1 : 0, now, id);
    }

    return updated;
  },

  delete(id: string, userId?: string): boolean {
    const db = getDatabase();
    if (userId) {
      const stmt = db.prepare('DELETE FROM irpf_income WHERE id = ? AND exercise_id IN (SELECT id FROM irpf_exercises WHERE user_id = ?)');
      const result = stmt.run(id, userId);
      return (result.changes as number) > 0;
    }
    const stmt = db.prepare('DELETE FROM irpf_income WHERE id = ?');
    stmt.run(id);
    return true;
  },
};

/**
 * ASSETS
 */
export const assetsRepository = {
  create(exerciseId: string, data: Omit<IRPFAsset, 'id' | 'created_at' | 'updated_at'>): IRPFAsset {
    const db = getDatabase();
    const id = `asset_${Date.now()}`;
    const now = new Date().toISOString();

    const stmt = db.prepare(`
      INSERT INTO irpf_assets 
      (id, exercise_id, document_id, asset_type, description, value, location, confidence_score, is_verified, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      id,
      exerciseId,
      data.document_id || null,
      data.asset_type,
      data.description || null,
      data.value,
      data.location || null,
      data.confidence_score || 100,
      data.is_verified ? 1 : 0,
      now,
      now
    );

    return {
      id,
      exercise_id: exerciseId,
      document_id: data.document_id,
      asset_type: data.asset_type,
      description: data.description,
      value: data.value,
      location: data.location,
      confidence_score: data.confidence_score || 100,
      is_verified: data.is_verified || false,
      created_at: now,
      updated_at: now,
    };
  },

  getAll(exerciseId: string, userId?: string): IRPFAsset[] {
    const db = getDatabase();
    if (userId) {
      const stmt = db.prepare('SELECT a.* FROM irpf_assets a JOIN irpf_exercises e ON a.exercise_id = e.id WHERE a.exercise_id = ? AND e.user_id = ? ORDER BY a.created_at DESC');
      return stmt.all(exerciseId, userId) as IRPFAsset[];
    }
    const stmt = db.prepare('SELECT * FROM irpf_assets WHERE exercise_id = ? ORDER BY created_at DESC');
    return stmt.all(exerciseId) as IRPFAsset[];
  },

  getById(id: string, userId?: string): IRPFAsset | null {
    const db = getDatabase();
    if (userId) {
      const stmt = db.prepare('SELECT a.* FROM irpf_assets a JOIN irpf_exercises e ON a.exercise_id = e.id WHERE a.id = ? AND e.user_id = ?');
      return (stmt.get(id, userId) as IRPFAsset) || null;
    }
    const stmt = db.prepare('SELECT * FROM irpf_assets WHERE id = ?');
    return (stmt.get(id) as IRPFAsset) || null;
  },

  update(id: string, data: Partial<IRPFAsset>, userId?: string): IRPFAsset | null {
    const db = getDatabase();
    const now = new Date().toISOString();
    const asset = this.getById(id, userId);
    if (!asset) return null;

    const updated = { ...asset, ...data, updated_at: now };
    if (userId) {
      const stmt = db.prepare('UPDATE irpf_assets SET value = ?, description = ?, confidence_score = ?, is_verified = ?, updated_at = ? WHERE id = ? AND exercise_id IN (SELECT id FROM irpf_exercises WHERE user_id = ?)');
      stmt.run(updated.value, updated.description, updated.confidence_score, updated.is_verified ? 1 : 0, now, id, userId);
    } else {
      const stmt = db.prepare(`
        UPDATE irpf_assets 
        SET value = ?, description = ?, confidence_score = ?, is_verified = ?, updated_at = ?
        WHERE id = ?
      `);
      stmt.run(updated.value, updated.description, updated.confidence_score, updated.is_verified ? 1 : 0, now, id);
    }

    return updated;
  },

  delete(id: string, userId?: string): boolean {
    const db = getDatabase();
    if (userId) {
      const stmt = db.prepare('DELETE FROM irpf_assets WHERE id = ? AND exercise_id IN (SELECT id FROM irpf_exercises WHERE user_id = ?)');
      const result = stmt.run(id, userId);
      return (result.changes as number) > 0;
    }
    const stmt = db.prepare('DELETE FROM irpf_assets WHERE id = ?');
    stmt.run(id);
    return true;
  },
};

/**
 * DEDUCTIONS
 */
export const deductionsRepository = {
  create(exerciseId: string, data: Omit<IRPFDeduction, 'id' | 'created_at' | 'updated_at'>): IRPFDeduction {
    const db = getDatabase();
    const id = `deduction_${Date.now()}`;
    const now = new Date().toISOString();

    const stmt = db.prepare(`
      INSERT INTO irpf_deductions 
      (id, exercise_id, document_id, deduction_type, description, amount, category, confidence_score, is_verified, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      id,
      exerciseId,
      data.document_id || null,
      data.deduction_type,
      data.description || null,
      data.amount,
      data.category || null,
      data.confidence_score || 100,
      data.is_verified ? 1 : 0,
      now,
      now
    );

    return {
      id,
      exercise_id: exerciseId,
      document_id: data.document_id,
      deduction_type: data.deduction_type,
      description: data.description,
      amount: data.amount,
      category: data.category,
      confidence_score: data.confidence_score || 100,
      is_verified: data.is_verified || false,
      created_at: now,
      updated_at: now,
    };
  },

  getAll(exerciseId: string, userId?: string): IRPFDeduction[] {
    const db = getDatabase();
    if (userId) {
      const stmt = db.prepare('SELECT d.* FROM irpf_deductions d JOIN irpf_exercises e ON d.exercise_id = e.id WHERE d.exercise_id = ? AND e.user_id = ? ORDER BY d.created_at DESC');
      return stmt.all(exerciseId, userId) as IRPFDeduction[];
    }
    const stmt = db.prepare('SELECT * FROM irpf_deductions WHERE exercise_id = ? ORDER BY created_at DESC');
    return stmt.all(exerciseId) as IRPFDeduction[];
  },

  getById(id: string, userId?: string): IRPFDeduction | null {
    const db = getDatabase();
    if (userId) {
      const stmt = db.prepare('SELECT d.* FROM irpf_deductions d JOIN irpf_exercises e ON d.exercise_id = e.id WHERE d.id = ? AND e.user_id = ?');
      return (stmt.get(id, userId) as IRPFDeduction) || null;
    }
    const stmt = db.prepare('SELECT * FROM irpf_deductions WHERE id = ?');
    return (stmt.get(id) as IRPFDeduction) || null;
  },

  update(id: string, data: Partial<IRPFDeduction>, userId?: string): IRPFDeduction | null {
    const db = getDatabase();
    const now = new Date().toISOString();
    const deduction = this.getById(id, userId);
    if (!deduction) return null;

    const updated = { ...deduction, ...data, updated_at: now };
    if (userId) {
      const stmt = db.prepare('UPDATE irpf_deductions SET amount = ?, description = ?, confidence_score = ?, is_verified = ?, updated_at = ? WHERE id = ? AND exercise_id IN (SELECT id FROM irpf_exercises WHERE user_id = ?)');
      stmt.run(updated.amount, updated.description, updated.confidence_score, updated.is_verified ? 1 : 0, now, id, userId);
    } else {
      const stmt = db.prepare(`
        UPDATE irpf_deductions 
        SET amount = ?, description = ?, confidence_score = ?, is_verified = ?, updated_at = ?
        WHERE id = ?
      `);
      stmt.run(updated.amount, updated.description, updated.confidence_score, updated.is_verified ? 1 : 0, now, id);
    }

    return updated;
  },

  delete(id: string, userId?: string): boolean {
    const db = getDatabase();
    if (userId) {
      const stmt = db.prepare('DELETE FROM irpf_deductions WHERE id = ? AND exercise_id IN (SELECT id FROM irpf_exercises WHERE user_id = ?)');
      const result = stmt.run(id, userId);
      return (result.changes as number) > 0;
    }
    const stmt = db.prepare('DELETE FROM irpf_deductions WHERE id = ?');
    stmt.run(id);
    return true;
  },
};

/**
 * ALERTS
 */
export const alertsRepository = {
  create(exerciseId: string, data: Omit<IRPFAlert, 'id' | 'created_at' | 'updated_at'>): IRPFAlert {
    const db = getDatabase();
    const id = `alert_${Date.now()}`;
    const now = new Date().toISOString();

    const stmt = db.prepare(`
      INSERT INTO irpf_alerts 
      (id, exercise_id, alert_type, severity, message, related_id, is_resolved, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      id,
      exerciseId,
      data.alert_type,
      data.severity || 'info',
      data.message,
      data.related_id || null,
      false,
      now,
      now
    );

    return {
      id,
      exercise_id: exerciseId,
      alert_type: data.alert_type,
      severity: data.severity || 'info',
      message: data.message,
      related_id: data.related_id,
      is_resolved: false,
      created_at: now,
      updated_at: now,
    };
  },

  getAll(exerciseId: string, userId?: string): IRPFAlert[] {
    const db = getDatabase();
    if (userId) {
      const stmt = db.prepare('SELECT a.* FROM irpf_alerts a JOIN irpf_exercises e ON a.exercise_id = e.id WHERE a.exercise_id = ? AND e.user_id = ? ORDER BY a.created_at DESC');
      return stmt.all(exerciseId, userId) as IRPFAlert[];
    }
    const stmt = db.prepare('SELECT * FROM irpf_alerts WHERE exercise_id = ? ORDER BY created_at DESC');
    return stmt.all(exerciseId) as IRPFAlert[];
  },

  getById(id: string, userId?: string): IRPFAlert | null {
    const db = getDatabase();
    if (userId) {
      const stmt = db.prepare('SELECT a.* FROM irpf_alerts a JOIN irpf_exercises e ON a.exercise_id = e.id WHERE a.id = ? AND e.user_id = ?');
      return (stmt.get(id, userId) as IRPFAlert) || null;
    }
    const stmt = db.prepare('SELECT * FROM irpf_alerts WHERE id = ?');
    return (stmt.get(id) as IRPFAlert) || null;
  },

  update(id: string, data: Partial<IRPFAlert>, userId?: string): IRPFAlert | null {
    const db = getDatabase();
    const now = new Date().toISOString();
    const alert = this.getById(id, userId);
    if (!alert) return null;

    const updated = { ...alert, ...data, updated_at: now };
    if (userId) {
      const stmt = db.prepare('UPDATE irpf_alerts SET is_resolved = ?, updated_at = ? WHERE id = ? AND exercise_id IN (SELECT id FROM irpf_exercises WHERE user_id = ?)');
      stmt.run(updated.is_resolved ? 1 : 0, now, id, userId);
    } else {
      const stmt = db.prepare(`UPDATE irpf_alerts SET is_resolved = ?, updated_at = ? WHERE id = ?`);
      stmt.run(updated.is_resolved ? 1 : 0, now, id);
    }

    return updated;
  },

  delete(id: string, userId?: string): boolean {
    const db = getDatabase();
    if (userId) {
      const stmt = db.prepare('DELETE FROM irpf_alerts WHERE id = ? AND exercise_id IN (SELECT id FROM irpf_exercises WHERE user_id = ?)');
      const result = stmt.run(id, userId);
      return (result.changes as number) > 0;
    }
    const stmt = db.prepare('DELETE FROM irpf_alerts WHERE id = ?');
    stmt.run(id);
    return true;
  },
};

/**
 * CORRECTIONS HISTORY
 */
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

/**
 * VALIDATIONS
 */
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

/**
 * RULES
 */
export const rulesRepository = {
  create(data: Omit<IRPFRule, 'id' | 'created_at' | 'updated_at'>): IRPFRule {
    const db = getDatabase();
    const id = `rule_${Date.now()}`;
    const now = new Date().toISOString();

    const stmt = db.prepare(`
      INSERT INTO irpf_rules 
      (id, year, rule_type, rule_name, rule_value, description, source_url, source_date, is_active, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      id,
      data.year,
      data.rule_type,
      data.rule_name,
      data.rule_value || null,
      data.description || null,
      data.source_url || null,
      data.source_date || null,
      data.is_active ? 1 : 0,
      now,
      now
    );

    return {
      id,
      year: data.year,
      rule_type: data.rule_type,
      rule_name: data.rule_name,
      rule_value: data.rule_value,
      description: data.description,
      source_url: data.source_url,
      source_date: data.source_date,
      is_active: data.is_active || true,
      created_at: now,
      updated_at: now,
    };
  },

  getByYear(year: number): IRPFRule[] {
    const db = getDatabase();
    const stmt = db.prepare('SELECT * FROM irpf_rules WHERE year = ? AND is_active = 1');
    return stmt.all(year) as IRPFRule[];
  },

  getByYearAndType(year: number, ruleType: string): IRPFRule[] {
    const db = getDatabase();
    const stmt = db.prepare('SELECT * FROM irpf_rules WHERE year = ? AND rule_type = ? AND is_active = 1');
    return stmt.all(year, ruleType) as IRPFRule[];
  },

  delete(id: string): boolean {
    const db = getDatabase();
    const stmt = db.prepare('DELETE FROM irpf_rules WHERE id = ?');
    stmt.run(id);
    return true;
  },
};

/**
 * DEPENDENTS
 */
export const dependentsRepository = {
  create(exerciseId: string, data: Omit<IRPFDependent, 'id' | 'created_at' | 'updated_at'>): IRPFDependent {
    const db = getDatabase();
    const id = `dependent_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date().toISOString();

    const stmt = db.prepare(`
      INSERT INTO irpf_dependents (id, exercise_id, name, cpf, relationship, birth_date, is_verified, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(id, exerciseId, data.name, data.cpf || null, data.relationship, data.birth_date || null, data.is_verified || false, now, now);

    return {
      id,
      exercise_id: exerciseId,
      name: data.name,
      cpf: data.cpf || null,
      relationship: data.relationship,
      birth_date: data.birth_date || null,
      is_verified: data.is_verified || false,
      created_at: now,
      updated_at: now,
    } as IRPFDependent;
  },

  getAll(exerciseId: string, userId?: string): IRPFDependent[] {
    if (userId) {
      const stmt = getDatabase().prepare('SELECT d.* FROM irpf_dependents d JOIN irpf_exercises e ON d.exercise_id = e.id WHERE d.exercise_id = ? AND e.user_id = ? ORDER BY d.created_at DESC');
      return stmt.all(exerciseId, userId) as IRPFDependent[];
    }
    const stmt = getDatabase().prepare('SELECT * FROM irpf_dependents WHERE exercise_id = ? ORDER BY created_at DESC');
    return stmt.all(exerciseId) as IRPFDependent[];
  },

  getById(id: string, userId?: string): IRPFDependent | null {
    const db = getDatabase();
    if (userId) {
      const stmt = db.prepare('SELECT d.* FROM irpf_dependents d JOIN irpf_exercises e ON d.exercise_id = e.id WHERE d.id = ? AND e.user_id = ?');
      return (stmt.get(id, userId) as IRPFDependent) || null;
    }
    const stmt = db.prepare('SELECT * FROM irpf_dependents WHERE id = ?');
    return (stmt.get(id) as IRPFDependent) || null;
  },

  update(id: string, data: Partial<IRPFDependent>, userId?: string): IRPFDependent | null {
    const db = getDatabase();
    const now = new Date().toISOString();

    const fields = Object.keys(data)
      .filter((key) => key !== 'id' && key !== 'created_at')
      .map((key) => `${key} = ?`);

    if (fields.length === 0) {
      return this.getById(id);
    }

    fields.push('updated_at = ?');
    const values = Object.keys(data)
      .filter((key) => key !== 'id' && key !== 'created_at')
      .map((key) => (data as any)[key]);
    values.push(now);
    values.push(id);

    if (userId) {
      const stmt = db.prepare(`UPDATE irpf_dependents SET ${fields.join(', ')} WHERE id = ? AND exercise_id IN (SELECT id FROM irpf_exercises WHERE user_id = ?)`);
      stmt.run(...values.slice(0, -1), values[values.length - 1], userId);
    } else {
      const stmt = db.prepare(`UPDATE irpf_dependents SET ${fields.join(', ')} WHERE id = ?`);
      stmt.run(...values);
    }

    return this.getById(id, userId);
  },

  delete(id: string, userId?: string): boolean {
    const db = getDatabase();
    if (userId) {
      const stmt = db.prepare('DELETE FROM irpf_dependents WHERE id = ? AND exercise_id IN (SELECT id FROM irpf_exercises WHERE user_id = ?)');
      stmt.run(id, userId);
    } else {
      const stmt = db.prepare('DELETE FROM irpf_dependents WHERE id = ?');
      stmt.run(id);
    }
    return true;
  },
};
