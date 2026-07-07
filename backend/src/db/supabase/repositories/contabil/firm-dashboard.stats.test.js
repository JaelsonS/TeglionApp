const test = require('node:test');
const assert = require('node:assert/strict');
const {
  enrichObligations,
  partitionOpenObligations,
  computePortfolioHealth,
} = require('./firm-dashboard.stats');

test('partitionOpenObligations — críticas nas próximas 48h', () => {
  const now = new Date('2026-07-15T12:00:00Z');
  const in48h = new Date(now.getTime() + 48 * 60 * 60 * 1000);
  const obligations = [
    { status: 'PENDING', dueDate: '2026-07-16', clientId: 'c1' },
    { status: 'DELIVERED', dueDate: '2026-07-16', clientId: 'c1' },
    { status: 'PENDING', dueDate: '2026-07-01', clientId: 'c2' },
  ];
  const { overdue, criticalNext48h } = partitionOpenObligations(obligations, now, in48h);
  assert.equal(overdue.length, 1);
  assert.equal(criticalNext48h.length, 1);
});

test('computePortfolioHealth — clientes sem obrigações = ok', () => {
  const now = new Date('2026-07-15T12:00:00Z');
  const { portfolioHealth, totalClients } = computePortfolioHealth(
    [{ id: 'c1' }],
    [],
    now,
  );
  assert.equal(totalClients, 1);
  assert.equal(portfolioHealth.ok, 1);
  assert.equal(portfolioHealth.critical, 0);
});

test('enrichObligations — nomes de cliente', () => {
  const rows = [{ id: 'o1', client_id: 'c1', status: 'PENDING', due_date: '2026-07-20' }];
  const nameMap = new Map([['c1', 'Acme Lda']]);
  const taxMap = new Map([['c1', '123456789']]);
  const result = enrichObligations(rows, nameMap, taxMap);
  assert.equal(result[0].clientName, 'Acme Lda');
  assert.equal(result[0].clientTaxId, '123456789');
});
