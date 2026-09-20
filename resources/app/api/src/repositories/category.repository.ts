/**
 * Category Repository
 * Persistência de dados de categorias usando SQLite
 */

import { getDatabase } from '../database/db.js';
import type { Category } from '../types.js';

export const categoryRepository = {
  /**
   * Retorna todas as categorias
   */
  getAll(userId?: string): Category[] {
    const db = getDatabase();
    const stmt = userId
      ? db.prepare('SELECT * FROM categories WHERE user_id = ? ORDER BY created_at DESC')
      : db.prepare('SELECT * FROM categories ORDER BY created_at DESC');
    const rows = stmt.all(...(userId ? [userId] : []));
    
    return rows.map((row: any) => ({
      id: row.id,
      nome: row.name,
      cor: row.color,
      percentual: row.percentage,
    }));
  },

  /**
   * Retorna uma categoria pelo ID
   */
  getById(id: string, userId?: string): Category | undefined {
    const db = getDatabase();
    const stmt = userId
      ? db.prepare('SELECT * FROM categories WHERE id = ? AND user_id = ?')
      : db.prepare('SELECT * FROM categories WHERE id = ?');
    const row = stmt.get(...(userId ? [id, userId] : [id])) as any;
    
    if (!row) {
      return undefined;
    }

    return {
      id: row.id,
      nome: row.name,
      cor: row.color,
      percentual: row.percentage,
    };
  },

  /**
   * Cria uma nova categoria
   */
  create(category: Omit<Category, 'id'>, userId?: string): Category {
    const db = getDatabase();
    const id = Date.now().toString();
    const now = new Date().toISOString();

    db.prepare(
      `INSERT INTO categories (id, name, color, percentage, created_at, updated_at, user_id)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    ).run(id, category.nome, category.cor, category.percentual, now, now, userId ?? null);

    return {
      id,
      nome: category.nome,
      cor: category.cor,
      percentual: category.percentual,
    };
  },

  /**
   * Atualiza uma categoria
   */
  update(id: string, updates: Partial<Omit<Category, 'id'>>, userId?: string): Category | null {
    const db = getDatabase();
    const existing = categoryRepository.getById(id, userId);
    
    if (!existing) {
      return null;
    }

    const now = new Date().toISOString();
    const updateData = {
      nome: updates.nome ?? existing.nome,
      cor: updates.cor ?? existing.cor,
      percentual: updates.percentual ?? existing.percentual,
    };

    const stmt = userId
      ? db.prepare('UPDATE categories SET name = ?, color = ?, percentage = ?, updated_at = ? WHERE id = ? AND user_id = ?')
      : db.prepare('UPDATE categories SET name = ?, color = ?, percentage = ?, updated_at = ? WHERE id = ?');
    stmt.run(...(userId ? [updateData.nome, updateData.cor, updateData.percentual, now, id, userId] : [updateData.nome, updateData.cor, updateData.percentual, now, id]));

    return {
      id,
      nome: updateData.nome,
      cor: updateData.cor,
      percentual: updateData.percentual,
    };
  },

  /**
   * Deleta uma categoria
   */
  delete(id: string, userId?: string): boolean {
    const db = getDatabase();
    const result = userId
      ? db.prepare('DELETE FROM categories WHERE id = ? AND user_id = ?').run(id, userId)
      : db.prepare('DELETE FROM categories WHERE id = ?').run(id);
    return (result.changes as number) > 0;
  },
};
