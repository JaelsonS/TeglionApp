const test = require('node:test');
const assert = require('node:assert/strict');

const { readJwtRole, assertServiceRoleKey } = require('./client');

function fakeJwt(payload) {
  const h = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const p = Buffer.from(JSON.stringify(payload)).toString('base64url');
  return `${h}.${p}.sig`;
}

test('readJwtRole: service_role JWT', () => {
  assert.equal(readJwtRole(fakeJwt({ role: 'service_role', ref: 'x' })), 'service_role');
});

test('readJwtRole: anon JWT', () => {
  assert.equal(readJwtRole(fakeJwt({ role: 'anon', ref: 'x' })), 'anon');
});

test('readJwtRole: sb_secret_ prefix', () => {
  assert.equal(readJwtRole('sb_secret_example'), 'service_role');
});

test('assertServiceRoleKey: rejeita anon', () => {
  const r = assertServiceRoleKey(fakeJwt({ role: 'anon' }));
  assert.equal(r.ok, false);
  assert.match(r.message, /não é a service_role/);
  assert.match(r.message, /anon/);
});

test('assertServiceRoleKey: aceita service_role', () => {
  const r = assertServiceRoleKey(fakeJwt({ role: 'service_role' }));
  assert.equal(r.ok, true);
  assert.equal(r.role, 'service_role');
});
