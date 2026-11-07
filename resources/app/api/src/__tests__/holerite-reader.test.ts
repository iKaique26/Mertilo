import test from 'node:test';
import assert from 'node:assert/strict';
import { parseCurrency } from '../services/holerite-reader.js';

test('parseCurrency normalizes Brazilian and US currency formats', () => {
  const cases: Array<[string, number]> = [
    ['2.896,62', 2896.62],
    ['2896,62', 2896.62],
    ['2896.62', 2896.62],
    ['2,896.62', 2896.62],
    ['150,00', 150],
    ['150.00', 150],
    ['-45,90', -45.9],
    ['-45.90', -45.9],
    ['0,99', 0.99],
    ['0.99', 0.99],
  ];
  for (const [input, expected] of cases) assert.equal(parseCurrency(input), expected, input);
});
