/**
 * Auditoria de regressão + segurança — motores fiscais V10.
 * Invariantes, rejeição de input maligno, e isolamento firm_id no serviço.
 */
const { describe, it, mock, beforeEach } = require('node:test');
const assert = require('node:assert/strict');

const clientsRepository = require('../../db/supabase/repositories/clients.repository');
const fiscalCalculationsRepository = require('../../db/supabase/repositories/fiscal-calculations.repository');
const { fromNetCents, fromGrossCents } = require('./vat-math');
const { simulateVat } = require('./vat-engine');
const { simulateIrsBrackets } = require('./irs-engine');
const { simulateSs } = require('./ss-engine');
const { simulateWithholding } = require('./withholding-engine');
const { simulateImt } = require('./imt-engine');
const { simulateIrc } = require('./irc-engine');
const {
  runSimulate,
  runIrsSimulate,
  runSsSimulate,
  runWithholdingSimulate,
  runImtSimulate,
  runIrcSimulate,
  createVatSimulation,
  createIrsSimulation,
  createSsSimulation,
  createWithholdingSimulation,
  createImtSimulation,
  createIrcSimulation,
  getCalculation,
  listCalculations,
} = require('./fiscal-calculations.service');
const { mapRow } = require('../../db/supabase/repositories/fiscal-calculations.repository');

describe('V10 fiscal — invariantes monetários', () => {
  it('IVA: net + vat = gross sempre (amostra)', () => {
    for (const net of [0, 1, 99, 1000, 12345, 999999]) {
      for (const bps of [600, 1300, 2300]) {
        const a = fromNetCents(net, bps);
        assert.equal(a.netCents + a.vatCents, a.grossCents);
        const b = fromGrossCents(a.grossCents, bps);
        assert.equal(b.netCents + b.vatCents, b.grossCents);
      }
    }
  });

  it('IRS: coleta + solidariedade = total; nunca negativo', () => {
    for (const cents of [0, 500_000, 1_000_000, 10_000_000, 30_000_000]) {
      const s = simulateIrsBrackets({ taxableIncomeCents: cents, filingStatus: 'single' });
      assert.ok(s.result.taxCents >= 0);
      assert.ok(s.result.solidarityCents >= 0);
      assert.equal(s.result.taxCents + s.result.solidarityCents, s.result.totalCents);
    }
  });

  it('SS: trabalhador + entidade = total', () => {
    const s = simulateSs({ regimeCode: 'tco_lucrativo', baseCents: 250_000 });
    assert.equal(s.result.workerCents + s.result.employerCents, s.result.totalCents);
  });

  it('Retenção: never negative; líquido + retenção = bruto', () => {
    for (const R of [0, 92_000, 100_000, 150_000, 500_000, 2_500_000]) {
      const s = simulateWithholding({ tableCode: 'I', remunerationCents: R, dependents: 0 });
      assert.ok(s.result.withholdingCents >= 0);
      assert.equal(s.result.withholdingCents + s.result.netCents, R);
    }
  });

  it('IMT: nunca negativo (amostra tabelas + flat)', () => {
    for (const v of [0, 10_000_000, 20_000_000, 70_000_000, 120_000_000]) {
      for (const table of ['I', 'II', 'III']) {
        const s = simulateImt({ tableCode: table, taxableValueCents: v });
        assert.ok(s.result.imtCents >= 0);
      }
    }
    assert.ok(simulateImt({ flatRateCode: 'rustic', taxableValueCents: 50_000 }).result.imtCents >= 0);
  });

  it('IRC: total = irc + estadual + municipal', () => {
    const s = simulateIrc({
      regimeCode: 'sme',
      taxableCents: 8_000_000,
      includeStateSurcharge: false,
      municipalDerramaBps: 100,
    });
    assert.equal(
      s.result.ircCents + s.result.stateSurchargeCents + s.result.municipalSurchargeCents,
      s.result.totalCents,
    );
  });
});

