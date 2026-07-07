const { getSupabaseAdmin } = require('../client');

async function getOrCreate({ firmId, clientId }) {
  const sb = getSupabaseAdmin();
  const { data: existing, error: findErr } = await sb
    .from('conversations')
    .select('*')
    .eq('firm_id', firmId)
    .eq('client_id', clientId)
    .maybeSingle();
  if (findErr) throw findErr;
  if (existing) return existing;

  const { data, error } = await sb
    .from('conversations')
    .insert({ firm_id: firmId, client_id: clientId })
    .select()
    .single();
  if (error) throw error;
  return data;
}

module.exports = { getOrCreate };
