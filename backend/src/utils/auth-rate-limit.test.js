require('../test/ensure-test-env');

const { test, describe } = require('node:test');
const assert = require('node:assert/strict');

const { signMfaChallengeToken, MFA_PURPOSES } = require('../config/jwt');
const { mfaChallengeKey } = require('./auth-rate-limit');

function reqWith({ ip = '203.0.113.10', body = {}, headers = {}, cookies = {}, user } = {}) {
  return { ip, body, headers, cookies, user };
}

describe('mfaChallengeKey (F-04 — anti-multiplicação por challengeToken novo)', () => {
  test('dois challenges diferentes do MESMO utilizador partilham a mesma chave', () => {
    const { token: tokenA } = signMfaChallengeToken({ id: 'user-1', firmId: 'firm-1', purpose: MFA_PURPOSES.VERIFY });
    const { token: tokenB } = signMfaChallengeToken({ id: 'user-1', firmId: 'firm-1', purpose: MFA_PURPOSES.VERIFY });
    assert.notEqual(tokenA, tokenB, 'pré-condição: os dois challenges têm de ser fisicamente diferentes (jti novo)');

    const keyA = mfaChallengeKey(reqWith({ body: { challengeToken: tokenA } }));
    const keyB = mfaChallengeKey(reqWith({ body: { challengeToken: tokenB } }));
    assert.equal(keyA, keyB, 'gerar um challenge novo não pode reiniciar o balde de tentativas');
  });

  test('challenges de utilizadores diferentes NÃO partilham chave (continua por-pessoa)', () => {
    const { token: tokenA } = signMfaChallengeToken({ id: 'user-1', firmId: 'firm-1', purpose: MFA_PURPOSES.VERIFY });
    const { token: tokenB } = signMfaChallengeToken({ id: 'user-2', firmId: 'firm-1', purpose: MFA_PURPOSES.VERIFY });

    const keyA = mfaChallengeKey(reqWith({ body: { challengeToken: tokenA } }));
    const keyB = mfaChallengeKey(reqWith({ body: { challengeToken: tokenB } }));
    assert.notEqual(keyA, keyB);
  });

  test('mesmo utilizador em IPs diferentes NÃO partilha chave', () => {
    const { token } = signMfaChallengeToken({ id: 'user-1', firmId: 'firm-1', purpose: MFA_PURPOSES.VERIFY });

    const keyIp1 = mfaChallengeKey(reqWith({ ip: '203.0.113.10', body: { challengeToken: token } }));
    const keyIp2 = mfaChallengeKey(reqWith({ ip: '203.0.113.99', body: { challengeToken: token } }));
    assert.notEqual(keyIp1, keyIp2);
  });

  test('lê o token do header ou do cookie quando não vem no corpo', () => {
    const { token } = signMfaChallengeToken({ id: 'user-1', firmId: 'firm-1', purpose: MFA_PURPOSES.VERIFY });

    const keyHeader = mfaChallengeKey(reqWith({ headers: { 'x-mfa-challenge': token } }));
    const keyCookie = mfaChallengeKey(reqWith({ cookies: { mfaChallengeToken: token } }));
    const keyBody = mfaChallengeKey(reqWith({ body: { challengeToken: token } }));
    assert.equal(keyHeader, keyBody);
    assert.equal(keyCookie, keyBody);
  });

  test('token ausente ou inválido cai num balde partilhado por IP, sem rebentar', () => {
    const keyMissing = mfaChallengeKey(reqWith({}));
    const keyGarbage = mfaChallengeKey(reqWith({ body: { challengeToken: 'not-a-jwt' } }));
    assert.equal(keyMissing, keyGarbage);
    assert.match(keyMissing, /^invalid-challenge:/);
  });

  test('com sessão activa (req.user), usa a identidade da sessão em vez do challenge', () => {
    const { token } = signMfaChallengeToken({ id: 'user-1', firmId: 'firm-1', purpose: MFA_PURPOSES.VERIFY });
    const key = mfaChallengeKey(reqWith({ user: { id: 'user-9' }, body: { challengeToken: token } }));
    assert.equal(key, 'user-9:203.0.113.10');
  });
});
