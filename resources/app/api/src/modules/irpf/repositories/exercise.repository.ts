import { getDatabase } from '../../../database/db.js';
import type { IRPFExercise } from '../../../types.js';

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
