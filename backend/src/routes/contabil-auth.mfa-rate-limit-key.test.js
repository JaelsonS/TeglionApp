const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');

// Regressão: em /mfa/disable e /mfa/recovery/regenerate, o rate limiter corria
// ANTES do authMiddleware — req.user ainda não existia quando mfaChallengeKey()
// gerava a chave, então todos os utilizadores autenticados atrás do mesmo IP caíam
// no mesmo balde genérico "invalid-challenge:{ip}" (o limiar era partilhado entre
// colegas de escritório, não por conta). Reordenar para authMiddleware -> limiter
// garante req.user.id disponível na chave, isolando o limiar por utilizador.

let server;
let baseUrl;
let signAccessToken;

before(async () => {
  process.env.CORS_ORIGINS = 'https://app.teglion.com';
  process.env.FRONTEND_URL = 'https://app.teglion.com';
  ({ signAccessToken } = require('../config/jwt'));
  const { app } = require('../app');
  server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  const { port } = server.address();
  baseUrl = `http://127.0.0.1:${port}`;
});

after(async () => {
  await new Promise((resolve) => server.close(resolve));
});

function tokenFor(userId) {
  return signAccessToken({
    id: userId,
    role: 'FIRM_OWNER',
    firmId: '11111111-1111-4111-8111-111111111111',
  });
}

function csrfHeaders(accessToken) {
  return {
    'Content-Type': 'application/json',
    Origin: 'https://app.teglion.com',
    'X-CSRF-Token': 'test-csrf-token',
    Cookie: `accessToken=${accessToken}; csrfToken=test-csrf-token`,
  };
}

test('/mfa/disable: dois utilizadores diferentes atrás do mesmo IP têm orçamentos de rate-limit independentes', async () => {
  const resA = await fetch(`${baseUrl}/api/auth/mfa/disable`, {
    method: 'POST',
    headers: csrfHeaders(tokenFor('aaaaaaaa-1111-4111-8111-111111111111')),
    body: JSON.stringify({}),
  });
  const resB = await fetch(`${baseUrl}/api/auth/mfa/disable`, {
    method: 'POST',
    headers: csrfHeaders(tokenFor('bbbbbbbb-2222-4222-8222-222222222222')),
    body: JSON.stringify({}),
  });

  // O status real (ex.: 403 TENANT_MISMATCH da lógica de negócio, por o utilizador
  // fictício não existir na BD de teste) não é o que este teste verifica — importa
  // só que os dois pedidos chegaram ao rate limiter já com req.user resolvido.
  assert.notEqual(resA.status, 429, 'pedido A não devia estar bloqueado por rate-limit');
  assert.notEqual(resB.status, 429, 'pedido B não devia estar bloqueado por rate-limit');

  const remainingA = resA.headers.get('ratelimit-remaining');
  const remainingB = resB.headers.get('ratelimit-remaining');
  assert.ok(remainingA, 'devia expor o header de rate-limit');
  assert.ok(remainingB, 'devia expor o header de rate-limit');
  // Se partilhassem o mesmo balde, o segundo pedido veria o orçamento já
  // decrementado pelo primeiro (remainingB < remainingA). Sendo utilizadores
  // diferentes, cada um começa do próprio limite máximo.
  assert.equal(remainingA, remainingB, 'utilizadores diferentes não devem partilhar o mesmo contador');
});
