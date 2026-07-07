const { test } = require('node:test');
const assert = require('node:assert/strict');
const { stripSensitiveValue } = require('../middlewares/response-sanitize.middleware');

test('stripSensitiveValue remove password e hashes', () => {
  const input = {
    user: {
      id: '1',
      email: 'a@b.com',
      password: 'secret',
      passwordHash: '$argon2...',
      password_hash: 'legacy',
    },
    items: [{ refreshToken: 'rt', name: 'ok' }],
  };
  const out = stripSensitiveValue(input);
  assert.equal(out.user.id, '1');
  assert.equal(out.user.password, undefined);
  assert.equal(out.user.passwordHash, undefined);
  assert.equal(out.user.password_hash, undefined);
  assert.equal(out.items[0].refreshToken, undefined);
  assert.equal(out.items[0].name, 'ok');
});
