const test = require('node:test');
const assert = require('node:assert/strict');

const { isAccessTokenActive } = require('./service-inquiries.repository');

test('isAccessTokenActive: null/undefined nunca é válido', () => {
  assert.equal(isAccessTokenActive(null), false);
  assert.equal(isAccessTokenActive(undefined), false);
});

test('isAccessTokenActive: sem expiração nem revogação, é válido', () => {
  assert.equal(isAccessTokenActive({ accessTokenExpiresAt: null, accessTokenRevokedAt: null }), true);
});

test('isAccessTokenActive: revogado nunca é válido, mesmo sem expirar', () => {
  const future = new Date(Date.now() + 60_000).toISOString();
  assert.equal(
    isAccessTokenActive({ accessTokenExpiresAt: future, accessTokenRevokedAt: new Date().toISOString() }),
    false,
  );
});

test('isAccessTokenActive: expirado no passado não é válido', () => {
  const past = new Date(Date.now() - 60_000).toISOString();
  assert.equal(isAccessTokenActive({ accessTokenExpiresAt: past, accessTokenRevokedAt: null }), false);
});

test('isAccessTokenActive: expira no futuro continua válido', () => {
  const future = new Date(Date.now() + 60_000).toISOString();
  assert.equal(isAccessTokenActive({ accessTokenExpiresAt: future, accessTokenRevokedAt: null }), true);
});
