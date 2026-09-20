import assert from 'node:assert/strict';
import test from 'node:test';
import { validateCategoryPayload, validateHistorySummary, validateVehicleExpense } from '../utils/validation.js';

test('category payload accepts valid values and rejects excessive total percentage', () => {
  assert.equal(validateCategoryPayload({ nome: 'Moradia', cor: '#7C3AED', percentual: 0.3 }), true);
  assert.equal(validateCategoryPayload({ nome: 'Moradia', cor: '#7C3AED', percentual: 1.2 }), false);
});

test('vehicle expense requires profit to match revenue minus cost', () => {
  assert.equal(validateVehicleExpense({
    precoCombustivel: 5.5,
    mediaConsumo: 10,
    kmPercorrido: 150,
    tipoTrajeto: 'cliente',
    custo: 100,
    receita: 150,
    lucro: 50,
  }), true);

  assert.equal(validateVehicleExpense({
    precoCombustivel: 5.5,
    mediaConsumo: 10,
    kmPercorrido: 150,
    tipoTrajeto: 'cliente',
    custo: 100,
    receita: 150,
    lucro: 40,
  }), false);
});

test('history summary rejects invalid totals for salary and income', () => {
  assert.equal(validateHistorySummary({
    mes: '2026-08',
    salario: 5000,
    totalContas: 1500,
    saldoDisponivel: 4000,
    totalExtras: 500,
    rendaTotal: 5500,
    distribuicao: [],
    extras: [],
  }), true);

  assert.equal(validateHistorySummary({
    mes: '2026-08',
    salario: 5000,
    totalContas: 1500,
    saldoDisponivel: 2000,
    totalExtras: 500,
    rendaTotal: 4000,
    distribuicao: [],
    extras: [],
  }), false);
});
