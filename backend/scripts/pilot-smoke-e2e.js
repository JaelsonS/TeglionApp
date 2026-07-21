#!/usr/bin/env node
/**
 * Smoke E2E piloto Teglion — valida infra mínima antes do escritório piloto.
 *
 * Uso:
 *   cd backend && node scripts/pilot-smoke-e2e.js
 *   API_BASE=http://localhost:4000 node scripts/pilot-smoke-e2e.js
 */
require('dotenv').config();
require('dotenv').config({ path: require('path').join(__dirname, '../.env.local'), override: true });

const axios = require('axios');
const { isSupabaseConfigured, getSupabaseAdmin } = require('../src/db/supabase/client');
const contabilStorage = require('../src/services/storage/contabil-storage.service');
const { env } = require('../src/config/env');

const steps = [];
let failed = 0;

function pass(name, detail = '') {
  steps.push({ name, ok: true, detail });
  console.log(`✅ ${name}${detail ? ` — ${detail}` : ''}`);
}

function fail(name, detail = '') {
  steps.push({ name, ok: false, detail });
  console.error(`❌ ${name}${detail ? ` — ${detail}` : ''}`);
  failed += 1;
}

async function checkEnv() {
  const required = ['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY'];
  const missing = required.filter((k) => !process.env[k]);
  if (missing.length) fail('Variáveis Supabase', missing.join(', '));
  else pass('Variáveis Supabase', 'URL + service role');
  if (env.EMAIL_ENABLED) pass('Email Brevo', 'BREVO_API_KEY configurada');
  else pass('Email Brevo', 'skip (sem BREVO_API_KEY — no-op em dev)');
}

async function checkSupabaseConnection() {
  if (!isSupabaseConfigured()) {
    fail('Ligação Supabase', 'não configurado');
    return;
  }
  const sb = getSupabaseAdmin();
  const { error } = await sb.from('firms').select('id').limit(1);
  if (error) fail('Query firms', error.message);
  else pass('Query firms', 'OK');
}

async function checkStorageBucket() {
  if (!isSupabaseConfigured()) return;
  const sb = getSupabaseAdmin();
  const bucket = env.SUPABASE_STORAGE_BUCKET || 'contabil-documents';
  const { data, error } = await sb.storage.listBuckets();
  if (error) {
    fail('Storage buckets', error.message);
    return;
  }
  const found = (data || []).some((b) => b.name === bucket || b.id === bucket);
  if (found) pass('Bucket contabil-documents', bucket);
  else fail('Bucket contabil-documents', `bucket "${bucket}" não encontrado`);
}

async function checkStorageUploadRoundtrip() {
  if (!isSupabaseConfigured()) return;
  const testFirm = '00000000-0000-4000-8000-000000000001';
  const testClient = '00000000-0000-4000-8000-000000000002';
  const buf = Buffer.from('%PDF-1.4 contabil-pilot-smoke-test');
  try {
    const uploaded = await contabilStorage.uploadClientDocument({
      firmId: testFirm,
      clientId: testClient,
      file: { buffer: buf, originalname: 'smoke.pdf', mimetype: 'application/pdf', size: buf.length },
    });
    const url = await contabilStorage.createSignedDownloadUrl(uploaded.path, 60);
    if (url) pass('Upload + signed URL', uploaded.path);
    else fail('Upload + signed URL', 'sem URL');
  } catch (err) {
    fail('Upload + signed URL', err.message || String(err));
  }
}

async function checkApiHealth() {
  const base = process.env.API_BASE || process.env.BACKEND_URL;
  if (!base) {
    pass('API health', 'skip (defina API_BASE para testar)');
    return;
  }
  try {
    const res = await axios.get(`${base.replace(/\/$/, '')}/api/health`, { timeout: 8000 });
    if (res.status === 200) pass('API health', base);
    else fail('API health', `status ${res.status}`);
  } catch (err) {
    fail('API health', err.message || String(err));
  }
}

async function main() {
  console.log('\n=== Teglion Pilot Smoke E2E ===\n');
  await checkEnv();
  await checkSupabaseConnection();
  await checkStorageBucket();
  await checkStorageUploadRoundtrip();
  await checkApiHealth();
  console.log(`\n--- ${steps.length - failed}/${steps.length} OK ---\n`);
  if (failed > 0) process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
