const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { contributionFromBase, relevantIncomeFromServices } = require('./ss-math');
const { simulateSs } = require('./ss-engine');

describe('ss-math / PT-SS-2026.1', () => {
  it('TCO: 1 000 € → trabalhador 110 € + entidade 237,50 €', () => {
    assert.equal(contributionFromBase(100_000, 1100), 11_000);
    assert.equal(contributionFromBase(100_000, 2375), 23_750);
  });

  it('rendimento relevante 70 % de 2 000 € = 1 400 €', () => {
    assert.equal(relevantIncomeFromServices(200_000, 70), 140_000);
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
    assert.equal(s.result.workerCents, 29_960);
    assert.equal(s.result.employerCents, 0);
  });

  it('simulateSs IPSS entidade 22,3 %', () => {
    const s = simulateSs({ regimeCode: 'tco_ipss', baseCents: 100_000 });
    assert.equal(s.result.employerCents, 22_300);
    assert.equal(s.result.totalCents, 33_300);
  });

  it('rejeita serviços em regime TCO', () => {
    assert.throws(
      () => simulateSs({ regimeCode: 'tco_lucrativo', servicesCents: 100_000 }),
      /independente/i,
    );
  });
});
