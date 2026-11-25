import { Buffer } from 'buffer';
// CSV detection utilities – self‑contained, backward‑compatible signatures

/** Detect text encoding. Returns one of: 'utf-8', 'utf-8-bom', 'windows-1252', 'iso-8859-1'. */
export function detectEncoding(content: string | Buffer): string {
  // Buffer handling – check BOM bytes
  if (Buffer.isBuffer(content)) {
    if (content.slice(0, 3).equals(Buffer.from([0xef, 0xbb, 0xbf]))) return 'utf-8-bom';
    // No reliable BOM for other encodings – fall back to heuristic
    const str = content.toString('utf8');
    return detectEncoding(str);
  }
  // String handling – Unicode BOM character
  if (content.charCodeAt(0) === 0xfeff) return 'utf-8-bom';
  // Heuristic: presence of typical Windows‑1252 characters (€, ‚, „, …)
  const win1252Chars = /[\u20AC\u201A\u0192\u201E\u2026\u2020\u2021\u02C6\u2030\u0160\u2039\u0152\u017D\u2018\u2019\u201C\u201D\u2022\u2013\u2014\u02DC\u2122\u0161\u203A\u0153\u017E\u0178]/;
  if (win1252Chars.test(content)) return 'windows-1252';
  // If any byte > 0x7F and not identified as Windows‑1252, assume ISO‑8859‑1
  if (/[\u0080-\u00FF]/.test(content)) return 'iso-8859-1';
  // Pure ASCII – ambiguous, default to UTF‑8
  return 'utf-8';
}

/** Detect field delimiter. Returns one of ',', ';', '\t', '|'. */
export function detectDelimiter(content: string): string {
  const lines = content.split(/\r?\n/).filter((l) => l.trim() !== '').slice(0, 30);
  const candidates = [',', ';', '\t', '|'];
  const scores: Record<string, number> = {};
  for (const delim of candidates) {
    let count = 0;
    for (const line of lines) {
      // simple split ignoring delimiters inside double quotes
      const parts = line.split(new RegExp(`(?<!\\")${escapeRegExp(delim)}(?!\\")`));
      if (parts.length > 1) count += parts.length - 1;
    }
    scores[delim] = count;
  }
  // Prefer delimiter with highest count, but avoid single‑column result
  const sorted = candidates.sort((a, b) => scores[b] - scores[a]);
  const best = sorted[0];
  return best;
}

/** Detect header row index. Returns row number (0‑based) or -1 if none detected. */
export function detectHeaderRow(rows: string[][]): number {
  const isHeader = (row: string[]) => {
    const nonEmpty = row.filter((c) => c.trim() !== '');
    if (nonEmpty.length === 0) return false;
    // Heuristic: majority of cells contain letters (no pure numbers or dates)
    const letterScore = nonEmpty.filter((c) => /[A-Za-zÀ-ÿ]/.test(c)).length;
    const numericScore = nonEmpty.filter((c) => /^[-+]?\d+(?:[.,]\d+)?$/.test(c)).length;
    return letterScore >= numericScore;
  };
  for (let i = 0; i < rows.length; i++) {
    if (isHeader(rows[i])) return i;
  }
  return -1;
}

