const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');

// Regressão: faltava o header Permissions-Policy — defesa em profundidade barata
// para uma API JSON pura, que não usa nenhuma destas capacidades do browser.

let server;
let baseUrl;

before(async () => {
  process.env.CORS_ORIGINS = 'https://app.teglion.com';
  process.env.FRONTEND_URL = 'https://app.teglion.com';
  const { app } = require('./app');
  server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  const { port } = server.address();
  baseUrl = `http://127.0.0.1:${port}`;
});

after(async () => {
  await new Promise((resolve) => server.close(resolve));
});

test('resposta inclui Permissions-Policy restritivo', async () => {
  const res = await fetch(`${baseUrl}/api/public/pricing`, { method: 'GET' });
  const policy = res.headers.get('permissions-policy');
  assert.ok(policy, 'devia definir o header Permissions-Policy');
  assert.match(policy, /camera=\(\)/);
  assert.match(policy, /microphone=\(\)/);
  assert.match(policy, /geolocation=\(\)/);
});

test('resposta continua a incluir os headers do helmet (X-Content-Type-Options, sem regressão)', async () => {
  const res = await fetch(`${baseUrl}/api/public/pricing`, { method: 'GET' });
  assert.equal(res.headers.get('x-content-type-options'), 'nosniff');
});
