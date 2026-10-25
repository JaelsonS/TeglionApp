const { describe, it, mock, beforeEach } = require('node:test');
const assert = require('node:assert/strict');

const clientsRepository = require('../../db/supabase/repositories/clients.repository');
const fiscalCalculationsRepository = require('../../db/supabase/repositories/fiscal-calculations.repository');
const {
  runSimulate,
  runIrsSimulate,
  runSsSimulate,
  runWithholdingSimulate,
  createVatSimulation,
  createIrsSimulation,
  createSsSimulation,
  createWithholdingSimulation,
  getCalculation,
  getVatCatalog,
  getIrsCatalog,
  getSsCatalog,
  getWithholdingCatalog,
} = require('./fiscal-calculations.service');

describe('fiscal-calculations.service', () => {
  beforeEach(() => {
    mock.restoreAll();
  });

  it('runSimulate 23% líquido', () => {
    const s = runSimulate({
      direction: 'net_to_gross',
      amountCents: 1000,
      rateCode: 'normal',
    });
    assert.equal(s.result.grossCents, 1230);
  });

  it('runIrs / runSs / runWithholding devolvem resultados coerentes', () => {
    const irs = runIrsSimulate({ taxableIncomeCents: 1_000_000, includeSolidarity: false });
    assert.equal(irs.result.taxCents, 130_306);
    const ss = runSsSimulate({ regimeCode: 'tco_lucrativo', baseCents: 100_000 });
    assert.equal(ss.result.totalCents, 34_750);
    const wh = runWithholdingSimulate({
      tableCode: 'I',
      remunerationCents: 150_000,
      dependents: 0,
    });
    assert.equal(wh.result.withholdingCents, 16_817);
  });

  it('catálogos expõem defaultVersion e packs', () => {
    for (const cat of [getVatCatalog(), getIrsCatalog(), getSsCatalog(), getWithholdingCatalog()]) {
      assert.ok(cat.defaultVersion);
      assert.ok(Array.isArray(cat.packs) && cat.packs.length >= 1);
      assert.ok(cat.disclaimer);
    }
  });

  it('createVatSimulation exige cliente do mesmo escritório', async () => {
    mock.method(clientsRepository, 'findClientById', async () => null);
    await assert.rejects(
      () =>
        createVatSimulation({
          firmId: 'firm-a',
          actorId: 'u1',
          body: {
            direction: 'net_to_gross',
            amountCents: 1000,
            rateCode: 'normal',
            clientId: 'c-other',
          },
        }),
      (err) => err.statusCode === 404,
    );
  });

  it('createVatSimulation grava com firmId', async () => {
    mock.method(clientsRepository, 'findClientById', async (firmId, id) => {
      assert.equal(firmId, 'firm-a');
      return { id, displayName: 'X' };
    });
    mock.method(fiscalCalculationsRepository, 'insertCalculation', async (data) => {
      assert.equal(data.firmId, 'firm-a');
      assert.equal(data.ruleVersion, 'PT-IVA-2026.1');
      assert.equal(data.result.grossCents, 1230);
      return { id: 'calc-1', ...data };
    });

    const out = await createVatSimulation({
      firmId: 'firm-a',
      actorId: 'u1',
      body: {
        direction: 'net_to_gross',
        amountCents: 1000,
        rateCode: 'normal',
        clientId: 'c1',
      },
    });
    assert.equal(out.calculation.id, 'calc-1');
  });

  it('createIrsSimulation / createSsSimulation / createWithholdingSimulation gravam firmId', async () => {
    mock.method(clientsRepository, 'findClientById', async () => ({ id: 'c1' }));
    const types = [];
    mock.method(fiscalCalculationsRepository, 'insertCalculation', async (data) => {
      assert.equal(data.firmId, 'firm-z');
      types.push(data.calcType);
      return { id: data.calcType, ...data };
    });
    await createIrsSimulation({
      firmId: 'firm-z',
      actorId: 'u1',
      body: { taxableIncomeCents: 100_000, clientId: 'c1' },
    });
    await createSsSimulation({
      firmId: 'firm-z',
      actorId: 'u1',
      body: { regimeCode: 'ti_geral', baseCents: 100_000, clientId: 'c1' },
    });
    await createWithholdingSimulation({
      firmId: 'firm-z',
      actorId: 'u1',
      body: { tableCode: 'I', remunerationCents: 100_000, dependents: 0, clientId: 'c1' },
    });
    assert.deepEqual(types, ['irs_brackets', 'ss_contributions', 'irs_withholding']);
  });

  it('getCalculation 404 cross-tenant', async () => {
    mock.method(fiscalCalculationsRepository, 'findById', async () => null);
    await assert.rejects(
      () => getCalculation({ firmId: 'firm-b', id: 'calc-1' }),
      (err) => err.statusCode === 404,
    );
  });
});
