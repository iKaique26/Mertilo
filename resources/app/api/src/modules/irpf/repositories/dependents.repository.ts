import { getDatabase } from '../../../database/db.js';
import type { IRPFDependent } from '../../../types.js';

export const dependentsRepository = {
  create(exerciseId: string, data: Omit<IRPFDependent, 'id' | 'created_at' | 'updated_at'>): IRPFDependent {
    const db = getDatabase();
    const id = `dependent_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date().toISOString();

    const stmt = db.prepare(`
      INSERT INTO irpf_dependents (id, exercise_id, name, cpf, relationship, birth_date, is_verified, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(id, exerciseId, data.name, data.cpf || null, data.relationship, data.birth_date || null, data.is_verified ? 1 : 0, now, now);

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
      return stmt.all(exerciseId, userId).map((row: any) => ({ ...row, is_verified: Boolean(row.is_verified) })) as IRPFDependent[];
    }
    const stmt = getDatabase().prepare('SELECT * FROM irpf_dependents WHERE exercise_id = ? ORDER BY created_at DESC');
    return stmt.all(exerciseId).map((row: any) => ({ ...row, is_verified: Boolean(row.is_verified) })) as IRPFDependent[];
  },

  getById(id: string, userId?: string): IRPFDependent | null {
    const db = getDatabase();
    if (userId) {
      const stmt = db.prepare('SELECT d.* FROM irpf_dependents d JOIN irpf_exercises e ON d.exercise_id = e.id WHERE d.id = ? AND e.user_id = ?');
      const row = stmt.get(id, userId) as any;
      return row ? { ...row, is_verified: Boolean(row.is_verified) } as IRPFDependent : null;
    }
    const stmt = db.prepare('SELECT * FROM irpf_dependents WHERE id = ?');
    const row = stmt.get(id) as any;
    return row ? { ...row, is_verified: Boolean(row.is_verified) } as IRPFDependent : null;
  },

  update(id: string, data: Partial<IRPFDependent>, userId?: string): IRPFDependent | null {
    const db = getDatabase();
    const now = new Date().toISOString();
    const allowedFields = ['name', 'cpf', 'relationship', 'birth_date', 'is_verified'] as const;
    const unknownFields = Object.keys(data).filter((key) => !allowedFields.includes(key as typeof allowedFields[number]));

    if (unknownFields.length > 0) {
      throw new Error(`Campos não permitidos: ${unknownFields.join(', ')}`);
    }

    const updateFields = allowedFields.filter((key) => Object.prototype.hasOwnProperty.call(data, key));
    if (updateFields.length === 0) {
      return this.getById(id, userId);
    }

    const fields = updateFields.map((key) => `${key} = ?`);
    fields.push('updated_at = ?');
    const values: Array<string | number | bigint | Buffer | null> = updateFields.map((key) => {
      const value = data[key];
      if (value === undefined || value === null) return value ?? null;
      return typeof value === 'boolean' ? (value ? 1 : 0) : value as string | number | bigint | Buffer;
    });
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
