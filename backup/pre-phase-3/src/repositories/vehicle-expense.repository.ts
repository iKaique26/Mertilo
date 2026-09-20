/**
 * Vehicle Expense Repository
 * Responsável apenas pela persistência de dados de despesas de veículo
 */

import { readData, writeData } from '../data/store.js';
import type { VehicleExpense } from '../types.js';

export const vehicleExpenseRepository = {
  /**
   * Retorna todas as despesas de veículo
   */
  getAll(): VehicleExpense[] {
    return readData().vexpenses;
  },

  /**
   * Retorna uma despesa pelo ID
   */
  getById(id: string): VehicleExpense | undefined {
    const data = readData();
    return data.vexpenses.find((vexp) => vexp.id === id);
  },

  /**
   * Cria uma nova despesa de veículo
   */
  create(expense: Omit<VehicleExpense, 'id' | 'data'>): VehicleExpense {
    const data = readData();
    const newExpense: VehicleExpense = {
      ...expense,
      id: Date.now().toString(),
      data: new Date().toISOString(),
    };
    data.vexpenses.push(newExpense);
    writeData(data);
    return newExpense;
  },

  /**
   * Atualiza uma despesa de veículo
   */
  update(id: string, updates: Partial<Omit<VehicleExpense, 'id' | 'data'>>): VehicleExpense | null {
    const data = readData();
    const index = data.vexpenses.findIndex((vexp) => vexp.id === id);

    if (index === -1) {
      return null;
    }

    const current = data.vexpenses[index];
    data.vexpenses[index] = { ...current, ...updates };
    writeData(data);
    return data.vexpenses[index];
  },

  /**
   * Deleta uma despesa de veículo
   */
  delete(id: string): boolean {
    const data = readData();
    const initialLength = data.vexpenses.length;
    data.vexpenses = data.vexpenses.filter((vexp) => vexp.id !== id);

    if (data.vexpenses.length === initialLength) {
      return false;
    }

    writeData(data);
    return true;
  },
};
