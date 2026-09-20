import Database from 'better-sqlite3';
import { logger } from '../utils/logger.js';

export interface AssistantIssue {
  id: string;
  type: 'critical' | 'warning' | 'info';
  severity: 'critical' | 'high' | 'medium' | 'low';
  title: string;
  description: string;
  relatedEntity?: string;
  relatedDocumentId?: string;
  action?: string;
}

export interface AssistantCheckitem {
  id: string;
  title: string;
  status: 'complete' | 'pending' | 'warning';
  value?: string | number;
}

export interface AssistantAnalysis {
  exerciseId: string;
  year: number;
  analyzedAt: string;
  overallStatus: 'complete' | 'in_progress' | 'needs_attention';
  completionPercentage: number;
  criticalIssues: AssistantIssue[];
  warnings: AssistantIssue[];
  missingItems: AssistantIssue[];
  inconsistencies: AssistantIssue[];
  documentsToReview: AssistantIssue[];
  suggestedActions: AssistantIssue[];
  positiveChecks: AssistantCheckitem[];
  summary: {
    documentsAnalyzed: number;
    incomeRecords: number;
    deductionRecords: number;
    assetRecords: number;
    dependentRecords: number;
    holeriteCount: number;
    incomeStatementsCount: number;
  };
}

export class AssistantService {
  constructor(private db: Database.Database) {}

  analyze(exerciseId: string, userId?: string): AssistantAnalysis {
    try {
      logger.info(`Analisando exercício ${exerciseId} com Assistente IRPF`);

      // Get exercise info
      const exerciseStmt = userId
        ? this.db.prepare('SELECT * FROM irpf_exercises WHERE id = ? AND user_id = ?')
        : this.db.prepare('SELECT * FROM irpf_exercises WHERE id = ?');
      const exercise = exerciseStmt.get(...(userId ? [exerciseId, userId] : [exerciseId])) as any;

      if (!exercise) {
        throw new Error(`Exercício ${exerciseId} não encontrado`);
      }

      const issues: AssistantIssue[] = [];
      const warnings: AssistantIssue[] = [];
      const missingItems: AssistantIssue[] = [];
      const inconsistencies: AssistantIssue[] = [];
      const documentsToReview: AssistantIssue[] = [];
      const suggestedActions: AssistantIssue[] = [];
      const positiveChecks: AssistantCheckitem[] = [];

      // 1. ANALYZE DOCUMENTS
      const docAnalysis = this.analyzeDocuments(exerciseId);
      issues.push(...docAnalysis.issues);
      warnings.push(...docAnalysis.warnings);
      documentsToReview.push(...docAnalysis.documentsToReview);
      positiveChecks.push(...docAnalysis.positiveChecks);

      // 2. ANALYZE HOLERITES AND INCOME
      const holeriteAnalysis = this.analyzeHolerites(exerciseId);
      issues.push(...holeriteAnalysis.issues);
      warnings.push(...holeriteAnalysis.warnings);
      inconsistencies.push(...holeriteAnalysis.inconsistencies);
      missingItems.push(...holeriteAnalysis.missingItems);
      suggestedActions.push(...holeriteAnalysis.suggestedActions);
      positiveChecks.push(...holeriteAnalysis.positiveChecks);

      // 3. ANALYZE DEDUCTIONS
      const deductionAnalysis = this.analyzeDeductions(exerciseId);
      issues.push(...deductionAnalysis.issues);
      warnings.push(...deductionAnalysis.warnings);
      missingItems.push(...deductionAnalysis.missingItems);
      positiveChecks.push(...deductionAnalysis.positiveChecks);

      // 4. ANALYZE ASSETS
      const assetAnalysis = this.analyzeAssets(exerciseId);
      issues.push(...assetAnalysis.issues);
      warnings.push(...assetAnalysis.warnings);
      missingItems.push(...assetAnalysis.missingItems);

      // 5. ANALYZE DEPENDENTS
      const dependentAnalysis = this.analyzeDependents(exerciseId);
      issues.push(...dependentAnalysis.issues);
      warnings.push(...dependentAnalysis.warnings);

      // 6. ANALYZE CONSISTENCY
      const consistencyAnalysis = this.analyzeConsistency(exerciseId);
      inconsistencies.push(...consistencyAnalysis.issues);
      suggestedActions.push(...consistencyAnalysis.suggestedActions);

      // 7. GET SUMMARY STATS
      const summary = this.getSummaryStats(exerciseId);

      // Calculate overall status and completion percentage
      const { overallStatus, completionPercentage } = this.calculateOverallStatus(
        exercise,
        issues,
        warnings,
        summary
      );

      return {
        exerciseId,
        year: exercise.year,
        analyzedAt: new Date().toISOString(),
        overallStatus,
        completionPercentage,
        criticalIssues: issues.filter(i => i.severity === 'critical'),
        warnings: warnings.filter(w => w.severity === 'high' || w.severity === 'medium'),
        missingItems,
        inconsistencies,
        documentsToReview,
        suggestedActions,
        positiveChecks,
        summary,
      };
    } catch (error) {
      logger.error(`Erro ao analisar exercício: ${error}`);
      throw error;
    }
  }

