const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { taxFromBrackets, solidarityFromBands } = require('./irs-math');
const { simulateIrsBrackets } = require('./irs-engine');
const pack = require('./rules/pt-irs-2026');

describe('irs-math / escalões PT-IRS-2026.1', () => {
  it('1.º escalão: 5 000 € → 12,5 % = 625 €', () => {
    const r = taxFromBrackets(500_000, pack.brackets);
    assert.equal(r.taxCents, 62_500);
    assert.equal(r.bracketIndex, 0);
  });

  it('2.º escalão: 10 000 € → art. 68 n.º 2', () => {
    // 8 342 × 12,5 % + 1 658 × 15,7 % = 1 042,75 + 260,306 = 1 303,056 → 1 303,06
    const r = taxFromBrackets(1_000_000, pack.brackets);
    assert.equal(r.taxCents, 130_306);
  });

  it('exactamente no limite do 1.º escalão', () => {
    const r = taxFromBrackets(834_200, pack.brackets);
    assert.equal(r.taxCents, 104_275);
    assert.equal(r.bracketIndex, 0);
  });

  it('solidariedade: 100 000 € → 2,5 % sobre 20 000 €', () => {
    const s = solidarityFromBands(10_000_000, pack.solidarity);
    assert.equal(s.solidarityCents, 50_000);
  });

  it('solidariedade: 300 000 € → 2,5 % × 170k + 5 % × 50k', () => {
    // 170000*0.025 + 50000*0.05 = 4250 + 2500 = 6750
    const s = solidarityFromBands(30_000_000, pack.solidarity);
    assert.equal(s.solidarityCents, 675_000);
  });

  it('simulateIrsBrackets conjunta duplica coleta unitária', () => {
    const single = simulateIrsBrackets({
      taxableIncomeCents: 1_000_000,
      filingStatus: 'single',
      includeSolidarity: false,
    });
    const joint = simulateIrsBrackets({
      taxableIncomeCents: 2_000_000,
      filingStatus: 'joint',
      includeSolidarity: false,
    });
    assert.equal(joint.result.taxCents, single.result.taxCents * 2);
    assert.equal(joint.result.taxablePerUnitCents, 1_000_000);
  });

  it('versão desconhecida falha', () => {
    assert.throws(
      () => simulateIrsBrackets({ taxableIncomeCents: 100, ruleVersion: 'NOPE' }),
      /desconhecida/i,
    );
  });
});
