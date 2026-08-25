const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');

// Regressão: GET /api/public/firm-branding era o único endpoint de catálogo público
// sem rate limiter dedicado (dependia só do limiter global autenticado/anónimo),
// diferente dos vizinhos /firms/:firmSlug/* que já usam serviceViewLimiter.

let server;
let baseUrl;

before(async () => {
  process.env.CORS_ORIGINS = 'https://app.teglion.com';
  process.env.FRONTEND_URL = 'https://app.teglion.com';
  const { app } = require('../app');
  server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  const { port } = server.address();
  baseUrl = `http://127.0.0.1:${port}`;
});

after(async () => {
  await new Promise((resolve) => server.close(resolve));
});

test('GET /api/public/firm-branding expõe headers de rate-limit dedicados', async () => {
  const res = await fetch(`${baseUrl}/api/public/firm-branding?slug=qualquer-escritorio`);
  assert.ok(res.headers.get('ratelimit-limit'), 'devia ter um rate limiter dedicado, não apenas o global');
});
