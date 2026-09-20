/**
 * History Repository
 * Persistência de dados de histórico mensal usando SQLite
 */

import { getDatabase } from '../database/db.js';
import type { MonthlyHistory } from '../types.js';

export const historyRepository = {
  /**
   * Retorna todo o histórico
   */
  getAll(userId?: string): MonthlyHistory[] {
    const db = getDatabase();
    const stmt = userId
      ? db.prepare('SELECT * FROM monthly_history WHERE user_id = ? ORDER BY mes DESC')
      : db.prepare('SELECT * FROM monthly_history ORDER BY mes DESC');
    const rows = stmt.all(...(userId ? [userId] : []));
    
    return rows.map((row: any) => ({
      id: row.id,
      mes: row.mes,
      salario: row.salary,
      totalContas: row.total_contas,
      saldoDisponivel: row.saldo_disponivel,
      distribuicao: [],
      totalExtras: row.total_extras,
      rendaTotal: row.renda_total,
      extras: [],
      criadoEm: row.created_at,
    }));
  },

  /**
   * Retorna um histórico pelo ID
   */
  getById(id: string, userId?: string): MonthlyHistory | undefined {
    const db = getDatabase();
    const stmt = userId
      ? db.prepare('SELECT * FROM monthly_history WHERE id = ? AND user_id = ?')
      : db.prepare('SELECT * FROM monthly_history WHERE id = ?');
    const row = stmt.get(...(userId ? [id, userId] : [id])) as any;
    
    if (!row) {
      return undefined;
    }

    return {
      id: row.id,
      mes: row.mes,
      salario: row.salary,
      totalContas: row.total_contas,
      saldoDisponivel: row.saldo_disponivel,
      distribuicao: [],
      totalExtras: row.total_extras,
      rendaTotal: row.renda_total,
      extras: [],
      criadoEm: row.created_at,
    };
  },

  /**
   * Cria um novo registro de histórico
   */
  create(history: Omit<MonthlyHistory, 'id' | 'criadoEm'>, userId?: string): MonthlyHistory {
    const db = getDatabase();
    const id = Date.now().toString();
    const now = new Date().toISOString();

    db.prepare(
      `INSERT INTO monthly_history (id, mes, salary, total_contas, saldo_disponivel, total_extras, renda_total, created_at, updated_at, user_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(
      id,
      history.mes,
      history.salario,
      history.totalContas,
      history.saldoDisponivel,
      history.totalExtras,
      history.rendaTotal,
      now,
      now,
      userId ?? null
    );

    return {
      id,
      mes: history.mes,
      salario: history.salario,
      totalContas: history.totalContas,
      saldoDisponivel: history.saldoDisponivel,
      distribuicao: [],
      totalExtras: history.totalExtras,
      rendaTotal: history.rendaTotal,
      extras: [],
      criadoEm: now,
    };
  },

  /**
   * Atualiza um registro de histórico
   */
  update(
    id: string,
    updates: Partial<Omit<MonthlyHistory, 'id' | 'criadoEm'>>,
    userId?: string
  ): MonthlyHistory | null {
    const db = getDatabase();
    const existing = historyRepository.getById(id, userId);
    
    if (!existing) {
      return null;
    }

    const now = new Date().toISOString();
    const updateData = {
      mes: updates.mes ?? existing.mes,
      salario: updates.salario ?? existing.salario,
      totalContas: updates.totalContas ?? existing.totalContas,
      saldoDisponivel: updates.saldoDisponivel ?? existing.saldoDisponivel,
      totalExtras: updates.totalExtras ?? existing.totalExtras,
      rendaTotal: updates.rendaTotal ?? existing.rendaTotal,
    };

    const stmt = userId
      ? db.prepare(`UPDATE monthly_history SET mes = ?, salary = ?, total_contas = ?, saldo_disponivel = ?, total_extras = ?, renda_total = ?, updated_at = ? WHERE id = ? AND user_id = ?`)
      : db.prepare(`UPDATE monthly_history SET mes = ?, salary = ?, total_contas = ?, saldo_disponivel = ?, total_extras = ?, renda_total = ?, updated_at = ? WHERE id = ?`);

    stmt.run(...(userId ? [updateData.mes, updateData.salario, updateData.totalContas, updateData.saldoDisponivel, updateData.totalExtras, updateData.rendaTotal, now, id, userId] : [updateData.mes, updateData.salario, updateData.totalContas, updateData.saldoDisponivel, updateData.totalExtras, updateData.rendaTotal, now, id]));

    return {
      id,
      mes: updateData.mes,
      salario: updateData.salario,
      totalContas: updateData.totalContas,
      saldoDisponivel: updateData.saldoDisponivel,
      distribuicao: [],
      totalExtras: updateData.totalExtras,
      rendaTotal: updateData.rendaTotal,
      extras: [],
      criadoEm: existing.criadoEm,
    };
  },

  /**
   * Deleta um registro de histórico
   */
  delete(id: string, userId?: string): boolean {
    const db = getDatabase();
    let result;
    if (userId) {
      result = db.prepare('DELETE FROM monthly_history WHERE id = ? AND user_id = ?').run(id, userId);
    } else {
      result = db.prepare('DELETE FROM monthly_history WHERE id = ?').run(id);
    }
    return (result.changes as number) > 0;
  },
};
