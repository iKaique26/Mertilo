import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';

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
  const p1 = path.join(__dirname, '../../shared/legal-documents.json');
  const p2 = path.join(__dirname, '../../../shared/legal-documents.json');
  const p3 = path.join(__dirname, '../../resources/app/shared/legal-documents.json');
  const p4 = path.join(process.cwd(), 'shared/legal-documents.json');
  const filePath = fs.existsSync(p1) ? p1 : fs.existsSync(p2) ? p2 : fs.existsSync(p3) ? p3 : p4;
  
  if (!fs.existsSync(filePath)) {
    throw new Error(`Arquivo legal-documents.json n�o encontrado`);
  }

  const raw = fs.readFileSync(filePath, 'utf-8');
  cachedDocuments = JSON.parse(raw) as LegalDocumentsContainer;
  return cachedDocuments;
}

const docs = loadLegalDocuments();
export const LEGAL_DOCUMENTS = {
  TERMS_OF_USE: docs.terms,
  PRIVACY_NOTICE: docs.privacy,
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

