/**
 * Salary Repository
 * Persistência de dados de salário usando SQLite
 */

import { getDatabase } from '../database/db.js';

export const salaryRepository = {
  /**
   * Retorna o salário atual
   */
  get(): number {
    const db = getDatabase();
    const row = db.prepare('SELECT amount FROM salary_config WHERE id = ?').get('salary') as any;
    return row?.amount ?? 0;
  },

  /**
   * Atualiza o salário
   */
  set(salary: number): number {
    const db = getDatabase();
    const now = new Date().toISOString();

    // Tentar atualizar primeiro
    const result = db.prepare('UPDATE salary_config SET amount = ?, updated_at = ? WHERE id = ?').run(
      salary,
      now,
      'salary'
    );

    // Se não atualizou, inserir
    if ((result.changes as number) === 0) {
      db.prepare(
        `INSERT INTO salary_config (id, amount, updated_at) VALUES (?, ?, ?)`
      ).run('salary', salary, now);
    }

    return salary;
  },
};
