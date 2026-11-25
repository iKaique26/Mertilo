/**
 * Utilitário seguro para formatação e exportação CSV no cliente.
 * Sanitiza fórmulas contra CSV Injection (V-002) e formata campos para RFC 4180.
 */

export function sanitizeCsvField(value: unknown): string {
  if (value === null || value === undefined) return '';
  const str = String(value);
  // Remove controle indesejado, preserva TAB (\u0009), LF (\u000A) e CR (\u000D)
  const cleaned = str.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F]/g, '');
  // Trim leading whitespace, tabs, CR, LF e separadores Unicode antes de detectar fórmula
  const trimmed = cleaned.replace(/^[\s\u2028\u2029]*/, '');
  // Se for número (incluindo negativo) e não contiver outros caracteres, não neutraliza
  if (/^-?\d+(\.\d+)?$/.test(trimmed)) {
    return cleaned;
  }
  // Detecta operadores de fórmula
  if (/^[=+\-@|%]/.test(trimmed)) {
    return `'${trimmed}`;
  }
  // Retorna conteúdo limpo (mantém tabs/quebras de linha internas)
  return cleaned;
}

export function formatCsvCell(value: unknown): string {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? String(value) : '';
  }
  const sanitized = sanitizeCsvField(value);
  if (
    sanitized.includes('"') ||
    sanitized.includes(';') ||
    sanitized.includes(',') ||
    sanitized.includes('\n') ||
    sanitized.includes('\r')
  ) {
    return `"${sanitized.replace(/"/g, '""')}"`;
  }
  return sanitized;
}

export function generateCsvContent(
  headers: string[],
  rows: Array<Array<unknown>>,
  delimiter: ';' | ',' = ';'
): string {
  const headerLine = headers.map(formatCsvCell).join(delimiter);
  const dataLines = rows.map((row) => row.map(formatCsvCell).join(delimiter));
  // BOM UTF-8 para garantir abertura correta no Excel e programas locais
  return '﻿' + [headerLine, ...dataLines].join('
');
}

export function downloadCsvFile(content: string, filename: string): boolean {
  if (
    typeof window === 'undefined' ||
    typeof document === 'undefined' ||
    typeof Blob !== 'function' ||
    !document.body ||
    typeof document.createElement !== 'function'
  ) {
    return false;
  }
  try {
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const createUrl = window.URL?.createObjectURL || URL?.createObjectURL;
    if (typeof createUrl !== 'function') return false;
    const url = createUrl(blob);
    if (typeof url !== 'string' || !url) return false;
    const link = document.createElement('a');
    if (!link || typeof link.click !== 'function') return false;
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    try {
      link.click();
    } finally {
      if (link.parentNode) {
        link.parentNode.removeChild(link);
      }
      const revokeUrl = window.URL?.revokeObjectURL || URL?.revokeObjectURL;
      if (typeof revokeUrl === 'function') {
        const timer = setTimeout(() => {
          try {
            revokeUrl(url);
          } catch {
            // ignore revocation error after click
          }
        }, 1000);
        if (typeof timer === 'object' && timer !== null && 'unref' in timer && typeof timer.unref === 'function') {
          timer.unref();
        }
      }
    }
    return true;
  } catch (err) {
    console.error('Falha no download do CSV:', err);
    return false;
  }
}
