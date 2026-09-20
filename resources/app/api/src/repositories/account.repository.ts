/**
 * Account Repository
 * Persistência de dados de contas usando SQLite
 */

import { getDatabase } from '../database/db.js';
import type { Account } from '../types.js';

export const accountRepository = {
  /**
   * Retorna todas as contas
   */
  getAll(userId?: string): Account[] {
    const db = getDatabase();
    // Strict per-user isolation: if userId provided, return only rows for that user
    const rows = userId
      ? db.prepare('SELECT * FROM accounts WHERE user_id = ? ORDER BY created_at DESC').all(userId)
      : db.prepare('SELECT * FROM accounts WHERE user_id IS NULL ORDER BY created_at DESC').all();

    return rows.map((row: any) => ({
      id: row.id,
      nome: row.name,
      valor: row.valor,
      categoria: row.category,
      isFixed: Boolean(row.is_fixed),
      data: row.created_at,
    }));
  },

  /**
   * Retorna uma conta pelo ID
   */
  getById(id: string, userId?: string): Account | undefined {
    const db = getDatabase();
    // Require explicit user match when userId is provided
    const row = userId
      ? db.prepare('SELECT * FROM accounts WHERE id = ? AND user_id = ?').get(id, userId) as any
      : db.prepare('SELECT * FROM accounts WHERE id = ?').get(id) as any;

    if (!row) return undefined;


    return {
      id: row.id,
      nome: row.name,
      valor: row.valor,
      categoria: row.category,
      isFixed: Boolean(row.is_fixed),
      data: row.created_at,
    };
  },

  /**
   * Cria uma nova conta
   */
  create(account: Omit<Account, 'id' | 'data'>, userId?: string): Account {
    const db = getDatabase();
    const id = Date.now().toString();
    const now = new Date().toISOString();

    db.prepare(
      `INSERT INTO accounts (id, name, valor, category, is_fixed, created_at, updated_at, user_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(id, account.nome, account.valor, account.categoria, account.isFixed ? 1 : 0, now, now, userId ?? null);

    return {
      id,
      nome: account.nome,
      valor: account.valor,
      categoria: account.categoria,
      isFixed: account.isFixed,
      data: now,
    };
  },

  /**
   * Atualiza uma conta existente
   */
  update(id: string, updates: Partial<Omit<Account, 'id' | 'data'>>, userId?: string): Account | null {
    const db = getDatabase();
    const existing = accountRepository.getById(id, userId);
    
    if (!existing) {
      return null;
    }

    const now = new Date().toISOString();
    const updateData: any = {
      ...existing,
      ...updates,
    };

    db.prepare(
      `UPDATE accounts 
       SET name = ?, valor = ?, category = ?, is_fixed = ?, updated_at = ?
       WHERE id = ? AND ${userId ? 'user_id = ?' : 'user_id IS NULL'}`
    ).run(
      updateData.nome,
      updateData.valor,
      updateData.categoria,
      updateData.isFixed ? 1 : 0,
      now,
      ...(userId ? [id, userId] : [id])
    );

    return {
      id,
      nome: updateData.nome,
      valor: updateData.valor,
      categoria: updateData.categoria,
      isFixed: updateData.isFixed,
      data: existing.data,
    };
  },

  /**
   * Deleta uma conta
   */
  delete(id: string, userId?: string): boolean {
    const db = getDatabase();
    if (userId) {
      const result = db.prepare('DELETE FROM accounts WHERE id = ? AND user_id = ?').run(id, userId);
      return (result.changes as number) > 0;
    }
    const result = db.prepare('DELETE FROM accounts WHERE id = ? AND user_id IS NULL').run(id);
    return (result.changes as number) > 0;
  },
};
