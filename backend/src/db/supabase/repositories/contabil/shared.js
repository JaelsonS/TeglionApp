const { getSupabaseAdmin, isSupabaseConfigured } = require('../../client');

function ensureClient() {
  if (!isSupabaseConfigured()) {
    throw new Error('[TegLion] Supabase não configurado. Defina SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY.');
  }
  return getSupabaseAdmin();
}

module.exports = { ensureClient };
