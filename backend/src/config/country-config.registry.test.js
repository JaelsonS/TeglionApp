const test = require('node:test');
const assert = require('node:assert/strict');
const {
  resolveCountryConfig,
  listSupportedCountries,
  isSupportedCountry,
} = require('./country-config.registry');

test('resolveCountryConfig returns PT and BR', () => {
  assert.equal(resolveCountryConfig('pt').code, 'PT');
  assert.equal(resolveCountryConfig('BR').currency, 'BRL');
});

test('resolveCountryConfig rejects unknown country', () => {
  assert.throws(() => resolveCountryConfig('US'), (err) => err.statusCode === 400);
});

test('listSupportedCountries includes PT and BR', () => {
  const list = listSupportedCountries();
  assert.equal(list.length, 2);
  assert.ok(list.some((c) => c.code === 'PT'));
  assert.ok(list.some((c) => c.code === 'BR'));
});

test('isSupportedCountry', () => {
  assert.equal(isSupportedCountry('PT'), true);
  assert.equal(isSupportedCountry('XX'), false);
});
