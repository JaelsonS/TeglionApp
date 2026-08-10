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

/** Upsert — reconectar substitui a ligação anterior do mesmo staff (mesma UNIQUE (firm_id, staff_user_id)). */
async function upsertConnection({ firmId, staffUserId, googleEmail, accessToken, refreshToken, tokenExpiresAt, calendarId }) {
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
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'firm_id,staff_user_id' },
    )
    .select()
    .single();
  if (error) throw error;
  return map(data);
}

/** Actualiza só o access_token depois de um refresh (o refresh_token normalmente não muda). */
async function updateAccessToken(id, { accessToken, tokenExpiresAt }) {
  const sb = getSupabaseAdmin();
  const { data, error } = await sb
    .from('firm_google_calendar_connections')
    .update({
      access_token_enc: encryptField(accessToken),
      token_expires_at: tokenExpiresAt,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
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
  upsertConnection,
  updateAccessToken,
  deleteConnection,
  map,
};
