import { createHash } from 'node:crypto';

export const LEGAL_DOCUMENTS = {
  TERMS_OF_USE: {
    type: 'TERMS_OF_USE',
    version: '1.0.0',
    publishedAt: '2026-11-09',
    requiresAcceptance: true,
  },
  PRIVACY_NOTICE: {
    type: 'PRIVACY_NOTICE',
    version: '1.0.0',
    publishedAt: '2026-11-09',
    requiresAcceptance: false,
  },
} as const;

export type LegalDocumentType = keyof typeof LEGAL_DOCUMENTS;

export function legalDocumentHash(document: (typeof LEGAL_DOCUMENTS)[LegalDocumentType]): string {
  return createHash('sha256').update(JSON.stringify(document)).digest('hex');
}

export function currentLegalDocuments() {
  return Object.values(LEGAL_DOCUMENTS).map((document) => ({ ...document, contentHash: legalDocumentHash(document) }));
}
