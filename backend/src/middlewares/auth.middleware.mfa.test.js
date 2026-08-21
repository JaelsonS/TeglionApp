require('../test/ensure-test-env');

const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const { signAccessToken, signMfaChallengeToken, MFA_CHALLENGE_TYP } = require('../config/jwt');
const { authMiddleware } = require('./auth.middleware');

function mockRes() {
  return {};
}

describe('authMiddleware rejeita tokens especiais', () => {
  test('rejeita typ=mfa-challenge (não é sessão)', async () => {
    const { token } = signMfaChallengeToken({
      id: '11111111-1111-4111-8111-111111111111',
      firmId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
      purpose: 'mfa_verify',
    });
    const req = {
      headers: { authorization: `Bearer ${token}` },
      cookies: { accessToken: token },
      originalUrl: '/api/auth/me',
    };
    let err = null;
    await new Promise((resolve) => {
      authMiddleware(req, mockRes(), (e) => {
        err = e;
        resolve();
      });
    });
    assert.ok(err);
    assert.equal(err.statusCode, 401);
  });

  test('aceita access token normal via cookie', async () => {
    const token = signAccessToken({
      id: '11111111-1111-4111-8111-111111111111',
      role: 'FIRM_OWNER',
      firmId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    });
    const req = {
      headers: {},
      cookies: { accessToken: token },
      originalUrl: '/api/firm/clients',
    };
    let nextCalled = false;
    let err = null;
    await new Promise((resolve) => {
      authMiddleware(req, mockRes(), (e) => {
        err = e;
        nextCalled = !e;
        resolve();
      });
    });
    assert.equal(err, undefined);
    assert.equal(nextCalled, true);
    assert.equal(req.user.id, '11111111-1111-4111-8111-111111111111');
    assert.notEqual(req.user.typ, MFA_CHALLENGE_TYP);
  });
});
