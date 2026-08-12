const { getSupabaseAdmin } = require('../client');

async function createInvite({ firmId, clientId, email, token, expiresAt, createdBy }) {
  const sb = getSupabaseAdmin();
  const { data, error } = await sb
    .from('client_invites')
    .insert({
      firm_id: firmId,
      client_id: clientId || null,
      email: email || null,
      token,
      status: 'PENDING',
      expires_at: expiresAt,
      created_by: createdBy || null,
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

async function findInviteByToken(token) {
  const sb = getSupabaseAdmin();
  const { data, error } = await sb.from('client_invites').select('*').eq('token', token).maybeSingle();
  if (error) throw error;
  return data;
}

async function markInviteAccepted(id, clientId) {
  const sb = getSupabaseAdmin();
  const { data, error } = await sb
    .from('client_invites')
    .update({
      status: 'ACCEPTED',
      accepted_at: new Date().toISOString(),
      client_id: clientId,
    })
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

async function markInviteExpired(id) {
  const sb = getSupabaseAdmin();
  await sb.from('client_invites').update({ status: 'EXPIRED' }).eq('id', id);
}

/** Revoga convites pendentes de um cliente — usado antes de reemitir ou ao revogar o acesso. */
async function revokePendingInvitesForClient(firmId, clientId) {
  const sb = getSupabaseAdmin();
  const { error } = await sb
    .from('client_invites')
    .update({ status: 'REVOKED', revoked_at: new Date().toISOString() })
    .eq('firm_id', firmId)
    .eq('client_id', clientId)
    .eq('status', 'PENDING');
  if (error) throw error;
}

module.exports = {
  createInvite,
  findInviteByToken,
  markInviteAccepted,
  markInviteExpired,
  revokePendingInvitesForClient,
};
