require('dotenv').config();
require('dotenv').config({ path: require('path').join(__dirname, '../.env.local'), override: true });

const { performance } = require('node:perf_hooks');
const { getFirmDashboardStats } = require('../src/db/supabase/repositories/contabil/firm-dashboard.repository');
const { isSupabaseConfigured } = require('../src/db/supabase/client');
const firmsRepository = require('../src/db/supabase/repositories/firms.repository');

async function resolveFirmId() {
  if (process.env.FIRM_ID) return process.env.FIRM_ID;
  const firm = await firmsRepository.findFirmById?.(process.env.BENCHMARK_FIRM_ID || '').catch(() => null);
  if (firm?.id) return firm.id;
  const { getSupabaseAdmin } = require('../src/db/supabase/client');
  const sb = getSupabaseAdmin();
  const { data } = await sb.from('firms').select('id').limit(1).maybeSingle();
  return data?.id || null;
}

async function bench(label, fn, runs = 5) {
  const times = [];
  for (let i = 0; i < runs; i += 1) {
    const t0 = performance.now();
    await fn();
    times.push(performance.now() - t0);
  }
  times.sort((a, b) => a - b);
  const p50 = times[Math.floor(times.length / 2)];
  const p95 = times[Math.ceil(times.length * 0.95) - 1];
  const avg = times.reduce((s, t) => s + t, 0) / times.length;
  console.log(`${label}: avg=${avg.toFixed(1)}ms p50=${p50.toFixed(1)}ms p95=${p95.toFixed(1)}ms`);
  return { avg, p50, p95 };
}

async function main() {
  if (!isSupabaseConfigured()) {
    console.log('Supabase não configurado — benchmark ignorado.');
    process.exit(0);
  }

  const firmId = await resolveFirmId();
  if (!firmId) {
    console.log('Sem firmId — defina FIRM_ID ou tenha firms na BD.');
    process.exit(1);
  }

  console.log(`Benchmark dashboard · firmId=${firmId}\n`);

  await bench('getFirmDashboardStats (cold)', () => getFirmDashboardStats(firmId));
  await bench('getFirmDashboardStats (warm)', () => getFirmDashboardStats(firmId));

  console.log('\nConcluído.');
}

main().catch((err) => {
  console.error('benchmark-dashboard FAILED:', err.message);
  process.exit(1);
});
