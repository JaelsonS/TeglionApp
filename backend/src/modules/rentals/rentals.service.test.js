const { describe, it, mock } = require('node:test');
const assert = require('node:assert/strict');

const clientsRepository = require('../../db/supabase/repositories/clients.repository');
const rentalsRepository = require('../../db/supabase/repositories/client-rentals.repository');

const {
  isOverdue,
  dueDateForMonth,
  summarizeReceipts,
  assertYearMonth,
  generateReceipts,
  patchReceipt,
  createProperty,
  createLease,
  listOverview,
  INTERNAL_DISCLAIMER,
} = require('./rentals.service');

describe('rentals helpers', () => {
  it('dueDateForMonth respeita dia 1–28', () => {
    assert.equal(dueDateForMonth('2026-02', 28), '2026-02-28');
    assert.equal(dueDateForMonth('2026-01', 1), '2026-01-01');
  });

  it('assertYearMonth rejeita inválido', () => {
    assert.throws(() => assertYearMonth('2026-13'), /Período inválido/);
    assert.equal(assertYearMonth('2026-07'), '2026-07');
  });

  it('isOverdue só para issued com due passado', () => {
    assert.equal(isOverdue({ status: 'draft', dueDate: '2020-01-01' }, '2026-10-25'), false);
    assert.equal(isOverdue({ status: 'paid', dueDate: '2020-01-01' }, '2026-10-25'), false);
    assert.equal(isOverdue({ status: 'issued', dueDate: '2026-10-01' }, '2026-10-25'), true);
    assert.equal(isOverdue({ status: 'issued', dueDate: '2026-11-01' }, '2026-10-25'), false);
  });

  it('summarizeReceipts agrega saldos', () => {
    const s = summarizeReceipts(
      [
        { status: 'paid', amountCents: 10000, dueDate: '2026-01-01' },
        { status: 'issued', amountCents: 5000, dueDate: '2026-01-01' },
        { status: 'draft', amountCents: 2000, dueDate: '2026-02-01' },
      ],
      '2026-10-25',
    );
    assert.equal(s.paidCents, 10000);
    assert.equal(s.openCents, 5000);
    assert.equal(s.overdueCents, 5000);
    assert.equal(s.draftCents, 2000);
  });

  it('disclaimer interno está presente', () => {
    assert.match(INTERNAL_DISCLAIMER, /INTERNOS/i);
    assert.match(INTERNAL_DISCLAIMER, /AT/i);
  });
});

