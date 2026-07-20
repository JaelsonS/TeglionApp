require('../../test/ensure-test-env');

const { test } = require('node:test');
const assert = require('node:assert/strict');

const { searchLocal, catalogSize, _test } = require('./cae-catalog.service');

test('catálogo CAE carrega classes do INE', () => {
  assert.ok(catalogSize() > 500);
});

test('pesquisa por prefixo de código', () => {
  const items = searchLocal('620');
  assert.ok(items.length > 0);
  assert.ok(items.every((i) => i.code.startsWith('620') || '620'.startsWith(i.code.slice(0, 3))));
  assert.ok(items[0].value.includes('—'));
});

test('pesquisa por descrição ignora acentos', () => {
  const items = searchLocal('programacao');
  assert.ok(items.some((i) => /programa/i.test(i.label) || i.code.startsWith('62')));
});

test('pesquisa por token INE (padaria)', () => {
  const items = searchLocal('padaria');
  assert.ok(items.some((i) => i.code === '1071' || /panifica|pastelaria|p[aã]o/i.test(i.label)));
});

test('código de 5 dígitos encontra a classe de 4', () => {
  const items = searchLocal('62010');
  assert.ok(items.some((i) => i.code === '6201' || i.code.startsWith('620')));
});

test('mergeResults deduplica por código', () => {
  const merged = _test.mergeResults(
    [{ code: '6201', label: 'A', value: '6201 — A', source: 'catalog' }],
    [
      { code: '6201', label: 'A', value: '6201 — A', source: 'ine' },
      { code: '6202', label: 'B', value: '6202 — B', source: 'ine' },
    ],
    10,
  );
  assert.equal(merged.length, 2);
  assert.equal(merged[0].code, '6201');
  assert.equal(merged[1].code, '6202');
});
