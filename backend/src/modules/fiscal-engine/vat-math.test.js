const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { fromNetCents, fromGrossCents, halfUpDiv } = require('./vat-math');
const { simulateVat, listRulePacks } = require('./vat-engine');

describe('vat-math', () => {
  it('10,00 € líquido a 23% = 12,30 € total', () => {
    const r = fromNetCents(1000, 2300);
    assert.equal(r.netCents, 1000);
    assert.equal(r.vatCents, 230);
    assert.equal(r.grossCents, 1230);
  });

  it('12,30 € total a 23% → líquido 10,00 €', () => {
    const r = fromGrossCents(1230, 2300);
    assert.equal(r.grossCents, 1230);
    assert.equal(r.netCents, 1000);
    assert.equal(r.vatCents, 230);
  });

  it('taxa reduzida 6% e intermédia 13%', () => {
    assert.equal(fromNetCents(10000, 600).vatCents, 600);
    assert.equal(fromNetCents(10000, 1300).vatCents, 1300);
  });

  it('halfUpDiv arredonda 0,5 para cima', () => {
    assert.equal(halfUpDiv(5, 10), 1);
    assert.equal(halfUpDiv(4, 10), 0);
  });

  it('ida e volta net→gross→net preserva o líquido de referência em casos exactos', () => {
    const a = fromNetCents(1000, 2300);
    const b = fromGrossCents(a.grossCents, 2300);
    assert.equal(b.netCents, a.netCents);
    assert.equal(b.vatCents, a.vatCents);
  });

  it('rejeita valores negativos', () => {
    assert.throws(() => fromNetCents(-1, 2300), /inválido/i);
  });
});

describe('vat-engine', () => {
  it('lista pack PT-IVA-2026.1', () => {
    const packs = listRulePacks();
    assert.ok(packs.some((p) => p.version === 'PT-IVA-2026.1'));
  });

  it('simulateVat devolve discriminação e disclaimer', () => {
    const s = simulateVat({
      direction: 'net_to_gross',
      amountCents: 1000,
      rateCode: 'normal',
    });
    assert.equal(s.ruleVersion, 'PT-IVA-2026.1');
    assert.equal(s.result.grossCents, 1230);
    assert.ok(s.disclaimer.includes('Simulação'));
  });

  it('simulateVat gross_to_net', () => {
    const s = simulateVat({
      direction: 'gross_to_net',
      amountCents: 1230,
      rateCode: 'normal',
    });
    assert.equal(s.result.netCents, 1000);
  });
});
