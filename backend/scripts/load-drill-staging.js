#!/usr/bin/env node
/**
 * Load drill LEVE — só staging (nunca produção).
 *
 * Mede: health paralelo, páginas auth, CSRF bootstrap, latências.
 * Não cria gabinetes reais (Turnstile + rate limit 5/IP) — evita poluir BD.
 *
 * Uso:
 *   cd backend && node scripts/load-drill-staging.js
 *   FE_BASE=https://staging.teglion.com CONCURRENCY=20 node scripts/load-drill-staging.js
 */
const axios = require('axios');

const FE_BASE = String(process.env.FE_BASE || 'https://staging.teglion.com').replace(/\/+$/, '');
const CONCURRENCY = Math.min(Math.max(Number(process.env.CONCURRENCY) || 20, 5), 50);
const ROUNDS = Math.min(Math.max(Number(process.env.ROUNDS) || 2, 1), 5);

if (!FE_BASE.includes('staging')) {
  console.error('Recusado: FE_BASE tem de ser staging (protecção anti-prod).');
  process.exit(2);
}

function pct(sorted, p) {
  if (!sorted.length) return null;
  const idx = Math.min(sorted.length - 1, Math.floor((p / 100) * sorted.length));
  return sorted[idx];
}

async function timedGet(url) {
  const t0 = Date.now();
  const res = await axios.get(url, {
    timeout: 30000,
    validateStatus: () => true,
    maxRedirects: 5,
    headers: { Accept: 'application/json, text/html' },
  });
  return { status: res.status, ms: Date.now() - t0, url };
}

async function burst(path, n) {
  const url = `${FE_BASE}${path}`;
  const results = await Promise.all(
    Array.from({ length: n }, () => timedGet(url).catch((err) => ({ status: 0, ms: 30000, url, err: err.message }))),
  );
  const ok = results.filter((r) => r.status >= 200 && r.status < 400);
  const serverErr = results.filter((r) => r.status >= 500 || r.status === 0);
  const times = ok.map((r) => r.ms).sort((a, b) => a - b);
  return {
    path,
    n,
    ok: ok.length,
    serverErr: serverErr.length,
    p50: pct(times, 50),
    p95: pct(times, 95),
    max: times.length ? times[times.length - 1] : null,
  };
}

async function main() {
  console.log(`Load drill staging → ${FE_BASE} · concurrency=${CONCURRENCY} · rounds=${ROUNDS}\n`);
  const report = [];

  for (let r = 1; r <= ROUNDS; r += 1) {
    console.log(`--- round ${r} ---`);
    const health = await burst('/api/health', CONCURRENCY);
    report.push(health);
    console.log(
      `health: ${health.ok}/${health.n} ok · 5xx/fail=${health.serverErr} · p50=${health.p50}ms p95=${health.p95}ms max=${health.max}ms`,
    );

    for (const path of ['/auth/firm/login', '/auth/firm/register', '/api/csrf']) {
      const row = await burst(path, Math.min(10, CONCURRENCY));
      report.push(row);
      console.log(
        `${path}: ${row.ok}/${row.n} ok · 5xx/fail=${row.serverErr} · p95=${row.p95}ms`,
      );
    }
  }

  const healthRows = report.filter((x) => x.path === '/api/health');
  const totalOk = healthRows.reduce((s, x) => s + x.ok, 0);
  const totalN = healthRows.reduce((s, x) => s + x.n, 0);
  const total5xx = healthRows.reduce((s, x) => s + x.serverErr, 0);
  const worstP95 = Math.max(...healthRows.map((x) => x.p95 || 0));
  // Round 1 pode incluir cold start Render — o critério quente é rounds ≥ 2.
  const warmHealth = healthRows.slice(1);
  const warmP95 = warmHealth.length
    ? Math.max(...warmHealth.map((x) => x.p95 || 0))
    : worstP95;

  console.log('\n=== RESUMO ===');
  console.log(`health aggregate: ${totalOk}/${totalN} · 5xx/fail=${total5xx}`);
  console.log(`p95 all rounds=${worstP95}ms · p95 warm (sem round 1)=${warmP95}ms`);

  const pass = total5xx === 0 && totalOk === totalN && warmP95 < 2000;
  if (pass) {
    if (worstP95 >= 2000) {
      console.log(
        'RESULT: PASS_WITH_COLD_START (0×5xx; warm p95 < 2s; round 1 lento — típico Render)',
      );
    } else {
      console.log('RESULT: PASS (0×5xx, p95 health < 2s)');
    }
    process.exit(0);
  }
  console.log('RESULT: FAIL — investigar staging antes do soft launch');
  process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
