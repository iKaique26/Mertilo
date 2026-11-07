import { getDatabase } from '../../../database/db.js';
import type { IRPFAlert } from '../../../types.js';

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
