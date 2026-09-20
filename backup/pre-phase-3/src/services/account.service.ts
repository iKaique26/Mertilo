/**
 * Account Service
 * Contém a lógica de negócio para contas
 */

import { accountRepository } from '../repositories/account.repository.js';
import type { Account } from '../types.js';

export const accountService = {
  /**
   * Retorna todas as contas
   */
  async getAll(): Promise<Account[]> {
    return accountRepository.getAll();
  },

  /**
   * Retorna uma conta pelo ID
   */
  async getById(id: string): Promise<Account | undefined> {
    return accountRepository.getById(id);
  },

  /**
   * Cria uma nova conta com validação
   */
  async create(
    nome: string,
    valor: number,
    categoria?: string,
    isFixed?: boolean
  ): Promise<Account> {
    // Validações de negócio
    if (!nome || nome.trim() === '') {
      throw new Error('Nome da conta é obrigatório');
    }

    if (typeof valor !== 'number' || valor < 0) {
      throw new Error('Valor deve ser um número não-negativo');
    }

    return accountRepository.create({
      nome: nome.trim(),
      valor,
      categoria: categoria || 'Outros',
      isFixed: isFixed ?? true,
    });
  },

  /**
   * Atualiza uma conta existente
   */
  async update(
    id: string,
    updates: Partial<Omit<Account, 'id' | 'data'>>
  ): Promise<Account | null> {
    // Validações de negócio
    if (updates.nome !== undefined && (!updates.nome || updates.nome.trim() === '')) {
      throw new Error('Nome inválido');
    }

    if (updates.valor !== undefined && (typeof updates.valor !== 'number' || updates.valor < 0)) {
      throw new Error('Valor deve ser um número não-negativo');
    }

    return accountRepository.update(id, updates);
  },

  /**
   * Deleta uma conta
   */
  async delete(id: string): Promise<boolean> {
    return accountRepository.delete(id);
  },
};