  private analyzeDocuments(
    exerciseId: string
  ): {
    issues: AssistantIssue[];
    warnings: AssistantIssue[];
    documentsToReview: AssistantIssue[];
    positiveChecks: AssistantCheckitem[];
  } {
    const issues: AssistantIssue[] = [];
    const warnings: AssistantIssue[] = [];
    const documentsToReview: AssistantIssue[] = [];
    const positiveChecks: AssistantCheckitem[] = [];

    // Get all documents
    const docsStmt = this.db.prepare(
      'SELECT * FROM irpf_documents WHERE exercise_id = ? ORDER BY created_at DESC'
    );
    const documents = docsStmt.all(exerciseId) as any[];

    if (documents.length === 0) {
      issues.push({
        id: 'no_documents',
        type: 'critical',
        severity: 'critical',
        title: 'Nenhum documento importado',
        description: 'Nenhum documento foi importado para este exercício. Comece importando holerites, informes e outros documentos.',
        action: 'Importar documentos',
      });
    } else {
      positiveChecks.push({
        id: 'documents_imported',
        title: 'Documentos importados',
        status: 'complete',
        value: documents.length,
      });

      // Check for low confidence documents
      const lowConfidence = documents.filter((d: any) => d.confidence_score < 70);
      if (lowConfidence.length > 0) {
        lowConfidence.forEach((doc: any) => {
          documentsToReview.push({
            id: `low_confidence_${doc.id}`,
            type: 'warning',
            severity: 'high',
            title: `Documento com baixa confiança na extração`,
            description: `${doc.filename} foi extraído com apenas ${doc.confidence_score}% de confiança. Recomenda-se revisar os dados extraídos.`,
            relatedDocumentId: doc.id,
            action: 'Revisar documento',
          });
        });
      }

      // Check for pending/processing documents
      const pendingDocs = documents.filter((d: any) => d.status === 'pending' || d.status === 'processing');
      if (pendingDocs.length > 0) {
        warnings.push({
          id: 'pending_documents',
          type: 'warning',
          severity: 'medium',
          title: 'Documentos ainda sendo processados',
          description: `${pendingDocs.length} documento(s) ainda não foram totalmente processados. Aguarde a conclusão ou verifique se houve erro no processamento.`,
          action: 'Revisar status dos documentos',
        });
      }

      // Check for documents with errors
      const errorDocs = documents.filter((d: any) => d.status === 'error');
      if (errorDocs.length > 0) {
        issues.push({
          id: 'error_documents',
          type: 'critical',
          severity: 'high',
          title: 'Erro no processamento de documentos',
          description: `${errorDocs.length} documento(s) não puderam ser processados. Tente fazer upload novamente ou escolha outro arquivo.`,
          action: 'Reimportar documentos',
        });
      }

      // Check for duplicates
      const duplicates = this.checkDocumentDuplicates(documents);
      if (duplicates.length > 0) {
        duplicates.forEach((dup: any) => {
          warnings.push({
            id: `duplicate_${dup.doc1}_${dup.doc2}`,
            type: 'warning',
            severity: 'medium',
            title: 'Possível documento duplicado detectado',
            description: `${dup.doc1Name} e ${dup.doc2Name} podem ser cópias do mesmo documento (competência: ${dup.competencia}).`,
            action: 'Verificar duplicidade',
          });
        });
      }
    }

    return { issues, warnings, documentsToReview, positiveChecks };
  }

