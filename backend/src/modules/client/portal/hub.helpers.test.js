const test = require('node:test');
const assert = require('node:assert/strict');
const {
  normalizeDocumentList,
  buildMinimalHubResponse,
  computeFiscalHealth,
} = require('./hub.helpers');

test('normalizeDocumentList — array legado', () => {
  assert.equal(normalizeDocumentList([{ _id: '1' }]).length, 1);
});

test('normalizeDocumentList — objeto paginado', () => {
  assert.equal(normalizeDocumentList({ items: [{ _id: '1' }] }).length, 1);
});

test('normalizeDocumentList — null/undefined', () => {
  assert.deepEqual(normalizeDocumentList(null), []);
  assert.deepEqual(normalizeDocumentList(undefined), []);
});

test('buildMinimalHubResponse — estrutura mínima', () => {
  const minimal = buildMinimalHubResponse({ firmId: 'firm-1' });
  assert.equal(minimal.firm.id, 'firm-1');
  assert.deepEqual(minimal.obligations, []);
  assert.deepEqual(minimal.documents, []);
  assert.equal(minimal.degraded, true);
});

test('computeFiscalHealth — sem obrigações', () => {
  const now = new Date('2026-07-15T12:00:00Z');
  const result = computeFiscalHealth([], now);
  assert.equal(result.fiscalHealth, 'ok');
  assert.deepEqual(result.overdue, []);
  assert.equal(result.nextCritical, undefined);
});

test('computeFiscalHealth — atraso crítico', () => {
  const now = new Date('2026-07-15T12:00:00Z');
  const result = computeFiscalHealth(
    [{ status: 'OPEN', dueDate: '2026-07-01' }],
    now,
  );
  assert.equal(result.fiscalHealth, 'critical');
  assert.equal(result.overdue.length, 1);
});

test('computeFiscalHealth — atenção em 5 dias', () => {
  const now = new Date('2026-07-15T12:00:00Z');
  const result = computeFiscalHealth(
    [{ status: 'OPEN', dueDate: '2026-07-18' }],
    now,
  );
  assert.equal(result.fiscalHealth, 'attention');
});
