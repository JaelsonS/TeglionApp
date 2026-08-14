const assert = require('assert');
const {
  createPendingRegistrationToken,
  verifyToken,
  readPendingRegistration,
} = require('./oauth-pending-cookie');

function test(name, fn) {
  try {
    fn();
    console.log(`ok - ${name}`);
  } catch (err) {
    console.error(`fail - ${name}`);
    throw err;
  }
}

test('signs and verifies pending registration token', () => {
  const token = createPendingRegistrationToken({
    email: 'owner@example.com',
    ownerName: 'Owner',
    googleSub: 'google-sub-1',
    countryCode: 'PT',
  });
  const payload = verifyToken(token);
  assert.ok(payload);
  assert.strictEqual(payload.email, 'owner@example.com');
  assert.strictEqual(payload.googleSub, 'google-sub-1');
});

test('reads pending token from X-OAuth-Pending header', () => {
  const token = createPendingRegistrationToken({
    email: 'header@example.com',
    ownerName: 'H',
    googleSub: 'sub-h',
  });
  const pending = readPendingRegistration({
    cookies: {},
    get: (name) => (String(name).toLowerCase() === 'x-oauth-pending' ? token : undefined),
    headers: {},
    query: {},
    body: {},
  });
  assert.strictEqual(pending.email, 'header@example.com');
});

test('reads pending token from query string', () => {
  const token = createPendingRegistrationToken({
    email: 'query@example.com',
    ownerName: 'Q',
    googleSub: 'sub-q',
  });
  const pending = readPendingRegistration({
    cookies: {},
    get: () => undefined,
    headers: {},
    query: { pending: token },
    body: {},
  });
  assert.strictEqual(pending.email, 'query@example.com');
});

test('rejects tampered token', () => {
  const token = createPendingRegistrationToken({
    email: 'x@example.com',
    ownerName: 'X',
    googleSub: 'sub-x',
  });
  assert.strictEqual(verifyToken(`${token}x`), null);
});

console.log('oauth-pending-cookie tests passed');
