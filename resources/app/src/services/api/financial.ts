/**
 * Service para dados gerais de finanças
 */

import type { AppData } from '../../types';
import { apiCall } from './client';

export const financialService = {
  /**
   * Carrega todos os dados financeiros
   */
  async getAllFinancialData(): Promise<AppData> {
    return apiCall<AppData>('/financas');
  },
};
