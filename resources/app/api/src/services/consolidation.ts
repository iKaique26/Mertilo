/**
 * Consolidation Service
 * Consolidates multiple payslips into annual summaries
 */

import { HoleriteData } from './holerite-reader.js';
import { logger } from '../utils/logger.js';

export interface ConsolidatedHolerite {
  year: number;
  exercise_id: string;
  total_months: number;
  months_worked: number;
  months_missing: number[];
  
  // Totals
  total_salario_bruto: number;
  total_inss: number;
  total_irrf: number;
  total_fgts: number;
  total_salario_liquido: number;
  
  // Extras totals
  total_horas_extras: number;
  total_bonificacao: number;
  total_comissao: number;
  total_decimo_terceiro: number;
  total_ferias: number;
  total_adicionais: number;
  
  // Average
  media_mensal_bruto: number;
  media_mensal_inss_percent: number;
  media_mensal_irrf_percent: number;
  
  // Documents
  documentos_count: number;
  documentos_ids: string[];
  
  // Metadata
  confidence: number;
  alertas: string[];
  processedAt: string;
}

export function consolidateHolerites(
  year: number,
  exerciseId: string,
  holeriteList: (HoleriteData & { document_id: string })[]
): ConsolidatedHolerite {
  const consolidated: ConsolidatedHolerite = {
    year,
    exercise_id: exerciseId,
    total_months: 12,
    months_worked: 0,
    months_missing: [],
    total_salario_bruto: 0,
    total_inss: 0,
    total_irrf: 0,
    total_fgts: 0,
    total_salario_liquido: 0,
    total_horas_extras: 0,
    total_bonificacao: 0,
    total_comissao: 0,
    total_decimo_terceiro: 0,
    total_ferias: 0,
    total_adicionais: 0,
    media_mensal_bruto: 0,
    media_mensal_inss_percent: 0,
    media_mensal_irrf_percent: 0,
    documentos_count: 0,
    documentos_ids: [],
    confidence: 0,
    alertas: [],
    processedAt: new Date().toISOString(),
  };

  if (!holeriteList || holeriteList.length === 0) {
    consolidated.alertas.push('Nenhum holerite para consolidar');
    return consolidated;
  }

  const monthsFound = new Set<number>();
  let totalConfidence = 0;

  for (const holerite of holeriteList) {
    // Extract month from competencia (MM/YYYY)
    const competenciaMatch = (holerite.competencia || '').match(/(\d{1,2})/);
    const month = competenciaMatch ? parseInt(competenciaMatch[1]) : null;

    if (month && month >= 1 && month <= 12) {
      monthsFound.add(month);
    }

    // Accumulate totals
    consolidated.total_salario_bruto += holerite.salario_bruto || 0;
    consolidated.total_inss += holerite.inss || 0;
    consolidated.total_irrf += holerite.irrf || 0;
    consolidated.total_fgts += holerite.fgts || 0;
    consolidated.total_salario_liquido += holerite.salario_liquido || 0;
    consolidated.total_horas_extras += holerite.horas_extras || 0;
    consolidated.total_bonificacao += holerite.bonificacao || 0;
    consolidated.total_comissao += holerite.comissao || 0;
    consolidated.total_decimo_terceiro += holerite.decimo_terceiro || 0;
    consolidated.total_ferias += holerite.ferias || 0;
    consolidated.total_adicionais += (holerite.adicional_noturno || 0) + (holerite.adicional_periculosidade || 0) + (holerite.adicional_insalubridade || 0);

    // Track confidence
    totalConfidence += holerite.confidence || 0;
    consolidated.documentos_ids.push(holerite.document_id);
  }

  // Calculate months
  consolidated.months_worked = monthsFound.size;
  consolidated.documentos_count = holeriteList.length;

  // Find missing months
  for (let i = 1; i <= 12; i++) {
    if (!monthsFound.has(i)) {
      consolidated.months_missing.push(i);
    }
  }

  // Calculate averages
  if (consolidated.months_worked > 0) {
    consolidated.media_mensal_bruto = consolidated.total_salario_bruto / consolidated.months_worked;
    if (consolidated.total_salario_bruto > 0) {
      consolidated.media_mensal_inss_percent = (consolidated.total_inss / consolidated.total_salario_bruto) * 100;
      consolidated.media_mensal_irrf_percent = (consolidated.total_irrf / consolidated.total_salario_bruto) * 100;
    }
  }

  // Confidence
  consolidated.confidence = Math.round(totalConfidence / holeriteList.length);

  // Alerts
  if (consolidated.months_worked < 12) {
    consolidated.alertas.push(`Apenas ${consolidated.months_worked} meses de ${consolidated.total_months} encontrados`);
  }

  if (consolidated.confidence < 70) {
    consolidated.alertas.push(`Confiança geral baixa: ${consolidated.confidence}%`);
  }

  return consolidated;
}

export function detectMissingMonths(holeriteList: HoleriteData[]): number[] {
  const monthsFound = new Set<number>();

  for (const holerite of holeriteList) {
    const competenciaMatch = (holerite.competencia || '').match(/(\d{1,2})/);
    const month = competenciaMatch ? parseInt(competenciaMatch[1]) : null;

    if (month && month >= 1 && month <= 12) {
      monthsFound.add(month);
    }
  }

  const missing: number[] = [];
  for (let i = 1; i <= 12; i++) {
    if (!monthsFound.has(i)) {
      missing.push(i);
    }
  }

  return missing;
}