describe('rentals generate + isolation', () => {
  it('gera só contratos activos e ignora já existentes / fora do período', async () => {
    mock.method(rentalsRepository, 'listActiveLeases', async () => [
      {
        id: 'l1',
        monthlyRentCents: 80000,
        currency: 'EUR',
        rentDueDay: 5,
        startDate: '2026-01-01',
        endDate: null,
        status: 'active',
      },
      {
        id: 'l2',
        monthlyRentCents: 90000,
        currency: 'EUR',
        rentDueDay: 1,
        startDate: '2027-01-01',
        endDate: null,
        status: 'active',
      },
      {
        id: 'l3',
        monthlyRentCents: 70000,
        currency: 'EUR',
        rentDueDay: 10,
        startDate: '2025-01-01',
        endDate: null,
        status: 'active',
      },
    ]);
    mock.method(rentalsRepository, 'findOpenReceipt', async (_f, leaseId) =>
      leaseId === 'l3' ? { id: 'existing' } : null,
    );
    mock.method(rentalsRepository, 'insertReceipt', async (data) => ({
      id: `new-${data.leaseId}`,
      ...data,
    }));

    const result = await generateReceipts({
      firmId: 'firm-a',
      yearMonth: '2026-10',
      actorId: 'u1',
    });
    assert.equal(result.createdCount, 1);
    assert.equal(result.created[0].leaseId, 'l1');
    assert.equal(result.skippedCount, 2);
    assert.ok(result.skipped.some((s) => s.leaseId === 'l2' && s.reason === 'NOT_STARTED'));
    assert.ok(result.skipped.some((s) => s.leaseId === 'l3' && s.reason === 'EXISTS'));
    assert.match(result.disclaimer, /INTERNOS/i);
  });

  it('patchReceipt recusa outro escritório (404)', async () => {
    mock.method(rentalsRepository, 'findReceiptById', async () => null);
    await assert.rejects(
      () => patchReceipt({ firmId: 'firm-b', receiptId: 'x', patch: { status: 'paid' } }),
      (err) => err.statusCode === 404,
    );
  });

  it('createProperty recusa cliente de outro firm (404)', async () => {
    mock.method(clientsRepository, 'findClientById', async () => null);
    await assert.rejects(
      () =>
        createProperty({
          firmId: 'firm-a',
          payload: { clientId: 'c-other', label: 'T2 Centro' },
        }),
      (err) => err.statusCode === 404,
    );
  });

  it('createLease recusa imóvel de outro firm (404)', async () => {
    mock.method(rentalsRepository, 'findPropertyById', async () => null);
    await assert.rejects(
      () =>
        createLease({
          firmId: 'firm-a',
          propertyId: 'p-x',
          payload: {
            tenantDisplayName: 'Inquilino',
            startDate: '2026-01-01',
            monthlyRentCents: 50000,
          },
        }),
      (err) => err.statusCode === 404,
    );
  });

  it('listOverview nunca mistura firmas — só lista do firmId pedido', async () => {
    mock.method(rentalsRepository, 'listProperties', async (firmId) => {
      assert.equal(firmId, 'firm-a');
      return [
        {
          id: 'p1',
          firmId: 'firm-a',
          clientId: 'c1',
          label: 'Apartamento A',
          status: 'active',
        },
      ];
    });
    mock.method(rentalsRepository, 'listLeasesForFirm', async (firmId) => {
      assert.equal(firmId, 'firm-a');
      return [
        {
          id: 'l1',
          firmId: 'firm-a',
          propertyId: 'p1',
          tenantDisplayName: 'João',
          monthlyRentCents: 80000,
          rentDueDay: 1,
          status: 'active',
          startDate: '2026-01-01',
        },
      ];
    });
    mock.method(rentalsRepository, 'listReceiptsForYear', async (firmId) => {
      assert.equal(firmId, 'firm-a');
      return [
        {
          id: 'r1',
          firmId: 'firm-a',
          leaseId: 'l1',
          yearMonth: '2026-01',
          amountCents: 80000,
          status: 'paid',
          dueDate: '2026-01-01',
        },
      ];
    });
    mock.method(clientsRepository, 'listClients', async (firmId) => {
      assert.equal(firmId, 'firm-a');
      return [{ id: 'c1', displayName: 'Senhorio A', taxId: '123' }];
    });

    const overview = await listOverview({ firmId: 'firm-a', year: 2026 });
    assert.equal(overview.rows.length, 1);
    assert.equal(overview.summary.paidCents, 80000);
    assert.match(overview.disclaimer, /INTERNOS/i);
  });

  it('listOverview: imóvel arquivado sai da lista e do KPI pago', async () => {
    mock.method(rentalsRepository, 'listProperties', async () => []);
    mock.method(rentalsRepository, 'listLeasesForFirm', async () => [
      {
        id: 'l1',
        firmId: 'firm-a',
        propertyId: 'p-archived',
        tenantDisplayName: 'João',
        monthlyRentCents: 80000,
        rentDueDay: 1,
        status: 'active',
        startDate: '2026-01-01',
      },
    ]);
    mock.method(rentalsRepository, 'listReceiptsForYear', async () => [
      {
        id: 'r1',
        firmId: 'firm-a',
        leaseId: 'l1',
        yearMonth: '2026-01',
        amountCents: 80000,
        status: 'paid',
        dueDate: '2026-01-01',
      },
    ]);
    mock.method(clientsRepository, 'listClients', async () => [
      { id: 'c1', displayName: 'Senhorio A', taxId: '123' },
    ]);

    const overview = await listOverview({ firmId: 'firm-a', year: 2026 });
    assert.equal(overview.rows.length, 0);
    assert.equal(overview.summary.paidCents, 0);
    assert.equal(overview.summary.openCents, 0);
  });
});
