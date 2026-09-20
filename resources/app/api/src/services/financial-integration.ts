/**
 * Serviço de Integração com Módulo Financeiro
 * Conecta dados de IRPF com histórico financeiro
 */

import { getDatabase } from '../database/db.js';
import { logger } from '../utils/logger.js';

export const financialIntegrationService = {
  /**
   * Vincular rendimento de IRPF com histórico financeiro
   * Evita duplicação
   */
  async linkIncomeToFinancial(incomeId: string, financialHistoryId: string, userId?: string): Promise<string> {
    try {
      const db = getDatabase();

      // Verificar se já existe linkage
      const existing = db
        .prepare('SELECT id FROM irpf_financial_linkage WHERE irpf_income_id = ?')
        .get(incomeId);

      if (existing) {
        return (existing as any).id;
      }

      // Obter dados do rendimento
      const income = db.prepare('SELECT * FROM irpf_income WHERE id = ?').get(incomeId) as any;
      if (!income) throw new Error('Rendimento não encontrado');

      // Verify exercise ownership if userId provided
      if (userId) {
        const owner = db.prepare('SELECT user_id FROM irpf_exercises WHERE id = ?').get(income.exercise_id) as any;
        if (!owner || owner.user_id !== userId) throw new Error('Acesso negado ao rendimento');
      }

      // Obter histórico financeiro para validação
      const financialHistory = db
        .prepare('SELECT * FROM monthly_history WHERE id = ?')
        .get(financialHistoryId) as any;

      if (!financialHistory) throw new Error('Histórico financeiro não encontrado');

      // If userId provided, ensure the financial history belongs to the same user
      if (userId) {
        if (financialHistory.user_id !== userId) throw new Error('Acesso negado ao histórico financeiro');
      }

      // Criar linkage
      const linkageId = `linkage_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      db.prepare(
        `INSERT INTO irpf_financial_linkage (id, exercise_id, irpf_income_id, financial_history_id, confirmed, created_at)
         VALUES (?, ?, ?, ?, 0, datetime('now'))`
      ).run(linkageId, income.exercise_id, incomeId, financialHistoryId);

      logger.info(`✅ Linkage criado: income ${incomeId} → financial ${financialHistoryId}`);
      return linkageId;
    } catch (error) {
      logger.error('Erro ao vincular rendimento:', error);
      throw error;
    }
  },

  /**
   * Verificar se existe rendimento duplicado no mesmo mês
   */
  checkDuplicateIncome(exerciseId: string, amount: number, month: number): boolean {
    const db = getDatabase();

    const existing = db
      .prepare(
        `SELECT COUNT(*) as count FROM irpf_income 
         WHERE exercise_id = ? AND month = ? AND ABS(amount - ?) < 0.01`
      )
      .get(exerciseId, month, amount) as any;

    return existing.count > 0;
  },

  /**
   * Verificar se documento já foi processado
   */
  isDocumentProcessed(exerciseId: string, filename: string): boolean {
    const db = getDatabase();

    const existing = db
      .prepare('SELECT COUNT(*) as count FROM irpf_documents WHERE exercise_id = ? AND filename = ?')
      .get(exerciseId, filename) as any;

    return existing.count > 0;
  },

  /**
   * Sugerir ativos baseado em histórico financeiro
   * Exemplo: se existe gasto recorrente com condomínio, sugerir imóvel
   */
  suggestAssets(exerciseId: string): any[] {
    try {
      const db = getDatabase();
      const suggestions = [];

      // Verificar se há transações de investimentos
      const investmentTransactions = db
        .prepare(
          `SELECT COUNT(*) as count FROM monthly_history WHERE id LIKE '%invest%' OR id LIKE '%corretora%'`
        )
        .get() as any;

      if (investmentTransactions.count > 0) {
        suggestions.push({
          type: 'investimentos',
          message: 'Foram encontradas movimentações de investimentos. Adicione-as em Bens e Direitos.',
          confidence: 75,
        });
      }

      // Verificar se há seguro de saúde recorrente
      const healthInsurance = db
        .prepare(
          `SELECT SUM(total_contas) as total FROM monthly_history 
           WHERE id LIKE '%saúde%' OR id LIKE '%médico%'`
        )
        .get() as any;

      if (healthInsurance.total && healthInsurance.total > 0) {
        suggestions.push({
          type: 'deducao_saude',
          message: `Dedução de saúde identificada: R$ ${healthInsurance.total.toFixed(2)}`,
          amount: healthInsurance.total,
          confidence: 80,
        });
      }

      return suggestions;
    } catch (error) {
      logger.error('Erro ao sugerir ativos:', error);
      return [];
    }
  },

  /**
   * Validar CPF (formato básico)
   */
  validateCPF(cpf: string): boolean {
    const cleaned = cpf.replace(/\D/g, '');

    // Verificar se tem 11 dígitos
    if (cleaned.length !== 11) return false;

    // Verificar se todos os dígitos são iguais
    if (/^(\d)\1{10}$/.test(cleaned)) return false;

    // Validar dígitos verificadores (cálculo básico)
    let sum = 0;
    let remainder;

    for (let i = 1; i <= 9; i++) {
      sum += parseInt(cleaned.substring(i - 1, i)) * (11 - i);
    }

    remainder = (sum * 10) % 11;
    if (remainder === 10 || remainder === 11) remainder = 0;
    if (remainder !== parseInt(cleaned.substring(9, 10))) return false;

    sum = 0;
    for (let i = 1; i <= 10; i++) {
      sum += parseInt(cleaned.substring(i - 1, i)) * (12 - i);
    }

    remainder = (sum * 10) % 11;
    if (remainder === 10 || remainder === 11) remainder = 0;
    if (remainder !== parseInt(cleaned.substring(10, 11))) return false;

    return true;
  },

  /**
   * Validar CNPJ (formato básico)
   */
  validateCNPJ(cnpj: string): boolean {
    const cleaned = cnpj.replace(/\D/g, '');

    if (cleaned.length !== 14) return false;
    if (/^(\d)\1{13}$/.test(cleaned)) return false;

    let size = cleaned.length - 2;
    let numbers = cleaned.substring(0, size);
    let digits = cleaned.substring(size);
    let sum = 0;
    let pos = size - 7;

    for (let i = size; i >= 1; i--) {
      sum += parseInt(numbers.charAt(size - i)) * pos--;
      if (pos < 2) pos = 9;
    }

    let result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
    if (result !== parseInt(digits.charAt(0))) return false;

    size = size + 1;
    numbers = cleaned.substring(0, size);
    sum = 0;
    pos = size - 7;

    for (let i = size; i >= 1; i--) {
      sum += parseInt(numbers.charAt(size - i)) * pos--;
      if (pos < 2) pos = 9;
    }

    result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
    if (result !== parseInt(digits.charAt(1))) return false;

    return true;
  },

  /**
   * Mascarar CPF para logs (segurança)
   */
  maskCPF(cpf: string): string {
    const cleaned = cpf.replace(/\D/g, '');
    return `***${cleaned.substring(9)}`;
  },

  /**
   * Mascarar CNPJ para logs (segurança)
   */
  maskCNPJ(cnpj: string): string {
    const cleaned = cnpj.replace(/\D/g, '');
    return `****${cleaned.substring(8)}`;
  },
};
