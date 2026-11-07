import { getDatabase } from '../../../database/db.js';
import type { IRPFIncome } from '../../../types.js';

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
