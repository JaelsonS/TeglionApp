const { describe, it, mock } = require('node:test');
const assert = require('node:assert/strict');

const clientsRepository = require('../../db/supabase/repositories/clients.repository');
const fiscalCalculationsRepository = require('../../db/supabase/repositories/fiscal-calculations.repository');
const {
  runSimulate,
  createVatSimulation,
  getCalculation,
} = require('./fiscal-calculations.service');

describe('fiscal-calculations.service', () => {
  it('runSimulate 23% líquido', () => {
    const s = runSimulate({
      direction: 'net_to_gross',
      amountCents: 1000,
      rateCode: 'normal',
    });
    assert.equal(s.result.grossCents, 1230);
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

  it('getCalculation 404 cross-tenant', async () => {
    mock.method(fiscalCalculationsRepository, 'findById', async () => null);
    await assert.rejects(
      () => getCalculation({ firmId: 'firm-b', id: 'calc-1' }),
      (err) => err.statusCode === 404,
    );
  });
});
