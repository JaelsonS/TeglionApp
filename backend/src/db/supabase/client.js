const { createClient } = require('@supabase/supabase-js');

let supabaseAdmin = null;

function normalizeSupabaseUrl(url) {
  let u = String(url || '').trim();
  if (!u) return '';
  u = u.replace(/\/rest\/v1\/?$/i, '');
  return u.replace(/\/+$/, '');
}

function isSupabaseConfigured() {
  const url = normalizeSupabaseUrl(process.env.SUPABASE_URL);
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  return Boolean(url && key);
}

function getSupabaseAdmin() {
  if (!isSupabaseConfigured()) return null;
  if (supabaseAdmin) return supabaseAdmin;

  const url = normalizeSupabaseUrl(process.env.SUPABASE_URL);
  supabaseAdmin = createClient(url, process.env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return supabaseAdmin;
}

module.exports = {
  normalizeSupabaseUrl,
  isSupabaseConfigured,
  getSupabaseAdmin,
};
