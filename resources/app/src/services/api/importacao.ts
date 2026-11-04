import { apiCall } from './client';

export const financialImportService = {
  async previewCsv(csvText: string, mapping = {}, fileName = 'importacao.csv') {
    return apiCall('/financas/importacao/preview', {
      method: 'POST',
      body: JSON.stringify({ csvText, mapping, fileName }),
    });
  },

  async confirmImport(records, fileName = 'importacao.csv') {
    return apiCall('/financas/importacao/confirm', {
      method: 'POST',
      body: JSON.stringify({ records, fileName }),
    });
  },

  async undoImport(importId: string) {
    return apiCall(`/financas/importacao/${encodeURIComponent(importId)}`, {
      method: 'DELETE',
    });
  },

  async deleteImportedTransaction(transactionId: string) {
    return apiCall(`/financas/importacao/transaction/${encodeURIComponent(transactionId)}`, {
      method: 'DELETE',
    });
  },
};
