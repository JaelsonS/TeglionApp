const { describe, it, mock, beforeEach } = require('node:test');
const assert = require('node:assert/strict');

const { buildMonthMatrix, monthBounds } = require('./obligation-month-matrix');
const monthMatrixService = require('./obligation-month-matrix.service');

describe('month-matrix — casos limite', () => {
  it('fevereiro bissexto 2024 e não-bissexto 2026', () => {
    assert.equal(monthBounds('2024-02').dueDateLte, '2024-02-29');
    assert.equal(monthBounds('2026-02').dueDateLte, '2026-02-28');
  });

  it('aceita snake_case due_date / client_id do mapper', () => {
    const matrix = buildMonthMatrix(
      [
        {
          id: '1',
          type: 'IVA',
          due_date: '2026-10-15',
          status: 'DELIVERED',
          client_id: 'c1',
          clients: { display_name: 'Alpha', tax_id: '123' },
        },
        {
          id: '2',
          type: 'IVA',
          due_date: '2026-10-15',
          status: 'PENDING',
          client_id: 'c2',
          clients: { display_name: 'Beta' },
        },
      ],
      '2026-10',
    );
    assert.equal(matrix.groups.length, 1);
    assert.equal(matrix.groups[0].ratioLabel, '1/2');
    assert.equal(matrix.groups[0].items[0].clientName, 'Alpha');
  });

  it('não conta CANCELLED no total nem no treated', () => {
    const matrix = buildMonthMatrix(
      [
        { id: '1', type: 'SS', dueDate: '2026-11-20', status: 'CANCELLED', clientName: 'X' },
        { id: '2', type: 'SS', dueDate: '2026-11-20', status: 'DELIVERED', clientName: 'Y' },
      ],
      '2026-11',
    );
    assert.equal(matrix.groups[0].total, 1);
    assert.equal(matrix.groups[0].treated, 1);
  });

  it('disclaimer presente e sem inventar grupos vazios', () => {
    const matrix = buildMonthMatrix([], '2026-10');
    assert.equal(matrix.groups.length, 0);
    assert.ok(matrix.note.includes('Portal das Finanças'));
  });
});

describe('month-matrix.service — isolamento e validação', () => {
  beforeEach(() => {
    mock.restoreAll();
  });

  it('rejeita yearMonth inválido com 400', async () => {
    await assert.rejects(
      () => monthMatrixService.getMonthMatrix({ firmId: 'f1', yearMonth: '2026-99' }),
      (err) => err.statusCode === 400,
    );
  });

  it('lista obrigações só com firmId e janela do mês', async () => {
    const { getRepository } = require('../../db/supabase/repositories');
    const repo = getRepository();
    let called = null;
    mock.method(repo, 'maybeSyncOverdueObligations', async () => true);
    mock.method(repo, 'listObligationsEnriched', async (params) => {
      called = params;
      assert.equal(params.firmId, 'firm-only');
      return [
        {
          id: 'ob1',
          type: 'IVA',
          dueDate: '2026-10-20',
          status: 'PENDING',
          clientName: 'C',
        },
      ];
    });

    const matrix = await monthMatrixService.getMonthMatrix({
      firmId: 'firm-only',
      yearMonth: '2026-10',
    });
    assert.equal(called.dueDateGte, '2026-10-01');
    assert.equal(called.dueDateLte, '2026-10-31');
    assert.equal(matrix.groups[0].total, 1);
  });
});