describe('V10 fiscal — rejeição de input', () => {
  it('rejeita negativos / NaN / versões inventadas', () => {
    assert.throws(() => runSimulate({ direction: 'net_to_gross', amountCents: -1, rateCode: 'normal' }));
    assert.throws(() => runIrsSimulate({ taxableIncomeCents: -10 }));
    assert.throws(() => runSsSimulate({ regimeCode: 'tco_lucrativo', baseCents: -1 }));
    assert.throws(() => runWithholdingSimulate({ tableCode: 'I', remunerationCents: -5 }));
    assert.throws(() => runImtSimulate({ tableCode: 'I', taxableValueCents: -1 }));
    assert.throws(() => runIrcSimulate({ regimeCode: 'general', taxableCents: -1 }));
    assert.throws(() => simulateVat({ amountCents: 100, rateCode: 'normal', ruleVersion: 'FAKE' }));
    assert.throws(() => simulateIrsBrackets({ taxableIncomeCents: 100, ruleVersion: 'FAKE' }));
    assert.throws(() => simulateSs({ regimeCode: 'nope', baseCents: 100 }));
    assert.throws(() => simulateWithholding({ tableCode: 'Z', remunerationCents: 100 }));
    assert.throws(() => simulateImt({ tableCode: 'Z', taxableValueCents: 100 }));
    assert.throws(() => simulateIrc({ regimeCode: 'nope', taxableCents: 100 }));
  });

  it('IVA rejeita rateCode desconhecido', () => {
    assert.throws(() => runSimulate({ direction: 'net_to_gross', amountCents: 100, rateCode: 'xxx' }));
  });
});

describe('V10 fiscal — disclaimers e calcType estáveis', () => {
  it('cada motor expõe disclaimer e calcType canónico', () => {
    const vat = simulateVat({ direction: 'net_to_gross', amountCents: 100, rateCode: 'normal' });
    const irs = simulateIrsBrackets({ taxableIncomeCents: 100_000 });
    const ss = simulateSs({ regimeCode: 'ti_geral', baseCents: 100_000 });
    const wh = simulateWithholding({ tableCode: 'III', remunerationCents: 200_000, dependents: 1 });
    const imt = simulateImt({ tableCode: 'I', taxableValueCents: 20_000_000 });
    const irc = simulateIrc({ regimeCode: 'general', taxableCents: 10_000_000 });
    assert.equal(vat.calcType, 'vat_net_gross');
    assert.equal(irs.calcType, 'irs_brackets');
    assert.equal(ss.calcType, 'ss_contributions');
    assert.equal(wh.calcType, 'irs_withholding');
    assert.equal(imt.calcType, 'imt');
    assert.equal(irc.calcType, 'irc');
    for (const s of [vat, irs, ss, wh, imt, irc]) {
      assert.ok(String(s.disclaimer).length > 40);
      assert.ok(s.ruleVersion);
      assert.ok(s.source?.label);
    }
  });
});