/** Detect date format of a string value. Returns format identifier or null. */
export function detectDateFormat(value: string): string | null {
  const formats: { fmt: string; regex: RegExp }[] = [
    { fmt: 'DD/MM/YYYY', regex: /^(0[1-9]|[12][0-9]|3[01])[\/](0[1-9]|1[0-2])[\/](\d{4})$/ },
    { fmt: 'DD-MM-YYYY', regex: /^(0[1-9]|[12][0-9]|3[01])-(0[1-9]|1[0-2])-(\d{4})$/ },
    { fmt: 'YYYY-MM-DD', regex: /^(\d{4})-(0[1-9]|1[0-2])-(0[1-9]|[12][0-9]|3[01])$/ },
    { fmt: 'YYYY/MM/DD', regex: /^(\d{4})\/(0[1-9]|1[0-2])\/(0[1-9]|[12][0-9]|3[01])$/ },
    { fmt: 'MM/DD/YYYY', regex: /^(0[1-9]|1[0-2])[\/](0[1-9]|[12][0-9]|3[01])[\/](\d{4})$/ },
    { fmt: 'DD/MM/YY', regex: /^(0[1-9]|[12][0-9]|3[01])[\/](0[1-9]|1[0-2])[\/](\d{2})$/ },
    { fmt: 'MM/DD/YY', regex: /^(0[1-9]|1[0-2])[\/](0[1-9]|[12][0-9]|3[01])[\/](\d{2})$/ },
  ];
  for (const { fmt, regex } of formats) {
    const m = value.match(regex);
    if (!m) continue;
    // Validate calendar date for 4‑digit years
    const year = parseInt(m[3] ?? m[1] ?? '0', 10);
    const month = parseInt(m[2] ?? m[1] ?? '0', 10);
    const day = parseInt(m[1] ?? m[2] ?? '0', 10);
    if (year >= 1000) {
      if (isValidDate(year, month, day)) return fmt;
    } else {
      // 2‑digit year – accept but mark ambiguous via suffix
      if (isValidDate(2000 + year, month, day) || isValidDate(1900 + year, month, day)) return fmt + '-2digit';
    }
  }
  return null;
}

function isValidDate(y: number, m: number, d: number): boolean {
  if (m < 1 || m > 12) return false;
  const daysInMonth = [31, (y % 4 === 0 && (y % 100 !== 0 || y % 400 === 0)) ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  return d >= 1 && d <= daysInMonth[m - 1];
}

/** Parse monetary value. Returns number (exact cents) or null for empty/invalid. */
export function parseMonetary(value: string | number | null | undefined): number | null {
  if (value == null) return null;
  if (typeof value === 'number') return value;
  const raw = value.trim();
  if (raw === '') return null;
  // Detect negative via leading '-', parentheses, or trailing '-'
  let negative = false;
  let cleaned = raw;
  if (/^\(.*\)$/.test(cleaned)) { negative = true; cleaned = cleaned.slice(1, -1); }
  if (/^-/.test(cleaned)) { negative = true; cleaned = cleaned.slice(1); }
  if (/-$/.test(cleaned)) { negative = true; cleaned = cleaned.slice(0, -1); }
  // Remove currency symbols and spaces
  cleaned = cleaned.replace(/[R$€$\s]/g, '');
  // Determine separators
  const hasComma = cleaned.includes(',');
  const hasDot = cleaned.includes('.');
  let numberStr = cleaned;
  if (hasComma && hasDot) {
    const lastComma = cleaned.lastIndexOf(',');
    const lastDot = cleaned.lastIndexOf('.');
    if (lastComma > lastDot) {
      // Brazilian format: '.' thousands, ',' decimal
      numberStr = cleaned.replace(/\./g, '').replace(',', '.');
    } else {
      // US format: ',' thousands, '.' decimal
      numberStr = cleaned.replace(/,/g, '');
    }
  } else if (hasComma && !hasDot) {
    // Ambiguous: could be decimal or thousands. If exactly one comma and two digits after, treat as decimal
    const parts = cleaned.split(',');
    if (parts.length === 2 && parts[1].length === 2) {
      numberStr = parts[0] + '.' + parts[1];
    } else {
      // treat as thousands separator – remove commas
      numberStr = parts.join('');
    }
  } else {
    // No commas – plain number
    numberStr = cleaned;
  }
  const num = Number(numberStr);
  if (Number.isNaN(num)) return null;
  return negative ? -num : num;
}

/** Utility – escape RegExp special chars */
function escapeRegExp(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// ponytail: detection utilities – upgrade path: replace with robust charset lib, add regex‑based date heuristics
