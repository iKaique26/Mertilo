import { describe, it, expect, vi } from 'vitest';
import { sanitizeCsvField, formatCsvCell, generateCsvContent, downloadCsvFile } from './csvExport';

describe('csvExport utils', () => {
  it('sanitiza fórmulas perigosas e remove caracteres de controle', () => {
    // Fórmulas
    expect(sanitizeCsvField('=cmd|calc')).toBe("'=cmd|calc");
    expect(sanitizeCsvField('+1234')).toBe("'+1234");
    // Numeric negative as string (should not be neutralized)
    expect(sanitizeCsvField('-1234')).toBe('-1234');
    // Numeric negative as number (should not be neutralized)
    expect(sanitizeCsvField(-1234)).toBe('-1234');
    // Textual negative formula (should be neutralized)
    expect(sanitizeCsvField('-1+CMD()')).toBe("'-1+CMD()");
    // Leading whitespace before formula
    expect(sanitizeCsvField(' =cmd|calc')).toBe("'=cmd|calc");
    // Leading tab before formula
    expect(sanitizeCsvField('\t+cmd')).toBe("'+cmd");
    expect(sanitizeCsvField('@SUM(A1)')).toBe("'@SUM(A1)");
    expect(sanitizeCsvField('|powershell')).toBe("'|powershell");
    expect(sanitizeCsvField('%COMSPEC%')).toBe("'%COMSPEC%");
    // Controle removido antes da fórmula
    expect(sanitizeCsvField('\u0000=cmd')).toBe("'=cmd");
    expect(sanitizeCsvField('\u0001=cmd')).toBe("'=cmd");
    expect(sanitizeCsvField('\u0002=cmd')).toBe("'=cmd");
    expect(sanitizeCsvField('\u007F=cmd')).toBe("'=cmd");
    expect(sanitizeCsvField('\u0080=cmd')).toBe("'=cmd");
    // Unicode separadores antes da fórmula
    expect(sanitizeCsvField('\u2028=cmd')).toBe("'=cmd");
    expect(sanitizeCsvField('\u2029=cmd')).toBe("'=cmd");
    // Combinação de controles
    expect(sanitizeCsvField('\u0000\u0001\u2028=cmd')).toBe("'=cmd");
    // Texto comum sem controle
    expect(sanitizeCsvField('Compra Padaria')).toBe('Compra Padaria');
    // Preserva TAB, LF, CR quando não são fórmula
    expect(sanitizeCsvField('a\u0009b')).toBe('a\tb');
    expect(sanitizeCsvField('line1\u000Aline2')).toBe('line1\nline2');
    expect(sanitizeCsvField('carriage\u000Dreturn')).toBe('carriage\rreturn');
    // Valores vazios
    expect(sanitizeCsvField('')).toBe('');
    expect(sanitizeCsvField(null)).toBe('');
    expect(sanitizeCsvField(undefined)).toBe('');
  });

  it('formata células escapando aspas e delimitadores', () => {
    expect(formatCsvCell(120.5)).toBe('120.5');
    expect(formatCsvCell('Texto com ; ponto e vírgula')).toBe('"Texto com ; ponto e vírgula"');
    expect(formatCsvCell('Texto com "aspas"')).toBe('"Texto com ""aspas"""');
    expect(formatCsvCell('Texto normal')).toBe('Texto normal');
  });

it('gera conteúdo CSV com delimitador, BOM UTF-8 e sanitização', () => {
    const headers = ['Data', 'Descricao', 'Valor'];
    const rows = [
      ['2026-03-01', '=cmd|calc', 5000],
      ['2026-03-02', '\u0000\u2028|powershell', -250.75],
    ];
    const csv = generateCsvContent(headers, rows, ';');
    expect(csv.startsWith('\uFEFF')).toBe(true);
    expect(csv).toContain('Data;Descricao;Valor');
    // Fórmula deve ser neutralizada
    expect(csv).toContain("2026-03-01;'=cmd|calc;5000");
    // Controle removido e fórmula neutralizada
    expect(csv).toContain("2026-03-02;'|powershell;-250.75");
  });

  it('executa downloadCsvFile acionando elemento de link temporário', () => {
    // jsdom pode não ter URL.createObjectURL implementado por padrão
    if (typeof URL.createObjectURL !== 'function') {
      URL.createObjectURL = vi.fn().mockReturnValue('blob:test');
    } else {
      vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:test');
    }
    if (typeof URL.revokeObjectURL !== 'function') {
      URL.revokeObjectURL = vi.fn();
    } else {
      vi.spyOn(URL, 'revokeObjectURL').mockReturnValue(undefined);
    }

    const realElement = document.createElement('a');
    const clickSpy = vi.spyOn(realElement, 'click').mockImplementation(() => {});
    vi.spyOn(document, 'createElement').mockReturnValue(realElement);
    const appendSpy = vi.spyOn(document.body, 'appendChild');
    const removeSpy = vi.spyOn(document.body, 'removeChild');

    const success = downloadCsvFile('teste', 'extrato.csv');
    expect(success).toBe(true);
    expect(clickSpy).toHaveBeenCalled();
    expect(appendSpy).toHaveBeenCalledWith(realElement);
    expect(removeSpy).toHaveBeenCalledWith(realElement);

    vi.restoreAllMocks();
  });
});
