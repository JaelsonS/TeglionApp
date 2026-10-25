const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { buildMonthMatrix, monthBounds, assertYearMonth } = require('./obligation-month-matrix');

describe('obligation-month-matrix', () => {
  it('monthBounds para outubro', () => {
    const b = monthBounds('2026-10');
    assert.equal(b.dueDateGte, '2026-10-01');
    assert.equal(b.dueDateLte, '2026-10-31');
  });

  it('assertYearMonth rejeita inválido', () => {
    assert.throws(() => assertYearMonth('2026-13'), /inválido/i);
  });

  it('agrupa IVA no dia 20 com 3/7', () => {
    const items = [
      { id: '1', type: 'IVA', dueDate: '2026-10-20', status: 'DELIVERED', clientId: 'a', clientName: 'A', title: 'IVA mensal' },
      { id: '2', type: 'IVA', dueDate: '2026-10-20', status: 'DELIVERED', clientId: 'b', clientName: 'B', title: 'IVA mensal' },
      { id: '3', type: 'IVA', dueDate: '2026-10-20', status: 'DELIVERED', clientId: 'c', clientName: 'C', title: 'IVA mensal' },
      { id: '4', type: 'IVA', dueDate: '2026-10-20', status: 'PENDING', clientId: 'd', clientName: 'D', title: 'IVA mensal' },
      { id: '5', type: 'IVA', dueDate: '2026-10-20', status: 'PENDING', clientId: 'e', clientName: 'E', title: 'IVA mensal' },
      { id: '6', type: 'IVA', dueDate: '2026-10-20', status: 'OVERDUE', clientId: 'f', clientName: 'F', title: 'IVA mensal' },
      { id: '7', type: 'IVA', dueDate: '2026-10-20', status: 'WAITING_CLIENT', clientId: 'g', clientName: 'G', title: 'IVA mensal' },
      { id: '8', type: 'IVA', dueDate: '2026-10-20', status: 'CANCELLED', clientId: 'h', clientName: 'H', title: 'IVA mensal' },
      { id: '9', type: 'SS', dueDate: '2026-10-25', status: 'PENDING', clientId: 'a', clientName: 'A', title: 'SS' },
    ];
    const matrix = buildMonthMatrix(items, '2026-10');
    assert.equal(matrix.groups.length, 2);
    const iva = matrix.groups.find((g) => g.type === 'IVA');
    assert.equal(iva.treated, 3);
    assert.equal(iva.total, 7);
    assert.equal(iva.ratioLabel, '3/7');
    assert.equal(iva.complete, false);
    assert.equal(iva.overdue, 1);
    assert.equal(iva.waitingClient, 1);
    assert.equal(matrix.summary.treated, 3);
  });

  it('grupo completo quando todos DELIVERED', () => {
    const matrix = buildMonthMatrix(
      [
        { id: '1', type: 'IRS', dueDate: '2026-07-10', status: 'DELIVERED', clientName: 'A' },
        { id: '2', type: 'IRS', dueDate: '2026-07-10', status: 'DELIVERED', clientName: 'B' },
      ],
      '2026-07',
    );
    assert.equal(matrix.groups[0].ratioLabel, '2/2');
    assert.equal(matrix.groups[0].complete, true);
    assert.equal(matrix.summary.completeGroups, 1);
  });

  it('ignora obrigações fora do mês', () => {
    const matrix = buildMonthMatrix(
      [{ id: '1', type: 'IVA', dueDate: '2026-09-20', status: 'PENDING', clientName: 'A' }],
      '2026-10',
    );
    assert.equal(matrix.groups.length, 0);
  });
});
