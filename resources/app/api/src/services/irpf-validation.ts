/**
 * IRPF Validation Service
 * Cross-checks and conferences between documents, holerites, informes, incomes, deductions, assets and dependents
 */

import { irpfService } from './irpf.service.js';
import { checkDuplicatesInBatch } from './duplicate-detector.js';
import { logger } from '../utils/logger.js';
import { validationsRepository, correctionsRepository } from '../repositories/irpf.repository.js';
import * as crypto from 'crypto';

export class IRPFValidationService {
  constructor() {}

  async validateExercise(exerciseId: string, userId?: string) {
    logger.info(`Iniciando validação fiscal para exercício ${exerciseId}`);

    // Load data via service layer (uses repositories internally)
    const documents = await irpfService.getDocuments(exerciseId, userId);
    const incomes = await irpfService.getIncomes(exerciseId, userId);
    const deductions = await irpfService.getDeductions(exerciseId, userId);
    const assets = await irpfService.getAssets(exerciseId, userId);
    const dependents = await irpfService.getDependents(exerciseId, userId);

    // --- Document checks ---
    const documentChecks = [] as any[];
    const holeriteDocs = documents.filter((d: any) => d.document_type === 'holerite');
    const informeDocs = documents.filter((d: any) => d.document_type === 'informe' || d.document_type === 'income_statement');

    // Duplicate detection using existing service (batch)
    try {
      const newDocs = holeriteDocs.map((d: any) => {
        const parsed = safeParse(d.extracted_data);
        return { id: d.id, holeriteData: parsed?.holeriteData || {}, contentHash: d.file_hash || '' };
      });
      const existingDocs = documents.map((d: any) => ({ id: d.id, holeriteData: safeParse(d.extracted_data)?.holeriteData || {}, contentHash: d.file_hash || '' }));
      const dupMap = checkDuplicatesInBatch(newDocs, existingDocs);
      for (const [docId, res] of dupMap.entries()) {
        if (res.isDuplicate) {
          const entry = { id: `dup_${docId}`, type: 'duplicate', severity: 'warning', title: 'Documento possivelmente duplicado', description: res.reason, related: res.matchDocumentIds, confidence: res.confidence };
          documentChecks.push(entry);
          // persist as validation
          try {
            const key = deterministicKey('duplicate', docId, res.matchDocumentIds.join(','));
            validationsRepository.upsert(exerciseId, key, { type: 'duplicate', severity: 'warning', title: entry.title, description: entry.description, status: 'PENDING', source_document_id: docId, related_document_id: res.matchDocumentIds.join(',') });
          } catch (err) {
            logger.error('Erro ao persistir validation duplicate', err);
          }
        }
      }
    } catch (err) {
      logger.error('Erro ao executar duplicate detector', err);
    }

    // Low confidence and missing identification
    for (const d of documents) {
      if (d.confidence_score && d.confidence_score < 70) {
        documentChecks.push({ id: `lowconf_${d.id}`, type: 'low_confidence', severity: 'high', title: 'Documento com baixa confiança', description: `${d.filename} foi extraído com ${d.confidence_score}% de confiança.`, relatedDocumentId: d.id });
      }

      try {
        const parsed = safeParse(d.extracted_data);
        if (!parsed || Object.keys(parsed).length === 0) {
          documentChecks.push({ id: `noid_${d.id}`, type: 'no_identification', severity: 'medium', title: 'Documento sem identificação suficiente', description: `${d.filename} não contém campos identificáveis.` , relatedDocumentId: d.id });
        }
      } catch {}
    }

    // --- Holerite x Informe conferences ---
    const conferences: any[] = [];

    for (const h of holeriteDocs) {
      const hParsed = safeParse(h.extracted_data) || {};
      const hData = hParsed.holeriteData || {};

      // try to find matching informe by cnpj or company name
      const match = informeDocs.find((inf: any) => {
        const p = safeParse(inf.extracted_data) || {};
        const iData = p.informeData || p; // may vary
        if (!iData) return false;
        if (hData.cnpj && iData.cnpj && iData.cnpj === hData.cnpj) return true;
        if (hData.empresa && iData.fonte_pagadora && iData.fonte_pagadora === hData.empresa) return true;
        return false;
      });

      if (!match) {
        conferences.push({ field: 'document', sourceA: 'holerite', sourceB: 'informe', status: 'MISSING_SOURCE_B', sourceAId: h.id, sourceBId: null, valueA: hData, valueB: null, difference: null, confidence: h.confidence_score || 0 });
        continue;
      }

      const iParsed = safeParse(match.extracted_data) || {};
      const iData = iParsed.informeData || iParsed;

      // compare relevant numeric fields
      const fieldsToCompare = ['nome', 'cpf', 'cnpj', 'empresa', 'rendimentos_tributaveis', 'irrf', 'decimo_terceiro'];
      for (const f of fieldsToCompare) {
        const a = (hData as any)[f] ?? null;
        const b = (iData as any)[f] ?? null;
        let status = 'MATCH';
        let diff = null;
        if (a == null && b == null) {
          status = 'MISSING_SOURCE_A';
        } else if (a == null && b != null) {
          status = 'MISSING_SOURCE_A';
        } else if (a != null && b == null) {
          status = 'MISSING_SOURCE_B';
        } else if (isNumberLike(a) && isNumberLike(b)) {
          const na = Number(a);
          const nb = Number(b);
          diff = Math.abs(na - nb);
          if (diff > Math.max(1, Math.abs(na) * 0.01)) {
            status = 'DIFFERENCE';
          }
        } else if (String(a).trim() !== String(b).trim()) {
          status = 'DIFFERENCE';
        }

        const confEntry = { field: f, sourceA: 'holerite', sourceB: 'informe', valueA: a, valueB: b, difference: diff, status, confidence: Math.max(h.confidence_score || 0, match.confidence_score || 0), sourceAId: h.id, sourceBId: match.id };
        conferences.push(confEntry);
        // persist as validation
        try {
          const key = deterministicKey('conference', h.id, match.id, f);
          validationsRepository.upsert(exerciseId, key, { type: 'conference', severity: status === 'DIFFERENCE' ? 'high' : 'low', title: `Divergência: ${f}`, description: `Comparação entre holerite e informe para campo ${f}`, status: status === 'MATCH' ? 'RESOLVED' : 'PENDING', source_document_id: h.id, related_document_id: match.id });
        } catch (err) {
          logger.error('Erro ao persistir validation conference', err);
        }
      }
    }

    // --- Monthly view ---
    const months = [] as any[];
    const monthStats = { total_bruto: 0, total_inss: 0, total_irrf: 0, total_other_discounts: 0, months_found: 0 };
    for (let m = 1; m <= 12; m++) {
      const incomesForMonth = incomes.filter((inc: any) => inc.month === m && ((inc.source && String(inc.source).toLowerCase().includes('holerite')) || inc.source === 'extracted_holerite'));
      const found = incomesForMonth.length > 0;
      const duplicated = incomesForMonth.length > 1;
      const lowConfidence = incomesForMonth.some((inc: any) => inc.confidence_score && inc.confidence_score < 70);
      const reviewed = incomesForMonth.some((inc: any) => inc.is_verified);
      const confirmed = incomesForMonth.some((inc: any) => inc.is_verified);
      const bruto = incomesForMonth.reduce((s: number, i: any) => s + (i.amount || 0), 0);
      monthStats.total_bruto += bruto;
      if (found) monthStats.months_found++;

      months.push({ month: m, found, duplicated, lowConfidence, reviewed, confirmed, bruto, items: incomesForMonth.map((i: any) => ({ id: i.id, amount: i.amount, confidence: i.confidence_score })) });
    }
    const monthlyAvg = monthStats.months_found > 0 ? monthStats.total_bruto / monthStats.months_found : 0;

    // --- Financial comparison ---
    let financialComparison = null;
    try {
      // Find a registered salary in incomes table (income_type === 'salary' or description contains 'Salário')
      const registered = incomes.find((i: any) => i.income_type === 'salary' || (i.description && String(i.description).toLowerCase().includes('salário')));
      if (registered) {
        financialComparison = {
          registeredSalary: registered.amount,
          averageHolerite: monthlyAvg,
          difference: Math.abs((registered.amount || 0) - monthlyAvg),
          message: registered.amount !== monthlyAvg ? 'Foi encontrada diferença entre o salário cadastrado no financeiro e os documentos importados.' : null,
        };
      }
    } catch (err) {
      logger.error('Erro ao comparar financeiro', err);
    }

    // --- Anomalies ---
    const anomalies: any[] = [];
    // simple heuristic: if any month amount differs >50% from monthlyAvg
    for (const m of months) {
      if (monthlyAvg > 0 && Math.abs(m.bruto - monthlyAvg) / Math.max(1, monthlyAvg) > 0.5) {
        anomalies.push({ id: `anom_${m.month}`, month: m.month, description: 'Valor fora do padrão histórico encontrado. Recomenda-se revisar.', value: m.bruto });
      }
    }

    // --- Field confidence summary & traceability ---
    const fieldConfidence: any = {};
    const traceability: any[] = [];
    for (const d of documents) {
      const parsed = safeParse(d.extracted_data) || {};
      const fields = parsed.fields || [];
      for (const f of fields) {
        const name = f.name || f.field || null;
        if (!name) continue;
        fieldConfidence[name] = Math.max(fieldConfidence[name] || 0, f.confidence || 0);
        traceability.push({ documentId: d.id, filename: d.filename, type: d.document_type, field: name, value: f.value, confidence: f.confidence || d.confidence_score || 0, extractedAt: parsed.processedAt || parsed.processed_at || d.created_at });
      }
    }

    // Prepare summary counts
    const summary = {
      conferencesPerformed: conferences.length,
      conferencesOk: conferences.filter((c) => c.status === 'MATCH').length,
      conferencesDifferences: conferences.filter((c) => c.status === 'DIFFERENCE').length,
      itemsForReview: documentChecks.length + anomalies.length,
      lowConfidenceDocuments: documents.filter((d) => d.confidence_score && d.confidence_score < 70).length,
      documentsMissing: documents.length === 0 ? 1 : 0,
      anomalies: anomalies.length,
    };

    return {
      conferences,
      documentChecks,
      monthlyView: { months, stats: { ...monthStats, monthlyAvg } },
      financialComparison,
      anomalies,
      fieldConfidence,
      traceability,
      summary,
    };
  }
}

function safeParse(v: any) {
  try {
    if (!v) return null;
    if (typeof v === 'string') return JSON.parse(v);
    return v;
  } catch (err) {
    return null;
  }
}

function isNumberLike(v: any) {
  if (v == null) return false;
  return !isNaN(Number(String(v).replace(/[^0-9\-.,]/g, '').replace(',', '.')));
}

function deterministicKey(...parts: Array<any>) {
  const key = parts.map((p) => String(p || '')).join('|');
  return crypto.createHash('sha1').update(key).digest('hex');
}
