/**
 * Serviço de Inteligência Fiscal
 * Verifica inconsistências, documentos faltantes, duplicatas, etc
 */

import { getDatabase } from '../database/db.js';
import { logger } from '../utils/logger.js';

export interface TaxAlert {
  id: string;
  exercise_id: string;
  alert_type: string;
  severity: 'info' | 'warning' | 'error' | 'critical';
  message: string;
  related_id?: string;
  is_resolved: boolean;
}

export const taxIntelligenceService = {
  /**
   * Gerar alertas para um exercício fiscal
   */
  async generateAlerts(exerciseId: string, userId?: string): Promise<void> {
    try {
      const db = getDatabase();
      const exercise = userId
        ? db.prepare('SELECT * FROM irpf_exercises WHERE id = ? AND user_id = ?').get(exerciseId, userId) as any
        : db.prepare('SELECT * FROM irpf_exercises WHERE id = ?').get(exerciseId) as any;

      if (!exercise) return;

      // Limpar alertas antigos
      db.prepare('DELETE FROM irpf_alerts WHERE exercise_id = ?').run(exerciseId);

      // Verificar documentos sem revisão
      const unreviedDocs = db
        .prepare('SELECT COUNT(*) as count FROM irpf_documents WHERE exercise_id = ? AND is_verified = 0')
        .get(exerciseId) as any;

      if (unreviedDocs.count > 0) {
        this.createAlert(
          exerciseId,
          'documents_pending_review',
          'warning',
          `${unreviedDocs.count} documento(s) aguardando revisão`
        );
      }

      // Verificar rendimentos sem verificação
      const unverifiedIncome = db
        .prepare('SELECT COUNT(*) as count FROM irpf_income WHERE exercise_id = ? AND is_verified = 0')
        .get(exerciseId) as any;

      if (unverifiedIncome.count > 0) {
        this.createAlert(
          exerciseId,
          'income_pending_review',
          'warning',
          `${unverifiedIncome.count} rendimento(s) aguardando revisão`
        );
      }

      // Verificar documentos com confiança baixa
      const lowConfidenceDocs = db
        .prepare(
          'SELECT COUNT(*) as count FROM irpf_documents WHERE exercise_id = ? AND confidence_score < 70'
        )
        .get(exerciseId) as any;

      if (lowConfidenceDocs.count > 0) {
        this.createAlert(
          exerciseId,
          'low_confidence_documents',
          'warning',
          `${lowConfidenceDocs.count} documento(s) com confiança baixa (< 70%)`
        );
      }

      // Verificar documentos duplicados (mesmo nome, mesmo mês)
      const duplicateDocs = db
        .prepare(`
          SELECT filename, COUNT(*) as count 
          FROM irpf_documents 
          WHERE exercise_id = ? 
          GROUP BY filename 
          HAVING count > 1
        `)
        .all(exerciseId) as any[];

      for (const dup of duplicateDocs) {
        this.createAlert(
          exerciseId,
          'duplicate_documents',
          'error',
          `Documento "${dup.filename}" foi importado ${dup.count} vezes`
        );
      }

      // Verificar rendimentos sem documento de suporte
      const incomeWithoutDoc = db
        .prepare(
          `SELECT COUNT(*) as count FROM irpf_income 
           WHERE exercise_id = ? AND document_id IS NULL AND confidence_score < 100`
        )
        .get(exerciseId) as any;

      if (incomeWithoutDoc.count > 0) {
        this.createAlert(
          exerciseId,
          'income_without_document',
          'warning',
          `${incomeWithoutDoc.count} rendimento(s) sem documento de suporte`
        );
      }

      // Verificar dependentes sem CPF
      const dependentsNoCPF = db
        .prepare('SELECT COUNT(*) as count FROM irpf_dependents WHERE exercise_id = ? AND cpf IS NULL')
        .get(exerciseId) as any;

      if (dependentsNoCPF.count > 0) {
        this.createAlert(
          exerciseId,
          'dependents_missing_cpf',
          'warning',
          `${dependentsNoCPF.count} dependente(s) sem CPF informado`
        );
      }

      // Verificar bens sem descrição
      const assetsNoDescription = db
        .prepare(
          'SELECT COUNT(*) as count FROM irpf_assets WHERE exercise_id = ? AND (description IS NULL OR description = "")'
        )
        .get(exerciseId) as any;

      if (assetsNoDescription.count > 0) {
        this.createAlert(
          exerciseId,
          'assets_missing_description',
          'info',
          `${assetsNoDescription.count} bem(ns) sem descrição completa`
        );
      }

      // Verificar holerites faltantes (múltiplos meses de trabalho)
      const incomeDocs = db
        .prepare(
          `SELECT COUNT(DISTINCT CAST(json_extract(extracted_data, '$.competencia') as TEXT)) as months 
           FROM irpf_documents 
           WHERE exercise_id = ? AND document_type = 'holerite'`
        )
        .get(exerciseId) as any;

      if (incomeDocs.months > 0 && incomeDocs.months < 12) {
        this.createAlert(
          exerciseId,
          'partial_holerites',
          'warning',
          `Apenas ${incomeDocs.months} mês(es) de holerite importado(s). Verifique se há meses faltantes.`
        );
      }

      // Verificar dados inconsistentes (rendimento > salário)
      const inconsistentData = db
        .prepare(
          `SELECT COUNT(*) as count 
           FROM irpf_income 
           WHERE exercise_id = ? AND amount > (
             SELECT COALESCE(SUM(amount), 0) * 1.5 FROM irpf_income WHERE exercise_id = ?
           )`
        )
        .all(exerciseId, exerciseId) as any;

      if (inconsistentData[0]?.count > 0) {
        this.createAlert(
          exerciseId,
          'inconsistent_values',
          'warning',
          'Foram detectados valores inconsistentes. Verifique rendimentos.'
        );
      }

      logger.info(`✅ Alertas gerados para exercício ${exerciseId}`);
    } catch (error) {
      logger.error('Erro ao gerar alertas fiscais:', error);
      throw error;
    }
  },

  /**
   * Criar alerta
   */
  createAlert(
    exerciseId: string,
    alertType: string,
    severity: 'info' | 'warning' | 'error' | 'critical',
    message: string,
    relatedId?: string
  ): string {
    const db = getDatabase();
    const id = `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    db.prepare(
      `INSERT INTO irpf_alerts (id, exercise_id, alert_type, severity, message, related_id, is_resolved, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, 0, datetime('now'), datetime('now'))`
    ).run(id, exerciseId, alertType, severity, message, relatedId || null);

    return id;
  },

  /**
   * Obter alertas de um exercício (scoped when userId provided)
   */

  /**
   * Obter alertas não resolvidos
   */
  getPendingAlerts(exerciseId: string, userId?: string): TaxAlert[] {
    const db = getDatabase();
    if (userId) {
      const stmt = db.prepare('SELECT a.* FROM irpf_alerts a JOIN irpf_exercises e ON a.exercise_id = e.id WHERE a.exercise_id = ? AND e.user_id = ? AND a.is_resolved = 0 ORDER BY a.severity DESC, a.created_at DESC');
      return stmt.all(exerciseId, userId) as TaxAlert[];
    }
    return db
      .prepare(
        'SELECT * FROM irpf_alerts WHERE exercise_id = ? AND is_resolved = 0 ORDER BY severity DESC, created_at DESC'
      )
      .all(exerciseId) as TaxAlert[];
  },

  getAlerts(exerciseId: string, userId?: string): TaxAlert[] {
    const db = getDatabase();
    if (userId) {
      const stmt = db.prepare('SELECT a.* FROM irpf_alerts a JOIN irpf_exercises e ON a.exercise_id = e.id WHERE a.exercise_id = ? AND e.user_id = ? ORDER BY a.severity DESC, a.created_at DESC');
      return stmt.all(exerciseId, userId) as TaxAlert[];
    }
    return db
      .prepare('SELECT * FROM irpf_alerts WHERE exercise_id = ? ORDER BY severity DESC, created_at DESC')
      .all(exerciseId) as TaxAlert[];
  },

  /**
   * Resolver alerta
   */
  resolveAlert(alertId: string): void {
    const db = getDatabase();
    db.prepare('UPDATE irpf_alerts SET is_resolved = 1, updated_at = datetime("now") WHERE id = ?').run(
      alertId
    );
  },
};
