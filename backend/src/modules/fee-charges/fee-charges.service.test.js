const { describe, it, mock } = require('node:test');
const assert = require('node:assert/strict');

const clientsRepository = require('../../db/supabase/repositories/clients.repository');
const feeChargesRepository = require('../../db/supabase/repositories/client-fee-charges.repository');

const {
  isOverdue,
  dueDateForMonth,
  summarizeCharges,
  assertYearMonth,
  generateCharges,
  patchCharge,
  getYearMap,
} = require('./fee-charges.service');

describe('fee-charges helpers', () => {
  it('dueDateForMonth respeita dia 1–28', () => {
    assert.equal(dueDateForMonth('2026-02', 28), '2026-02-28');
    assert.equal(dueDateForMonth('2026-01', 1), '2026-01-01');
  });

  it('assertYearMonth rejeita inválido', () => {
    assert.throws(() => assertYearMonth('2026-13'), /Período inválido/);
    assert.equal(assertYearMonth('2026-07'), '2026-07');
  });

  it('isOverdue só para confirmed/sent com due passado', () => {
    assert.equal(
      isOverdue({ status: 'draft', dueDate: '2020-01-01' }, '2026-10-25'),
      false,
    );
    assert.equal(
      isOverdue({ status: 'paid', dueDate: '2020-01-01' }, '2026-10-25'),
      false,
    );
    assert.equal(
      isOverdue({ status: 'sent', dueDate: '2026-10-01' }, '2026-10-25'),
      true,
    );
    assert.equal(
      isOverdue({ status: 'confirmed', dueDate: '2026-11-01' }, '2026-10-25'),
      false,
    );
  });

  it('summarizeCharges agrega saldos', () => {
    const s = summarizeCharges(
      [
        { status: 'paid', amountCents: 10000, dueDate: '2026-01-01' },
        { status: 'sent', amountCents: 5000, dueDate: '2026-01-01' },
        { status: 'draft', amountCents: 2000, dueDate: '2026-02-01' },
      ],
      '2026-10-25',
    );
    assert.equal(s.paidCents, 10000);
    assert.equal(s.openCents, 5000);
    assert.equal(s.overdueCents, 5000);
    assert.equal(s.draftCents, 2000);
  });
});

describe('fee-charges generate + isolation', () => {
  it('gera só clientes com avença activa e ignora já existentes', async () => {
    mock.method(clientsRepository, 'listClients', async () => [
      {
        id: 'c1',
        displayName: 'A',
        retainerActive: true,
        retainerAmountCents: 15000,
        retainerCurrency: 'EUR',
        retainerDueDay: 10,
      },
      {
        id: 'c2',
        displayName: 'B',
        retainerActive: false,
        retainerAmountCents: 15000,
        retainerDueDay: 10,
      },
      {
        id: 'c3',
        displayName: 'C',
        retainerActive: true,
        retainerAmountCents: 20000,
        retainerDueDay: 5,
      },
    ]);
    mock.method(feeChargesRepository, 'findOpenCharge', async (_f, clientId) =>
      clientId === 'c3' ? { id: 'existing' } : null,
    );
    mock.method(feeChargesRepository, 'insertCharge', async (data) => ({
      id: `new-${data.clientId}`,
      ...data,
    }));

    const result = await generateCharges({
      firmId: 'firm-a',
      yearMonth: '2026-10',
      actorId: 'u1',
    });
    assert.equal(result.createdCount, 1);
    assert.equal(result.created[0].clientId, 'c1');
    assert.equal(result.skippedCount, 1);
    assert.equal(result.skipped[0].clientId, 'c3');
  });

  it('patchCharge recusa outro escritório (404)', async () => {
    mock.method(feeChargesRepository, 'findChargeById', async () => null);
    await assert.rejects(
      () => patchCharge({ firmId: 'firm-b', chargeId: 'x', patch: { status: 'paid' } }),
      (err) => err.statusCode === 404,
    );
  });

  it('getYearMap nunca mistura firmas — só lista do firmId pedido', async () => {
    mock.method(clientsRepository, 'listClients', async (firmId) => {
      assert.equal(firmId, 'firm-a');
      return [
        {
          id: 'c1',
          displayName: 'Cliente A',
          taxId: '123',
          retainerActive: true,
          retainerAmountCents: 1000,
          retainerCurrency: 'EUR',
          retainerDueDay: 1,
        },
      ];
    });
    mock.method(feeChargesRepository, 'listChargesForYear', async (firmId) => {
      assert.equal(firmId, 'firm-a');
      return [
        {
          id: 'ch1',
          firmId: 'firm-a',
          clientId: 'c1',
          yearMonth: '2026-01',
          amountCents: 1000,
          status: 'paid',
          dueDate: '2026-01-01',
        },
      ];
    });

    const map = await getYearMap({
      firmId: 'firm-a',
      year: 2026,
      connectStatus: { ready: false, configured: true },
    });
    assert.equal(map.rows.length, 1);
    assert.equal(map.connect.optional, true);
    assert.ok(map.connect.nudge);
    assert.equal(map.summary.paidCents, 1000);
  });
});
