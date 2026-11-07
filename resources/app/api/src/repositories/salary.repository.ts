/**
 * Salary Repository
 * Persistência de dados de salário usando SQLite
 */

import { getDatabase } from '../database/db.js';

export const salaryRepository = {
  /**
   * Retorna o salário atual
   */
  get(userId: string): number {
    const db = getDatabase();
    const row = db.prepare('SELECT amount FROM salary_config WHERE id = ? AND user_id = ?').get(`salary:${userId}`, userId) as any;
    return row?.amount ?? 0;
  },

  /**
   * Atualiza o salário
   */
  set(salary: number, userId: string): number {
    const db = getDatabase();
    const now = new Date().toISOString();

    // Tentar atualizar primeiro
    const result = db.prepare('UPDATE salary_config SET amount = ?, updated_at = ? WHERE id = ? AND user_id = ?').run(
      salary,
      now,
      `salary:${userId}`,
      userId
    );

    // Se não atualizou, inserir
    if ((result.changes as number) === 0) {
      db.prepare(
        `INSERT INTO salary_config (id, amount, updated_at, user_id) VALUES (?, ?, ?, ?)`
      ).run(`salary:${userId}`, salary, now, userId);
    }

    return salary;
  },
};
