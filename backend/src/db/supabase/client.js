const { createClient } = require('@supabase/supabase-js');

let supabaseAdmin = null;

function normalizeSupabaseUrl(url) {
  let u = String(url || '').trim();
  if (!u) return '';
  u = u.replace(/\/rest\/v1\/?$/i, '');
  return u.replace(/\/+$/, '');
}

function trimEnv(value) {
  return String(value || '')
    .trim()
    .replace(/^["']|["']$/g, '');
}

/**
 * Decode JWT payload without verifying signature — only used to fail-fast when
 * someone pasted the anon/publishable key into SUPABASE_SERVICE_ROLE_KEY.
 * Never log the raw key.
 */
function readJwtRole(key) {
  const raw = trimEnv(key);
  if (!raw) return null;
  if (raw.startsWith('sb_secret_')) return 'service_role';
  if (raw.startsWith('sb_publishable_')) return 'anon';
  if (!raw.startsWith('eyJ')) return null;
  try {
    const payloadB64 = raw.split('.')[1];
    if (!payloadB64) return null;
    const json = Buffer.from(payloadB64, 'base64url').toString('utf8');
    const payload = JSON.parse(json);
    return payload?.role ? String(payload.role) : null;
  } catch {
    return null;
  }
}

function assertServiceRoleKey(key = process.env.SUPABASE_SERVICE_ROLE_KEY) {
  const role = readJwtRole(key);
  if (role === 'service_role') return { ok: true, role };
  return {
    ok: false,
    role: role || 'unknown',
    message:
      'SUPABASE_SERVICE_ROLE_KEY não é a service_role (detetado role=' +
      (role || 'unknown') +
      '). ' +
      'Com a chave anon o PostgREST aplica RLS e INSERT em firms falha com 42501. ' +
      'No Dashboard Supabase (projecto staging) → Settings → API → copie a chave service_role (secret) ' +
      'para STAGING_SUPABASE_SERVICE_ROLE_KEY (GitHub Actions) e SUPABASE_SERVICE_ROLE_KEY (Render/.env.staging).',
  };
}

function isSupabaseConfigured() {
  const url = normalizeSupabaseUrl(process.env.SUPABASE_URL);
  const key = trimEnv(process.env.SUPABASE_SERVICE_ROLE_KEY);
  return Boolean(url && key);
}

function getSupabaseAdmin() {
  if (!isSupabaseConfigured()) return null;
  if (supabaseAdmin) return supabaseAdmin;

  const url = normalizeSupabaseUrl(process.env.SUPABASE_URL);
  const key = trimEnv(process.env.SUPABASE_SERVICE_ROLE_KEY);
  supabaseAdmin = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return supabaseAdmin;
}

module.exports = {
  normalizeSupabaseUrl,
  isSupabaseConfigured,
  getSupabaseAdmin,
  readJwtRole,
  assertServiceRoleKey,
};
