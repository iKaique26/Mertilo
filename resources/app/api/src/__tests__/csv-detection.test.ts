// CSV detection unit tests – fictional data only
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { detectEncoding, detectDelimiter, detectHeaderRow, detectDateFormat, parseMonetary } from '../utils/csvDetection.js';

// Helper to build CSV rows array
function rowsFromCsv(csv: string): string[][] {
  return csv.split(/\r?\n/).map((line) => line.split(','));
}

test('detectEncoding – UTF-8 BOM', () => {
  const bom = Buffer.from([0xef, 0xbb, 0xbf, 0x41, 0x42]); // "AB"
  assert.equal(detectEncoding(bom), 'utf-8-bom');
});

test('detectEncoding – Windows-1252 special char', () => {
  const txt = '€ price'; // contains Euro sign (U+20AC) typical Windows-1252
  assert.equal(detectEncoding(txt), 'windows-1252');
});

test('detectEncoding – ISO-8859-1 fallback', () => {
  const txt = String.fromCharCode(0xE9) + 'é'; // Latin-1 é
  assert.equal(detectEncoding(txt), 'iso-8859-1');
});

test('detectDelimiter – comma', () => {
  const csv = 'a,b,c\n1,2,3';
  assert.equal(detectDelimiter(csv), ',');
});

test('detectDelimiter – semicolon', () => {
  const csv = 'a;b;c\n1;2;3';
  assert.equal(detectDelimiter(csv), ';');
});

test('detectDelimiter – tab', () => {
  const csv = 'a\tb\tc\n1\t2\t3';
  assert.equal(detectDelimiter(csv), '\t');
});

test('detectHeaderRow – simple header', () => {
  const csv = '\n\nName,Value\nJohn,10';
  const rows = rowsFromCsv(csv);
  assert.equal(detectHeaderRow(rows), 2);
});

test('detectHeaderRow – no header', () => {
  const csv = '10,20\n30,40';
  const rows = rowsFromCsv(csv);
  assert.equal(detectHeaderRow(rows), -1);
});

test('detectDateFormat – DD/MM/YYYY', () => {
  assert.equal(detectDateFormat('31/12/2023'), 'DD/MM/YYYY');
});

test('detectDateFormat – ambiguous 01/02/2023', () => {
  // day>12, month<=12 => unambiguous DD/MM/YYYY
  assert.equal(detectDateFormat('01/02/2023'), 'DD/MM/YYYY');
});

test('detectDateFormat – invalid date returns null', () => {
  assert.equal(detectDateFormat('31/02/2023'), null);
});

test('parseMonetary – Brazilian format', () => {
  assert.equal(parseMonetary('R$ 1.234,56'), 1234.56);
});

test('parseMonetary – US format', () => {
  assert.equal(parseMonetary('1,234.56'), 1234.56);
});

test('parseMonetary – negative parentheses', () => {
  assert.equal(parseMonetary('(150,00)'), -150);
});

test('parseMonetary – empty returns null', () => {
  assert.equal(parseMonetary(''), null);
});