  private analyzeHolerites(
    exerciseId: string
  ): {
    issues: AssistantIssue[];
    warnings: AssistantIssue[];
    inconsistencies: AssistantIssue[];
    missingItems: AssistantIssue[];
    suggestedActions: AssistantIssue[];
    positiveChecks: AssistantCheckitem[];
  } {
    const issues: AssistantIssue[] = [];
    const warnings: AssistantIssue[] = [];
    const inconsistencies: AssistantIssue[] = [];
    const missingItems: AssistantIssue[] = [];
    const suggestedActions: AssistantIssue[] = [];
    const positiveChecks: AssistantCheckitem[] = [];

    // Get all holerites (documents of type 'holerite')
    const holeriteStmt = this.db.prepare(
      "SELECT * FROM irpf_documents WHERE exercise_id = ? AND document_type = 'holerite' ORDER BY created_at DESC"
    );
    const holerites = holeriteStmt.all(exerciseId) as any[];

    if (holerites.length === 0) {
      missingItems.push({
        id: 'no_holerites',
        type: 'info',
        severity: 'medium',
        title: 'Nenhum holerite importado',
        description: 'Nenhum holerite foi encontrado neste exercício. Para declarar rendimentos, é necessário importar pelo menos um holerite.',
        action: 'Importar holerites',
      });
      return { issues, warnings, inconsistencies, missingItems, suggestedActions, positiveChecks };
    }

    positiveChecks.push({
      id: 'holerites_exist',
      title: 'Holerites importados',
      status: 'complete',
      value: holerites.length,
    });

    // Analyze competencies
    const competencies: number[] = [];
    const holeritesByMonth: { [key: number]: any[] } = {};

    holerites.forEach((holerite: any) => {
      try {
        const extractedData = JSON.parse(holerite.extracted_data || '{}');
        if (extractedData.competencia) {
          const monthMatch = extractedData.competencia.match(/(\d{2})\/(\d{4})/);
          if (monthMatch) {
            const month = parseInt(monthMatch[1]);
            const year = parseInt(monthMatch[2]);
            if (!holeritesByMonth[month]) holeritesByMonth[month] = [];
            holeritesByMonth[month].push({ ...extractedData, documentId: holerite.id });
            if (!competencies.includes(month)) competencies.push(month);
          }
        }
      } catch (e) {
        logger.error(`Erro ao parsear holerite ${holerite.id}: ${e}`);
      }
    });

    competencies.sort((a, b) => a - b);

    // Check for missing months
    const missingMonths = [];
    for (let month = 1; month <= 12; month++) {
      if (!competencies.includes(month)) {
        missingMonths.push(month);
      }
    }

    if (missingMonths.length > 0) {
      missingItems.push({
        id: 'missing_months',
        type: 'warning',
        severity: 'medium',
        title: `Holerites faltando para ${missingMonths.length} mês(es)`,
        description: `Faltam holerites para: ${missingMonths.map(m => this.monthName(m)).join(', ')}. Estes meses não serão computados na declaração.`,
        action: 'Importar holerites faltantes',
      });
    }

    // Check for duplicate competencies
    const competencyCount: { [key: number]: number } = {};
    holerites.forEach((h: any) => {
      try {
        const extractedData = JSON.parse(h.extracted_data || '{}');
        if (extractedData.competencia) {
          const monthMatch = extractedData.competencia.match(/(\d{2})/);
          if (monthMatch) {
            const month = parseInt(monthMatch[1]);
            competencyCount[month] = (competencyCount[month] || 0) + 1;
          }
        }
      } catch (e) {}
    });

    Object.entries(competencyCount).forEach(([month, count]) => {
      if (count > 1) {
        warnings.push({
          id: `duplicate_month_${month}`,
          type: 'warning',
          severity: 'high',
          title: `Múltiplos holerites para ${this.monthName(parseInt(month))}`,
          description: `Foram encontrados ${count} holerites para o mês de ${this.monthName(parseInt(month))}. Verifique se não são duplicatas.`,
          action: 'Revisar documentos',
        });
      }
    });

    // Analyze salary consistency
    const salaries: { month: number; salary: number }[] = [];
    holerites.forEach((h: any) => {
      try {
        const extractedData = JSON.parse(h.extracted_data || '{}');
        if (extractedData.competencia && extractedData.salario_bruto) {
          const monthMatch = extractedData.competencia.match(/(\d{2})/);
          if (monthMatch) {
            salaries.push({
              month: parseInt(monthMatch[1]),
              salary: extractedData.salario_bruto,
            });
          }
        }
      } catch (e) {}
    });

    if (salaries.length > 1) {
      const avgSalary = salaries.reduce((s, v) => s + v.salary, 0) / salaries.length;
      const variance = Math.max(...salaries.map(s => Math.abs(s.salary - avgSalary)));
      const variancePercent = (variance / avgSalary) * 100;

      if (variancePercent > 15) {
        inconsistencies.push({
          id: 'salary_variance',
          type: 'warning',
          severity: 'high',
          title: 'Variação significativa no salário bruto',
          description: `Houve variação de ${variancePercent.toFixed(1)}% no salário bruto entre os holerites. Recomenda-se revisar se as alterações estão corretas.`,
          action: 'Revisar salários',
        });
      }
    }

    return { issues, warnings, inconsistencies, missingItems, suggestedActions, positiveChecks };
  }

