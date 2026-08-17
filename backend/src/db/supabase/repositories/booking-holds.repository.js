const { getSupabaseAdmin } = require('../client');

function mapHold(row) {
  if (!row) return null;
  return {
    id: row.id,
    firmId: row.firm_id,
    accountingServiceId: row.accounting_service_id,
    scheduledAt: row.scheduled_at,
    durationMinutes: row.duration_minutes,
    holdToken: row.hold_token,
    expiresAt: row.expires_at,
    createdAt: row.created_at,
  };
}

async function listActiveForFirm(firmId, { from, to } = {}) {
  const sb = getSupabaseAdmin();
  let q = sb
    .from('booking_holds')
    .select('*')
    .eq('firm_id', firmId)
    .gt('expires_at', new Date().toISOString());
  if (from) q = q.gte('scheduled_at', from);
  if (to) q = q.lte('scheduled_at', to);
  const { data, error } = await q;
  if (error) throw error;
  return (data || []).map(mapHold);
}

async function createHold(row) {
  const sb = getSupabaseAdmin();
  const { data, error } = await sb
    .from('booking_holds')
    .insert({
      firm_id: row.firmId,
      accounting_service_id: row.accountingServiceId,
      scheduled_at: row.scheduledAt,
      duration_minutes: row.durationMinutes,
      hold_token: row.holdToken,
      expires_at: row.expiresAt,
    })
    .select()
    .single();
  if (error) throw error;
  return mapHold(data);
}

async function findByToken(holdToken) {
  const sb = getSupabaseAdmin();
  const { data, error } = await sb
    .from('booking_holds')
    .select('*')
    .eq('hold_token', holdToken)
    .maybeSingle();
  if (error) throw error;
  return mapHold(data);
}

async function deleteById(id, firmId) {
  const sb = getSupabaseAdmin();
  const { error } = await sb.from('booking_holds').delete().eq('id', id).eq('firm_id', firmId);
  if (error) throw error;
}

async function deleteExpired(beforeIso) {
  const sb = getSupabaseAdmin();
  const { data, error } = await sb
    .from('booking_holds')
    .delete()
    .lt('expires_at', beforeIso || new Date().toISOString())
    .select('id');
  if (error) throw error;
  return (data || []).length;
}

module.exports = {
  listActiveForFirm,
  createHold,
  findByToken,
  deleteById,
  deleteExpired,
};
