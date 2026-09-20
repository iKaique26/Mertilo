/**
 * History Repository
 * Responsável apenas pela persistência de dados de histórico
 */

import { readData, writeData } from '../data/store.js';
import type { MonthlyHistory } from '../types.js';

export const historyRepository = {
  /**
   * Retorna todo o histórico
   */
  getAll(): MonthlyHistory[] {
    return readData().historico;
  },

  /**
   * Retorna um histórico pelo ID
   */
  getById(id: string): MonthlyHistory | undefined {
    const data = readData();
    return data.historico.find((h) => h.id === id);
  },

  /**
   * Cria um novo registro de histórico
   */
  create(history: Omit<MonthlyHistory, 'id' | 'criadoEm'>): MonthlyHistory {
    const data = readData();
    const newHistory: MonthlyHistory = {
      ...history,
      id: Date.now().toString(),
      criadoEm: new Date().toISOString(),
    };
    data.historico.push(newHistory);
    writeData(data);
    return newHistory;
  },

  /**
   * Atualiza um registro de histórico
   */
  update(
    id: string,
    updates: Partial<Omit<MonthlyHistory, 'id' | 'criadoEm'>>
  ): MonthlyHistory | null {
    const data = readData();
    const index = data.historico.findIndex((h) => h.id === id);

    if (index === -1) {
      return null;
    }

    const current = data.historico[index];
    data.historico[index] = { ...current, ...updates };
    writeData(data);
    return data.historico[index];
  },

  /**
   * Deleta um registro de histórico
   */
  delete(id: string): boolean {
    const data = readData();
    const initialLength = data.historico.length;
    data.historico = data.historico.filter((h) => h.id !== id);

    if (data.historico.length === initialLength) {
      return false;
    }

    writeData(data);
    return true;
  },
};