  private analyzeDeductions(
    exerciseId: string
  ): {
    issues: AssistantIssue[];
    warnings: AssistantIssue[];
    missingItems: AssistantIssue[];
    positiveChecks: AssistantCheckitem[];
  } {
    const issues: AssistantIssue[] = [];
    const warnings: AssistantIssue[] = [];
    const missingItems: AssistantIssue[] = [];
    const positiveChecks: AssistantCheckitem[] = [];

    const deductionsStmt = this.db.prepare(
      'SELECT * FROM irpf_deductions WHERE exercise_id = ? ORDER BY created_at DESC'
    );
    const deductions = deductionsStmt.all(exerciseId) as any[];

    if (deductions.length > 0) {
      positiveChecks.push({
        id: 'deductions_exist',
        title: 'Deduções cadastradas',
        status: 'complete',
        value: deductions.length,
      });

      // Check for incomplete deductions
      const incompleteDeductions = deductions.filter(
        (d: any) => !d.amount || !d.category || !d.date
      );

      if (incompleteDeductions.length > 0) {
        warnings.push({
          id: 'incomplete_deductions',
          type: 'warning',
          severity: 'medium',
          title: `${incompleteDeductions.length} dedução(ões) com dados incompletos`,
          description: 'Algumas deduções não possuem todos os dados necessários (valor, categoria, data). Revise antes de confirmar a declaração.',
          action: 'Completar deduções',
        });
      }
    }

    return { issues, warnings, missingItems, positiveChecks };
  }

  private analyzeAssets(
    exerciseId: string
  ): {
    issues: AssistantIssue[];
    warnings: AssistantIssue[];
    missingItems: AssistantIssue[];
  } {
    const issues: AssistantIssue[] = [];
    const warnings: AssistantIssue[] = [];
    const missingItems: AssistantIssue[] = [];

    const assetsStmt = this.db.prepare(
      'SELECT * FROM irpf_assets WHERE exercise_id = ? ORDER BY created_at DESC'
    );
    const assets = assetsStmt.all(exerciseId) as any[];

    if (assets.length > 0) {
      // Check for assets missing values or dates
      const incompleteAssets = assets.filter((a: any) => !a.value || !a.description);
      if (incompleteAssets.length > 0) {
        warnings.push({
          id: 'incomplete_assets',
          type: 'warning',
          severity: 'medium',
          title: `${incompleteAssets.length} bem(ns) com dados incompletos`,
          description: 'Alguns bens não possuem descrição ou valor. Revise as informações.',
          action: 'Completar bens',
        });
      }
    }

    return { issues, warnings, missingItems };
  }

  private analyzeDependents(
    exerciseId: string
  ): {
    issues: AssistantIssue[];
    warnings: AssistantIssue[];
  } {
    const issues: AssistantIssue[] = [];
    const warnings: AssistantIssue[] = [];

    const dependentsStmt = this.db.prepare(
      'SELECT * FROM irpf_dependents WHERE exercise_id = ? ORDER BY created_at DESC'
    );
    const dependents = dependentsStmt.all(exerciseId) as any[];

    if (dependents.length > 0) {
      // Check for incomplete dependents
      const incompleteDependents = dependents.filter((d: any) => !d.name || !d.cpf);
      if (incompleteDependents.length > 0) {
        warnings.push({
          id: 'incomplete_dependents',
          type: 'warning',
          severity: 'medium',
          title: `${incompleteDependents.length} dependente(s) com dados incompletos`,
          description: 'Alguns dependentes não possuem nome ou CPF. Revise as informações.',
          action: 'Completar dados de dependentes',
        });
      }
    }

    return { issues, warnings };
  }

