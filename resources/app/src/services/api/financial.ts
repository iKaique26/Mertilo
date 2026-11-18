/**
 * Service para dados gerais de finanças
 */

import type { Account, AppData, Category } from '../../types';
import { apiCall } from './client';

/** Payload de criação/edição de uma conta. */
export interface AccountInput {
  nome: string;
  valor: number;
  categoria: string;
  isFixed: boolean;
}

/** Payload de criação/edição de uma categoria. */
export interface CategoryInput {
  nome: string;
  cor: string;
  percentual: number;
}

export const financialService = {
  /**
   * Carrega todos os dados financeiros
   */
  async getAllFinancialData(): Promise<AppData> {
    return apiCall<AppData>('/financas');
  },

  /* ------------------------------------------------------------------ */
  /* Contas                                                              */
  /* ------------------------------------------------------------------ */

  async createAccount(input: AccountInput): Promise<Account> {
    return apiCall<Account>('/financas/contas', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  },

  async updateAccount(id: string, input: AccountInput): Promise<Account> {
    return apiCall<Account>(`/financas/contas/${encodeURIComponent(id)}`, {
      method: 'PUT',
      body: JSON.stringify(input),
    });
  },

  async deleteAccount(id: string): Promise<void> {
    await apiCall<{ message: string }>(`/financas/contas/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
  },

  /* ------------------------------------------------------------------ */
  /* Categorias                                                          */
  /* ------------------------------------------------------------------ */

  /**
   * Lista apenas as categorias persistidas na tabela `categories`.
   * `/financas` mescla categorias reais com entradas sintéticas de gasto
   * (id `imported-*`); o CRUD precisa apenas das categorias reais.
   */
  async getCategories(): Promise<Category[]> {
    return apiCall<Category[]>('/categories');
  },

  async createCategory(input: CategoryInput): Promise<Category> {
    return apiCall<Category>('/categories', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  },

  async updateCategory(id: string, input: CategoryInput): Promise<Category> {
    return apiCall<Category>(`/categories/${encodeURIComponent(id)}`, {
      method: 'PUT',
      body: JSON.stringify(input),
    });
  },

  async deleteCategory(id: string): Promise<void> {
    await apiCall<{ message: string }>(`/categories/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
  },
};
