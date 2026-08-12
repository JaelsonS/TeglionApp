const { getSupabaseAdmin } = require('../client');
const { encryptField, decryptField } = require('../../../utils/crypto-fields');

function map(row) {
  if (!row) return null;
  return {
    id: row.id,
    firmId: row.firm_id,
    staffUserId: row.staff_user_id,
    googleEmail: row.google_email || null,
    accessToken: decryptField(row.access_token_enc),
    refreshToken: decryptField(row.refresh_token_enc),
    tokenExpiresAt: row.token_expires_at,
    calendarId: row.calendar_id,
    calendarSummary: row.calendar_summary || null,
    authStatus: row.auth_status || 'ok',
    lastAuthError: row.last_auth_error || null,
    lastAuthCheckAt: row.last_auth_check_at || null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

async function findByStaffUser(firmId, staffUserId) {
  const sb = getSupabaseAdmin();
  const { data, error } = await sb
    .from('firm_google_calendar_connections')
    .select('*')
    .eq('firm_id', firmId)
    .eq('staff_user_id', staffUserId)
    .maybeSingle();
  if (error) throw error;
  return map(data);
}

async function listByFirm(firmId) {
  const sb = getSupabaseAdmin();
  const { data, error } = await sb.from('firm_google_calendar_connections').select('*').eq('firm_id', firmId);
  if (error) throw error;
  return (data || []).map(map);
}

async function upsertConnection({
  firmId,
  staffUserId,
  googleEmail,
  accessToken,
  refreshToken,
  tokenExpiresAt,
  calendarId,
  calendarSummary,
  authStatus,
  lastAuthError,
}) {
  const sb = getSupabaseAdmin();
  const { data, error } = await sb
    .from('firm_google_calendar_connections')
    .upsert(
      {
        firm_id: firmId,
        staff_user_id: staffUserId,
        google_email: googleEmail || null,
        access_token_enc: encryptField(accessToken),
        refresh_token_enc: encryptField(refreshToken),
        token_expires_at: tokenExpiresAt,
        calendar_id: calendarId || 'primary',
        calendar_summary: calendarSummary ?? null,
        auth_status: authStatus || 'ok',
        last_auth_error: lastAuthError ?? null,
        last_auth_check_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'firm_id,staff_user_id' },
    )
    .select()
    .single();
  if (error) throw error;
  return map(data);
}

async function updateAccessToken(id, { accessToken, tokenExpiresAt }) {
  const sb = getSupabaseAdmin();
  const { data, error } = await sb
    .from('firm_google_calendar_connections')
    .update({
      access_token_enc: encryptField(accessToken),
      token_expires_at: tokenExpiresAt,
      auth_status: 'ok',
      last_auth_error: null,
      last_auth_check_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .maybeSingle();
  if (error) throw error;
  return map(data);
}

async function markNeedsReconnect(id, errorMessage) {
  const sb = getSupabaseAdmin();
  const { data, error } = await sb
    .from('firm_google_calendar_connections')
    .update({
      auth_status: 'needs_reconnect',
      last_auth_error: String(errorMessage || 'refresh_failed').slice(0, 500),
      last_auth_check_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .maybeSingle();
  if (error) throw error;
  return map(data);
}

async function updateSelectedCalendar(firmId, staffUserId, { calendarId, calendarSummary }) {
  const sb = getSupabaseAdmin();
  const { data, error } = await sb
    .from('firm_google_calendar_connections')
    .update({
      calendar_id: calendarId,
      calendar_summary: calendarSummary ?? null,
      updated_at: new Date().toISOString(),
    })
    .eq('firm_id', firmId)
    .eq('staff_user_id', staffUserId)
    .select()
    .maybeSingle();
  if (error) throw error;
  return map(data);
}

async function deleteConnection(firmId, staffUserId) {
  const sb = getSupabaseAdmin();
  const { error } = await sb
    .from('firm_google_calendar_connections')
    .delete()
    .eq('firm_id', firmId)
    .eq('staff_user_id', staffUserId);
  if (error) throw error;
}

module.exports = {
  findByStaffUser,
  listByFirm,
  upsertConnection,
  updateAccessToken,
  markNeedsReconnect,
  updateSelectedCalendar,
  deleteConnection,
  map,
};