  private analyzeConsistency(
    exerciseId: string
  ): {
    issues: AssistantIssue[];
    suggestedActions: AssistantIssue[];
  } {
    const issues: AssistantIssue[] = [];
    const suggestedActions: AssistantIssue[] = [];

    // Check for income statement vs holerites comparison
    const incomeStmtStmt = this.db.prepare(
      "SELECT * FROM irpf_documents WHERE exercise_id = ? AND document_type = 'income_statement'"
    );
    const incomeStatements = incomeStmtStmt.all(exerciseId) as any[];

    const holeriteStmt = this.db.prepare(
      "SELECT * FROM irpf_documents WHERE exercise_id = ? AND document_type = 'holerite'"
    );
    const holerites = holeriteStmt.all(exerciseId) as any[];

    if (incomeStatements.length > 0 && holerites.length > 0) {
      suggestedActions.push({
        id: 'compare_income_statement_holerites',
        type: 'info',
        severity: 'low',
        title: 'Comparar Informe de Rendimentos com Holerites',
        description: 'Foram encontrados tanto holerites quanto informes de rendimentos. Recomenda-se comparar os valores para garantir consistência.',
        action: 'Comparar documentos',
      });
    }

    return { issues, suggestedActions };
  }

  private checkDocumentDuplicates(documents: any[]): any[] {
    const duplicates: any[] = [];
    const seen: { [key: string]: any } = {};

    documents.forEach((doc: any) => {
      try {
        const extractedData = JSON.parse(doc.extracted_data || '{}');
        const competencia = extractedData.competencia || extractedData.date;
        const key = `${doc.document_type}_${competencia}`;

        if (seen[key]) {
          duplicates.push({
            doc1: seen[key].id,
            doc1Name: seen[key].filename,
            doc2: doc.id,
            doc2Name: doc.filename,
            competencia,
          });
        } else {
          seen[key] = doc;
        }
      } catch (e) {}
    });

    return duplicates;
  }

  private getSummaryStats(exerciseId: string) {
    const docsStmt = this.db.prepare(
      'SELECT COUNT(*) as count FROM irpf_documents WHERE exercise_id = ?'
    );
    const incomeStmt = this.db.prepare(
      'SELECT COUNT(*) as count FROM irpf_income WHERE exercise_id = ?'
    );
    const deductionStmt = this.db.prepare(
      'SELECT COUNT(*) as count FROM irpf_deductions WHERE exercise_id = ?'
    );
    const assetStmt = this.db.prepare(
      'SELECT COUNT(*) as count FROM irpf_assets WHERE exercise_id = ?'
    );
    const dependentStmt = this.db.prepare(
      'SELECT COUNT(*) as count FROM irpf_dependents WHERE exercise_id = ?'
    );
    const holeriteStmt = this.db.prepare(
      "SELECT COUNT(*) as count FROM irpf_documents WHERE exercise_id = ? AND document_type = 'holerite'"
    );
    const incomeStmtCountStmt = this.db.prepare(
      "SELECT COUNT(*) as count FROM irpf_documents WHERE exercise_id = ? AND document_type = 'income_statement'"
    );

    return {
      documentsAnalyzed: (docsStmt.get(exerciseId) as any).count || 0,
      incomeRecords: (incomeStmt.get(exerciseId) as any).count || 0,
      deductionRecords: (deductionStmt.get(exerciseId) as any).count || 0,
      assetRecords: (assetStmt.get(exerciseId) as any).count || 0,
      dependentRecords: (dependentStmt.get(exerciseId) as any).count || 0,
      holeriteCount: (holeriteStmt.get(exerciseId) as any).count || 0,
      incomeStatementsCount: (incomeStmtCountStmt.get(exerciseId) as any).count || 0,
    };
  }

  private calculateOverallStatus(
    exercise: any,
    issues: AssistantIssue[],
    warnings: AssistantIssue[],
    summary: any
  ): { overallStatus: 'complete' | 'in_progress' | 'needs_attention'; completionPercentage: number } {
    const criticalCount = issues.filter(i => i.severity === 'critical').length;

    if (criticalCount > 0) {
      return { overallStatus: 'needs_attention', completionPercentage: 30 };
    }

    const hasDocuments = summary.documentsAnalyzed > 0;
    const hasIncome = summary.incomeRecords > 0;
    const hasMonthsCovered = summary.holeriteCount >= 6;

    let completion = 0;
    if (hasDocuments) completion += 25;
    if (hasIncome) completion += 25;
    if (hasMonthsCovered) completion += 25;
    if (warnings.length === 0) completion += 25;

    const status = completion >= 75 ? 'complete' : 'in_progress';

    return { overallStatus: status, completionPercentage: Math.min(completion, 100) };
  }

  private monthName(month: number): string {
    const months = [
      'Janeiro',
      'Fevereiro',
      'Março',
      'Abril',
      'Maio',
      'Junho',
      'Julho',
      'Agosto',
      'Setembro',
      'Outubro',
      'Novembro',
      'Dezembro',
    ];
    return months[month - 1] || '';
  }
}
