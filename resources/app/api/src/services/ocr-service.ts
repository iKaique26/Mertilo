/**
 * OCR Service
 * Handles image-to-text extraction using Tesseract.js
 * Local processing, no external APIs
 */

import fs from 'fs';
import { logger } from '../utils/logger.js';

// Lazy-load Tesseract.js to avoid loading overhead if not needed
let Tesseract: any = null;

async function loadTesseract() {
  if (Tesseract) return Tesseract;
  
  try {
    // Dynamic import to handle ESM
    const module = await import('tesseract.js');
    Tesseract = module.default;
    return Tesseract;
  } catch (error) {
    logger.error('Tesseract.js não disponível. OCR desabilitado.', error);
    return null;
  }
}

export interface OCRResult {
  success: boolean;
  text: string;
  confidence: number;
  errors: string[];
}

/**
 * Extract text from image using OCR
 * Attempts Tesseract.js, falls back to error if not available
 */
export async function extractTextFromImage(imagePath: string): Promise<OCRResult> {
  const result: OCRResult = {
    success: false,
    text: '',
    confidence: 0,
    errors: [],
  };

  try {
    if (!fs.existsSync(imagePath)) {
      result.errors.push(`Arquivo não encontrado: ${imagePath}`);
      return result;
    }

    // Try to load Tesseract
    const TesseractLib = await loadTesseract();
    
    if (!TesseractLib) {
      result.errors.push('OCR via Tesseract.js não disponível. Instale com: npm install tesseract.js');
      logger.warn('OCR não implementado - Tesseract.js não instalado');
      return result;
    }

    logger.info(`Iniciando OCR para: ${imagePath}`);
    
    // Create worker for OCR
    const { createWorker } = TesseractLib;
    const worker = await createWorker();
    
    try {
      // Load Portuguese language for better accuracy
      await worker.loadLanguage('por');
      await worker.initialize('por');

      // Process image
      const imageData = fs.readFileSync(imagePath);
      const ocrResult = await worker.recognize(imageData);
      
      result.text = ocrResult.data.text || '';
      result.confidence = Math.round((ocrResult.data.confidence || 0) / 100); // Convert to percentage
      result.success = result.text.length > 0;

      if (!result.success) {
        result.errors.push('OCR não conseguiu extrair texto da imagem');
      }

      logger.info(`OCR concluído. Confiança: ${result.confidence}%`);
    } finally {
      await worker.terminate();
    }

    return result;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro desconhecido';
    result.errors.push(`Erro ao processar OCR: ${message}`);
    logger.error('Erro ao processar OCR:', error);
    return result;
  }
}

/**
 * Detect if PDF is scanned (image-based) or text-based
 * Returns confidence score (0-100) for being a scanned PDF
 */
export function detectIfScannedPDF(pdfText: string): number {
  if (!pdfText || pdfText.trim().length === 0) {
    return 90; // Likely scanned if no text extracted
  }

  // Count words and characters
  const words = pdfText.trim().split(/\s+/).length;
  const chars = pdfText.length;
  
  // If very few characters per word, likely OCR noise
  const charsPerWord = chars / words;
  
  // If less than 3 chars per word on average, likely scanned
  if (charsPerWord < 3) {
    return 75;
  }
  
  // If reasonable structure, likely text-based
  return 20;
}
