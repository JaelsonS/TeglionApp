const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { taxFromProgressiveBrackets, municipalSurcharge } = require('./irc-math');
const { simulateIrc } = require('./irc-engine');
const pack = require('./rules/pt-irc-2026');

describe('irc-math / PT-IRC-2026.1', () => {
  it('taxa geral 19 % sobre 100 000 € = 19 000 €', () => {
    const r = taxFromProgressiveBrackets(10_000_000, pack.regimes.general.brackets);
    assert.equal(r.taxCents, 1_900_000);
  });

  it('PME: 80 000 € → 15 % × 50k + 19 % × 30k', () => {
    // 50000*0.15 + 30000*0.19 = 7500 + 5700 = 13200
    const r = taxFromProgressiveBrackets(8_000_000, pack.regimes.sme.brackets);
    assert.equal(r.taxCents, 1_320_000);
  });

  it('PME Interior: 40 000 € → 12,5 %', () => {
    const r = taxFromProgressiveBrackets(4_000_000, pack.regimes.sme_interior.brackets);
    assert.equal(r.taxCents, 500_000);
  });

  it('derrama estadual: 2 M€ → 3 % sobre 0,5 M€', () => {
    // 2_000_000 - 1_500_000 = 500_000 × 3% = 15_000
    const s = simulateIrc({
      regimeCode: 'general',
      taxableCents: 200_000_000,
      includeStateSurcharge: true,
      municipalDerramaBps: 0,
    });
    assert.equal(s.result.stateSurchargeCents, 1_500_000);
  });

  it('derrama municipal 1,5 % sobre 100k', () => {
    const m = municipalSurcharge(10_000_000, 150);
    assert.equal(m.taxCents, 150_000);
  });

  it('rejeita derrama municipal > 1,5 %', () => {
    assert.throws(() => municipalSurcharge(1000, 151), /exceder/i);
  });

  it('simulateIrc total = irc + estadual + municipal', () => {
    const s = simulateIrc({
      regimeCode: 'sme',
      taxableCents: 8_000_000,
      includeStateSurcharge: false,
      municipalDerramaBps: 100, // 1%
    });
    assert.equal(s.result.ircCents, 1_320_000);
    assert.equal(s.result.municipalSurchargeCents, 80_000);
    assert.equal(s.result.totalCents, 1_400_000);
    assert.equal(s.calcType, 'irc');
  });

  it('rejeita regime/negativo', () => {
    assert.throws(() => simulateIrc({ regimeCode: 'nope', taxableCents: 100 }));
    assert.throws(() => simulateIrc({ regimeCode: 'general', taxableCents: -1 }));
  });
});
