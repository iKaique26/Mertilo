/**
 * Vehicle Expense Repository
 * Persistência de dados de despesas de veículo usando SQLite
 */

import { getDatabase } from '../database/db.js';
import type { VehicleExpense } from '../types.js';

export const vehicleExpenseRepository = {
  /**
   * Retorna todas as despesas de veículo
   */
  getAll(userId?: string): VehicleExpense[] {
    const db = getDatabase();
    const stmt = userId
      ? db.prepare('SELECT * FROM vehicle_expenses WHERE user_id = ? ORDER BY created_at DESC')
      : db.prepare('SELECT * FROM vehicle_expenses ORDER BY created_at DESC');
    const rows = stmt.all(...(userId ? [userId] : []));
    
    return rows.map((row: any) => ({
      id: row.id,
      data: row.created_at,
      precoCombustivel: row.preco_combustivel,
      mediaConsumo: row.media_consumo,
      kmPercorrido: row.km_percorrido,
      tipoTrajeto: row.tipo_trajeto,
      custo: row.custo,
      receita: row.receita,
      lucro: row.lucro,
    }));
  },

  /**
   * Retorna uma despesa pelo ID
   */
  getById(id: string, userId?: string): VehicleExpense | undefined {
    const db = getDatabase();
    const stmt = userId
      ? db.prepare('SELECT * FROM vehicle_expenses WHERE id = ? AND user_id = ?')
      : db.prepare('SELECT * FROM vehicle_expenses WHERE id = ?');
    const row = stmt.get(...(userId ? [id, userId] : [id])) as any;
    
    if (!row) {
      return undefined;
    }

    return {
      id: row.id,
      data: row.created_at,
      precoCombustivel: row.preco_combustivel,
      mediaConsumo: row.media_consumo,
      kmPercorrido: row.km_percorrido,
      tipoTrajeto: row.tipo_trajeto,
      custo: row.custo,
      receita: row.receita,
      lucro: row.lucro,
    };
  },

  /**
   * Cria uma nova despesa de veículo
   */
  create(expense: Omit<VehicleExpense, 'id' | 'data'>, userId?: string): VehicleExpense {
    const db = getDatabase();
    const id = Date.now().toString();
    const now = new Date().toISOString();

    db.prepare(
      `INSERT INTO vehicle_expenses (id, preco_combustivel, media_consumo, km_percorrido, tipo_trajeto, custo, receita, lucro, created_at, updated_at, user_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(
      id,
      expense.precoCombustivel,
      expense.mediaConsumo,
      expense.kmPercorrido,
      expense.tipoTrajeto,
      expense.custo,
      expense.receita,
      expense.lucro,
      now,
      now,
      userId ?? null
    );

    return {
      id,
      data: now,
      precoCombustivel: expense.precoCombustivel,
      mediaConsumo: expense.mediaConsumo,
      kmPercorrido: expense.kmPercorrido,
      tipoTrajeto: expense.tipoTrajeto,
      custo: expense.custo,
      receita: expense.receita,
      lucro: expense.lucro,
    };
  },

  /**
   * Atualiza uma despesa de veículo
   */
  update(id: string, updates: Partial<Omit<VehicleExpense, 'id' | 'data'>>, userId?: string): VehicleExpense | null {
    const db = getDatabase();
    const existing = vehicleExpenseRepository.getById(id, userId);
    
    if (!existing) {
      return null;
    }

    const now = new Date().toISOString();
    const updateData = {
      precoCombustivel: updates.precoCombustivel ?? existing.precoCombustivel,
      mediaConsumo: updates.mediaConsumo ?? existing.mediaConsumo,
      kmPercorrido: updates.kmPercorrido ?? existing.kmPercorrido,
      tipoTrajeto: updates.tipoTrajeto ?? existing.tipoTrajeto,
      custo: updates.custo ?? existing.custo,
      receita: updates.receita ?? existing.receita,
      lucro: updates.lucro ?? existing.lucro,
    };

    if (userId) {
      db.prepare(
        `UPDATE vehicle_expenses
         SET preco_combustivel = ?, media_consumo = ?, km_percorrido = ?, tipo_trajeto = ?, custo = ?, receita = ?, lucro = ?, updated_at = ?
         WHERE id = ? AND user_id = ?`
      ).run(
        updateData.precoCombustivel,
        updateData.mediaConsumo,
        updateData.kmPercorrido,
        updateData.tipoTrajeto,
        updateData.custo,
        updateData.receita,
        updateData.lucro,
        now,
        id,
        userId
      );
    } else {
      db.prepare(
        `UPDATE vehicle_expenses
         SET preco_combustivel = ?, media_consumo = ?, km_percorrido = ?, tipo_trajeto = ?, custo = ?, receita = ?, lucro = ?, updated_at = ?
         WHERE id = ?`
      ).run(
        updateData.precoCombustivel,
        updateData.mediaConsumo,
        updateData.kmPercorrido,
        updateData.tipoTrajeto,
        updateData.custo,
        updateData.receita,
        updateData.lucro,
        now,
        id
      );
    }

    return {
      id,
      data: existing.data,
      precoCombustivel: updateData.precoCombustivel,
      mediaConsumo: updateData.mediaConsumo,
      kmPercorrido: updateData.kmPercorrido,
      tipoTrajeto: updateData.tipoTrajeto,
      custo: updateData.custo,
      receita: updateData.receita,
      lucro: updateData.lucro,
    };
  },

  /**
   * Deleta uma despesa de veículo
   */
  delete(id: string, userId?: string): boolean {
    const db = getDatabase();
    let result;
    if (userId) {
      result = db.prepare('DELETE FROM vehicle_expenses WHERE id = ? AND user_id = ?').run(id, userId);
    } else {
      result = db.prepare('DELETE FROM vehicle_expenses WHERE id = ?').run(id);
    }
    return (result.changes as number) > 0;
  },
};
