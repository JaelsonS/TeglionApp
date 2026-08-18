const { test } = require('node:test');
const assert = require('node:assert/strict');
const { stripSensitiveValue } = require('../middlewares/response-sanitize.middleware');

test('stripSensitiveValue remove password e hashes', () => {
  const input = {
    user: {
      id: '1',
      email: 'a@b.com',
      password: 'secret',
      currentPassword: 'step-up',
      passwordHash: '$argon2...',
      password_hash: 'legacy',
      secret_enc: 'enc:v1:cipher',
    },
    items: [{ refreshToken: 'rt', name: 'ok' }],
  };
  const out = stripSensitiveValue(input);
  assert.equal(out.user.id, '1');
  assert.equal(out.user.password, undefined);
  assert.equal(out.user.currentPassword, undefined);
  assert.equal(out.user.secret_enc, undefined);
  assert.equal(out.user.passwordHash, undefined);
  assert.equal(out.user.password_hash, undefined);
  assert.equal(out.items[0].refreshToken, undefined);
  assert.equal(out.items[0].name, 'ok');
});

test('stripSensitiveValue preserva revealedValue do cofre (chave deliberada)', () => {
  const out = stripSensitiveValue({
    accessId: 'abc',
    revealedValue: 'portal-secret',
    password: 'must-go',
  });
  assert.equal(out.revealedValue, 'portal-secret');
  assert.equal(out.password, undefined);
});

test('stripSensitiveValue remove accessToken JWT mas preserva intakeToken do portal', () => {
  const out = stripSensitiveValue({
    ok: true,
    accessToken: 'jwt-must-go',
    intakeToken: 'portal-opaque-ok',
  });
  assert.equal(out.accessToken, undefined);
  assert.equal(out.intakeToken, 'portal-opaque-ok');
});
