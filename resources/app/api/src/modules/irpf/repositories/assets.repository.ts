import { getDatabase } from '../../../database/db.js';
import type { IRPFAsset } from '../../../types.js';

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
