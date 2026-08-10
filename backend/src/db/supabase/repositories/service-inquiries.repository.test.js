const test = require('node:test');
const assert = require('node:assert/strict');

const { isAccessTokenActive, encryptAnswers, decryptAnswers } = require('./service-inquiries.repository');

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

test('encryptAnswers/decryptAnswers: null/undefined não geram nada para encriptar', () => {
  assert.equal(encryptAnswers(null), null);
  assert.equal(encryptAnswers(undefined), null);
  assert.equal(decryptAnswers(null), null);
});

test('encryptAnswers/decryptAnswers: faz round-trip fiel, incluindo tipos aninhados', () => {
  const original = { q1: 'sim', q2: ['a', 'b'], q3: 'Rendimento: 1234,56€ — NIF 123456789' };
  const encrypted = encryptAnswers(original);
  assert.equal(typeof encrypted, 'string');
  assert.deepEqual(decryptAnswers(encrypted), original);
});

test('encryptAnswers: o valor guardado nunca contém o texto original em claro', () => {
  const original = { nif: '123456789', nota: 'informação sensível do cliente' };
  const encrypted = encryptAnswers(original);
  assert.equal(encrypted.includes('123456789'), false);
  assert.equal(encrypted.includes('informação sensível'), false);
  assert.ok(encrypted.startsWith('enc:v1:'));
});

test('encryptAnswers: duas chamadas com o mesmo conteúdo produzem ciphertexts diferentes (IV aleatório)', () => {
  const original = { q1: 'sim' };
  const first = encryptAnswers(original);
  const second = encryptAnswers(original);
  assert.notEqual(first, second);
  assert.deepEqual(decryptAnswers(first), decryptAnswers(second));
});
