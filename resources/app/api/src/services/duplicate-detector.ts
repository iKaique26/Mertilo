/**
 * Duplicate Detection Service
 * Identifies duplicate documents
 */

import * as crypto from 'crypto';
import { HoleriteData } from './holerite-reader.js';
import { logger } from '../utils/logger.js';

export interface DuplicateCheckResult {
  isDuplicate: boolean;
  matchType: 'content_hash' | 'competencia_cnpj' | 'competencia_cpf' | 'none';
  matchDocumentIds: string[];
  confidence: number;
  reason: string;
}

/**
 * Calculate hash of file content for duplication detection
 */
export function calculateContentHash(fileContent: string): string {
  return crypto.createHash('sha256').update(fileContent).digest('hex');
}

/**
 * Check if document is a duplicate based on multiple criteria
 */
export function checkDuplicate(
  holeriteData: HoleriteData,
  documentId: string,
  existingDocuments: Array<{ id: string; holeriteData: HoleriteData; contentHash?: string }>
): DuplicateCheckResult {
  const result: DuplicateCheckResult = {
    isDuplicate: false,
    matchType: 'none',
    matchDocumentIds: [],
    confidence: 0,
    reason: '',
  };

  // If missing critical data, can't determine duplicates
  if (!holeriteData.competencia || (!holeriteData.cpf && !holeriteData.cnpj)) {
    return result;
  }

  // Check for same competencia (month/year) + CPF or CNPJ
  for (const existing of existingDocuments) {
    if (existing.id === documentId) continue;

    // Competencia + CPF match
    if (holeriteData.competencia === existing.holeriteData.competencia && holeriteData.cpf && holeriteData.cpf === existing.holeriteData.cpf) {
      result.isDuplicate = true;
      result.matchType = 'competencia_cpf';
      result.matchDocumentIds.push(existing.id);
      result.confidence = 95;
      result.reason = `Mesmo mês de competência e CPF já registrado`;
      return result;
    }

    // Competencia + CNPJ match
    if (holeriteData.competencia === existing.holeriteData.competencia && holeriteData.cnpj && holeriteData.cnpj === existing.holeriteData.cnpj) {
      result.isDuplicate = true;
      result.matchType = 'competencia_cnpj';
      result.matchDocumentIds.push(existing.id);
      result.confidence = 95;
      result.reason = `Mesmo mês de competência e CNPJ da empresa já registrado`;
      return result;
    }
  }

  return result;
}

/**
 * Detect duplicate based on content hash
 */
export function checkDuplicateByHash(
  contentHash: string,
  existingHashes: Map<string, string[]> // hash -> document IDs
): DuplicateCheckResult {
  const result: DuplicateCheckResult = {
    isDuplicate: false,
    matchType: 'none',
    matchDocumentIds: [],
    confidence: 0,
    reason: '',
  };

  if (existingHashes.has(contentHash)) {
    const matchIds = existingHashes.get(contentHash) || [];
    result.isDuplicate = true;
    result.matchType = 'content_hash';
    result.matchDocumentIds = matchIds;
    result.confidence = 100;
    result.reason = 'Conteúdo idêntico ao arquivo já armazenado';
  }

  return result;
}

/**
 * Batch check for duplicates across multiple documents
 */
export function checkDuplicatesInBatch(
  newDocuments: Array<{ id: string; holeriteData: HoleriteData; contentHash: string }>,
  existingDocuments: Array<{ id: string; holeriteData: HoleriteData; contentHash?: string }>
): Map<string, DuplicateCheckResult> {
  const results = new Map<string, DuplicateCheckResult>();
  const hashMap = new Map<string, string[]>();

  // Build hash map from existing
  for (const doc of existingDocuments) {
    if (doc.contentHash) {
      if (!hashMap.has(doc.contentHash)) {
        hashMap.set(doc.contentHash, []);
      }
      hashMap.get(doc.contentHash)!.push(doc.id);
    }
  }

  // Check each new document
  for (const newDoc of newDocuments) {
    // First check by hash
    const hashResult = checkDuplicateByHash(newDoc.contentHash, hashMap);
    if (hashResult.isDuplicate) {
      results.set(newDoc.id, hashResult);
      continue;
    }

    // Then check by competencia + CPF/CNPJ
    const holeriteResult = checkDuplicate(newDoc.holeriteData, newDoc.id, existingDocuments);
    results.set(newDoc.id, holeriteResult);
  }

  return results;
}
