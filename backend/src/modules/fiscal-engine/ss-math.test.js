const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { contributionFromBase, relevantIncomeFromGross, relevantIncomeFromServices } = require('./ss-math');
const { simulateSs } = require('./ss-engine');

describe('ss-math / PT-SS-2026.1', () => {
  it('TCO: 1 000 € → trabalhador 110 € + entidade 237,50 €', () => {
    assert.equal(contributionFromBase(100_000, 1100), 11_000);
    assert.equal(contributionFromBase(100_000, 2375), 23_750);
  });

  it('rendimento relevante 70 % de 2 000 € = 1 400 €', () => {
    assert.equal(relevantIncomeFromServices(200_000, 70), 140_000);
    assert.equal(relevantIncomeFromGross(200_000, 70, 'Prestação'), 140_000);
  });

  it('rendimento relevante 20 % de 2 000 € vendas = 400 €', () => {
    assert.equal(relevantIncomeFromGross(200_000, 20, 'Vendas'), 40_000);
  });

  it('simulateSs TCO lucrativo', () => {
    const s = simulateSs({ regimeCode: 'tco_lucrativo', baseCents: 100_000 });
    assert.equal(s.result.workerCents, 11_000);
    assert.equal(s.result.employerCents, 23_750);
    assert.equal(s.result.totalCents, 34_750);
    assert.equal(s.calcType, 'ss_contributions');
  });

  it('simulateSs TI a partir de serviços', () => {
    // 2000 € serviços → 1400 € relevante × 21,4 % = 299,60 €
    const s = simulateSs({ regimeCode: 'ti_geral', servicesCents: 200_000 });
    assert.equal(s.result.baseCents, 140_000);
    assert.equal(s.result.relevantFromServicesCents, 140_000);
    assert.equal(s.result.relevantFromSalesCents, 0);
    assert.equal(s.result.workerCents, 29_960);
    assert.equal(s.result.employerCents, 0);
    assert.equal(s.input.derivedFrom, 'gross_relevant_income');
  });

  it('simulateSs TI a partir de vendas (20 %)', () => {
    // 2000 € vendas → 400 € relevante × 21,4 % = 85,60 €
    const s = simulateSs({ regimeCode: 'ti_geral', salesCents: 200_000 });
    assert.equal(s.result.baseCents, 40_000);
    assert.equal(s.result.relevantFromSalesCents, 40_000);
    assert.equal(s.result.relevantFromServicesCents, 0);
    assert.equal(s.result.workerCents, 8_560);
  });

  it('simulateSs TI serviços + vendas (70 % + 20 %)', () => {
    // 1000 € serviços → 700; 1000 € vendas → 200; base 900 × 21,4 % = 192,60 €
    const s = simulateSs({
      regimeCode: 'ti_geral',
      servicesCents: 100_000,
      salesCents: 100_000,
    });
    assert.equal(s.result.relevantFromServicesCents, 70_000);
    assert.equal(s.result.relevantFromSalesCents, 20_000);
    assert.equal(s.result.baseCents, 90_000);
    assert.equal(s.result.workerCents, 19_260);
  });

  it('simulateSs IPSS entidade 22,3 %', () => {
    const s = simulateSs({ regimeCode: 'tco_ipss', baseCents: 100_000 });
    assert.equal(s.result.employerCents, 22_300);
    assert.equal(s.result.totalCents, 33_300);
  });

  it('rejeita serviços/vendas em regime TCO', () => {
    assert.throws(
      () => simulateSs({ regimeCode: 'tco_lucrativo', servicesCents: 100_000 }),
      /independente/i,
    );
    assert.throws(
      () => simulateSs({ regimeCode: 'tco_lucrativo', salesCents: 100_000 }),
      /independente/i,
    );
  });
});
