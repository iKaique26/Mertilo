import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { logger } from './utils/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface LegalSection {
  heading: string;
  paragraphs: string[];
}

interface LegalDocument {
  type: string;
  version: string;
  publishedAt: string;
  title: string;
  content: LegalSection[];
}

interface LegalDocumentsContainer {
  terms: LegalDocument;
  privacy: LegalDocument;
}

let cachedDocuments: LegalDocumentsContainer | null = null;

function loadLegalDocuments(): LegalDocumentsContainer {
  if (cachedDocuments) return cachedDocuments;
  const filePath = path.join(path.dirname(fileURLToPath(import.meta.url)), '../shared/legal-documents.json');
  
  if (!fs.existsSync(filePath)) {
    logger.error(`Arquivo legal-documents.json não encontrado em ${filePath}`);
    throw new Error(`Arquivo legal-documents.json não encontrado`);
  }

  const raw = fs.readFileSync(filePath, 'utf-8');
  cachedDocuments = JSON.parse(raw) as LegalDocumentsContainer;
  return cachedDocuments;
}

export const LEGAL_DOCUMENTS = {
  get TERMS_OF_USE() { return loadLegalDocuments().terms; },
  get PRIVACY_NOTICE() { return loadLegalDocuments().privacy; },
};

export type LegalDocumentType = keyof typeof LEGAL_DOCUMENTS;

export function legalDocumentHash(document: LegalDocument): string {
  const payload = {
    type: document.type,
    version: document.version,
    publishedAt: document.publishedAt,
    title: document.title,
    content: document.content
  };
  return createHash('sha256').update(JSON.stringify(payload)).digest('hex');
}

export function currentLegalDocuments() {
  const docs = loadLegalDocuments();
  return [
    { ...docs.terms, contentHash: legalDocumentHash(docs.terms) },
    { ...docs.privacy, contentHash: legalDocumentHash(docs.privacy) }
  ];
}

export function getLegalDocument(type: 'TERMS_OF_USE' | 'PRIVACY_NOTICE') {
  const docs = loadLegalDocuments();
  const doc = type === 'TERMS_OF_USE' ? docs.terms : docs.privacy;
  return { ...doc, contentHash: legalDocumentHash(doc) };
}

