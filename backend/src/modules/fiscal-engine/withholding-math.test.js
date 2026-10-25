const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { withholdingFromTable, resolveParcelaCents } = require('./withholding-math');
const { simulateWithholding } = require('./withholding-engine');
const pack = require('./rules/pt-irs-wh-2026');

describe('withholding-math / PT-IRS-WH-2026.1', () => {
  it('SMN 920 € → retenção 0', () => {
    const r = withholdingFromTable(92_000, pack.tables.I.brackets, 0);
    assert.equal(r.withholdingCents, 0);
  });

  it('1 000 € tabela I: parcela fórmula e retenção ~36 €', () => {
    const bracket = pack.tables.I.brackets[1];
    const parcela = resolveParcelaCents(100_000, bracket);
    assert.equal(parcela, 8_900);
    const r = withholdingFromTable(100_000, pack.tables.I.brackets, 0);
    assert.equal(r.withholdingCents, 3_600);
  });

  it('1 500 € tabela I sem dependentes → 168,17 €', () => {
    const r = withholdingFromTable(150_000, pack.tables.I.brackets, 0);
    assert.equal(r.withholdingCents, 16_817);
    assert.equal(r.netCents, 133_183);
  });

  it('1 500 € tabela II com 2 dependentes reduz retenção', () => {
    const none = withholdingFromTable(150_000, pack.tables.I.brackets, 0);
    const withDeps = withholdingFromTable(150_000, pack.tables.II.brackets, 2, {
      largeFamilyRateReductionMilli: pack.largeFamilyRateReductionMilli,
    });
    assert.ok(withDeps.withholdingCents < none.withholdingCents);
    // 16817 − 2×3429 = 9959
    assert.equal(withDeps.withholdingCents, 9_959);
  });

  it('≥ 3 dependentes reduz taxa marginal 1 p.p.', () => {
    const two = simulateWithholding({
      tableCode: 'II',
      remunerationCents: 150_000,
      dependents: 2,
    });
    const three = simulateWithholding({
      tableCode: 'II',
      remunerationCents: 150_000,
      dependents: 3,
    });
    assert.equal(three.result.familyRateReduced, true);
    assert.ok(three.result.withholdingCents < two.result.withholdingCents);
  });

  it('tabela II exige dependentes', () => {
    assert.throws(
      () => simulateWithholding({ tableCode: 'II', remunerationCents: 150_000, dependents: 0 }),
      /dependente/i,
    );
  });

  it('limite tabela I 1042 € taxa efectiva ~5,3 %', () => {
    const r = simulateWithholding({ tableCode: 'I', remunerationCents: 104_200, dependents: 0 });
    // ~5.3% → cerca de 5521 cêntimos
    assert.ok(r.result.effectiveBps >= 520 && r.result.effectiveBps <= 540);
  });
});
