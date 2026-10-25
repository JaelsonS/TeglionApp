const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { imtFromBrackets, imtFromFlatRate } = require('./imt-math');
const { simulateImt } = require('./imt-engine');
const pack = require('./rules/pt-imt-2026');

describe('imt-math / PT-IMT-2026.1', () => {
  it('HPP até 106 346 € → 0', () => {
    const r = imtFromBrackets(10_634_600, pack.tables.I.brackets);
    assert.equal(r.imtCents, 0);
  });

  it('HPP 200 000 € → 7 % − 10 457,96 = 3 542,04', () => {
    const r = imtFromBrackets(20_000_000, pack.tables.I.brackets);
    assert.equal(r.imtCents, 354_204);
  });

  it('HPP 700 000 € → taxa única 6 % = 42 000', () => {
    const r = imtFromBrackets(70_000_000, pack.tables.I.brackets);
    assert.equal(r.imtCents, 4_200_000);
    assert.equal(r.flat, true);
  });

  it('HPP 1 200 000 € → taxa única 7,5 %', () => {
    const r = imtFromBrackets(120_000_000, pack.tables.I.brackets);
    assert.equal(r.imtCents, 9_000_000);
  });

  it('Habitação não HPP 100 000 € → 1 %', () => {
    const r = imtFromBrackets(10_000_000, pack.tables.III.brackets);
    assert.equal(r.imtCents, 100_000);
  });

  it('Jovens ≤35: 300 000 € → 0', () => {
    const r = imtFromBrackets(30_000_000, pack.tables.II.brackets);
    assert.equal(r.imtCents, 0);
  });

  it('Jovens ≤35: 400 000 € → 8 % − 26 443,12', () => {
    // 400000*0.08 - 26443.12 = 32000 - 26443.12 = 5556.88
    const r = imtFromBrackets(40_000_000, pack.tables.II.brackets);
    assert.equal(r.imtCents, 555_688);
  });

  it('rústico 5 % e outros urbanos 6,5 %', () => {
    assert.equal(imtFromFlatRate(100_000, 5_000).imtCents, 5_000);
    assert.equal(imtFromFlatRate(100_000, 6_500).imtCents, 6_500);
  });

  it('simulateImt rejeita tabela/taxa inventada e negativo', () => {
    assert.throws(() => simulateImt({ tableCode: 'Z', taxableValueCents: 100 }));
    assert.throws(() => simulateImt({ flatRateCode: 'nope', taxableValueCents: 100 }));
    assert.throws(() => simulateImt({ tableCode: 'I', taxableValueCents: -1 }));
  });

  it('simulateImt devolve disclaimer e calcType', () => {
    const s = simulateImt({ tableCode: 'I', taxableValueCents: 20_000_000 });
    assert.equal(s.calcType, 'imt');
    assert.equal(s.result.imtCents, 354_204);
    assert.ok(s.disclaimer.includes('IMT'));
  });
});
