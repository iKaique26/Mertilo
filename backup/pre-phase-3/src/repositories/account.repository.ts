/**
 * Account Repository
 * Responsável apenas pela persistência de dados de contas
 */

import { readData, writeData } from '../data/store.js';
import type { Account } from '../types.js';

export const accountRepository = {
  /**
   * Retorna todas as contas
   */
  getAll(): Account[] {
    return readData().contas;
  },

  /**
   * Retorna uma conta pelo ID
   */
  getById(id: string): Account | undefined {
    const data = readData();
    return data.contas.find((acc) => acc.id === id);
  },

  /**
   * Cria uma nova conta
   */
  create(account: Omit<Account, 'id' | 'data'>): Account {
    const data = readData();
    const newAccount: Account = {
      ...account,
      id: Date.now().toString(),
      data: new Date().toISOString(),
    };
    data.contas.push(newAccount);
    writeData(data);
    return newAccount;
  },

  /**
   * Atualiza uma conta existente
   */
  update(id: string, updates: Partial<Omit<Account, 'id' | 'data'>>): Account | null {
    const data = readData();
    const index = data.contas.findIndex((acc) => acc.id === id);

    if (index === -1) {
      return null;
    }

    const current = data.contas[index];
    data.contas[index] = { ...current, ...updates };
    writeData(data);
    return data.contas[index];
  },

  /**
   * Deleta uma conta
   */
  delete(id: string): boolean {
    const data = readData();
    const initialLength = data.contas.length;
    data.contas = data.contas.filter((acc) => acc.id !== id);

    if (data.contas.length === initialLength) {
      return false; // Não encontrou
    }

    writeData(data);
    return true;
  },
};