describe('V10 fiscal — isolamento tenant no serviço', () => {
  beforeEach(() => {
    mock.restoreAll();
  });

  async function assertClientIsolation(createFn, body) {
    mock.method(clientsRepository, 'findClientById', async () => null);
    await assert.rejects(
      () => createFn({ firmId: 'firm-a', actorId: 'u1', body: { ...body, clientId: 'c-x' } }),
      (err) => err.statusCode === 404,
    );
  }

  it('create* exige cliente do mesmo firm (VAT/IRS/SS/WH/IMT/IRC)', async () => {
    await assertClientIsolation(createVatSimulation, {
      direction: 'net_to_gross',
      amountCents: 1000,
      rateCode: 'normal',
    });
    await assertClientIsolation(createIrsSimulation, { taxableIncomeCents: 100_000 });
    await assertClientIsolation(createSsSimulation, {
      regimeCode: 'tco_lucrativo',
      baseCents: 100_000,
    });
    await assertClientIsolation(createWithholdingSimulation, {
      tableCode: 'I',
      remunerationCents: 150_000,
      dependents: 0,
    });
    await assertClientIsolation(createImtSimulation, {
      tableCode: 'I',
      taxableValueCents: 20_000_000,
    });
    await assertClientIsolation(createIrcSimulation, {
      regimeCode: 'general',
      taxableCents: 10_000_000,
    });
  });

  it('create* grava sempre firmId do actor (nunca do body)', async () => {
    mock.method(clientsRepository, 'findClientById', async (firmId) => {
      assert.equal(firmId, 'firm-secure');
      return { id: 'c1' };
    });
    const seen = [];
    mock.method(fiscalCalculationsRepository, 'insertCalculation', async (data) => {
      seen.push(data);
      assert.equal(data.firmId, 'firm-secure');
      assert.notEqual(data.firmId, 'firm-evil');
      return { id: `id-${seen.length}`, ...data };
    });

    await createVatSimulation({
      firmId: 'firm-secure',
      actorId: 'u1',
      body: {
        direction: 'net_to_gross',
        amountCents: 1000,
        rateCode: 'normal',
        clientId: 'c1',
        firmId: 'firm-evil',
      },
    });
    await createIrsSimulation({
      firmId: 'firm-secure',
      actorId: 'u1',
      body: { taxableIncomeCents: 50_000, clientId: 'c1', firmId: 'firm-evil' },
    });
    await createSsSimulation({
      firmId: 'firm-secure',
      actorId: 'u1',
      body: { regimeCode: 'tco_ipss', baseCents: 80_000, clientId: 'c1', firmId: 'firm-evil' },
    });
    await createWithholdingSimulation({
      firmId: 'firm-secure',
      actorId: 'u1',
      body: {
        tableCode: 'I',
        remunerationCents: 120_000,
        dependents: 0,
        clientId: 'c1',
        firmId: 'firm-evil',
      },
    });
    await createImtSimulation({
      firmId: 'firm-secure',
      actorId: 'u1',
      body: {
        tableCode: 'III',
        taxableValueCents: 15_000_000,
        clientId: 'c1',
        firmId: 'firm-evil',
      },
    });
    await createIrcSimulation({
      firmId: 'firm-secure',
      actorId: 'u1',
      body: {
        regimeCode: 'sme',
        taxableCents: 8_000_000,
        clientId: 'c1',
        firmId: 'firm-evil',
      },
    });
    assert.equal(seen.length, 6);
    assert.deepEqual(
      seen.map((s) => s.calcType),
      ['vat_net_gross', 'irs_brackets', 'ss_contributions', 'irs_withholding', 'imt', 'irc'],
    );
  });

  it('getCalculation / listCalculations passam firmId ao repositório', async () => {
    let gotFirm = null;
    mock.method(fiscalCalculationsRepository, 'findById', async (firmId, id) => {
      gotFirm = firmId;
      assert.equal(id, 'calc-9');
      return null;
    });
    await assert.rejects(() => getCalculation({ firmId: 'firm-b', id: 'calc-9' }), (e) => e.statusCode === 404);
    assert.equal(gotFirm, 'firm-b');

    let listFirm = null;
    mock.method(fiscalCalculationsRepository, 'listForFirm', async (firmId, opts) => {
      listFirm = firmId;
      assert.equal(opts.calcType, 'irs_withholding');
      return [];
    });
    const out = await listCalculations({ firmId: 'firm-c', limit: 10, calcType: 'irs_withholding' });
    assert.equal(listFirm, 'firm-c');
    assert.deepEqual(out.items, []);
  });
});

describe('V10 fiscal — mapRow repository (sem leak de colunas cruas)', () => {
  it('mapRow normaliza snake_case → camelCase e omite null', () => {
    const mapped = mapRow({
      id: '1',
      firm_id: 'f1',
      client_id: null,
      calc_type: 'vat_net_gross',
      jurisdiction: 'PT',
      tax: 'IVA',
      rule_version: 'PT-IVA-2026.1',
      status: 'simulation',
      input_json: { a: 1 },
      result_json: { b: 2 },
      meta_json: {},
      created_by: 'u1',
      reviewed_by: null,
      reviewed_at: null,
      created_at: '2026-01-01',
      updated_at: '2026-01-01',
    });
    assert.equal(mapped.firmId, 'f1');
    assert.equal(mapped.clientId, null);
    assert.equal(mapped.calcType, 'vat_net_gross');
    assert.equal(mapped.ruleVersion, 'PT-IVA-2026.1');
    assert.deepEqual(mapped.input, { a: 1 });
    assert.equal(mapped.firm_id, undefined);
  });

  it('mapRow(null) → null', () => {
    assert.equal(mapRow(null), null);
  });
});
