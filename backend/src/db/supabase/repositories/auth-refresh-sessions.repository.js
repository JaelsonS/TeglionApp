const { getSupabaseAdmin } = require('../client');

/**
 * @param {{ jti: string, actorType: 'firm_user'|'client', actorId: string, tokenHash: string, expiresAt: string }} opts
 */
async function createSession({ jti, actorType, actorId, tokenHash, expiresAt }) {
  const sb = getSupabaseAdmin();
  const { error } = await sb.from('auth_refresh_sessions').insert({
    jti,
    actor_type: actorType,
    actor_id: actorId,
    token_hash: tokenHash,
    expires_at: expiresAt,
  });
  if (error) throw error;
}

async function findByJti(jti) {
  const sb = getSupabaseAdmin();
  const { data, error } = await sb.from('auth_refresh_sessions').select('*').eq('jti', jti).maybeSingle();
  if (error) throw error;
  return data;
}

async function deleteByJti(jti) {
  if (!jti) return;
  const sb = getSupabaseAdmin();
  await sb.from('auth_refresh_sessions').delete().eq('jti', jti);
}

async function deleteAllForActor(actorType, actorId) {
  const sb = getSupabaseAdmin();
  await sb.from('auth_refresh_sessions').delete().eq('actor_type', actorType).eq('actor_id', actorId);
}

/** Mantém apenas as sessões mais recentes (uma por login/dispositivo). */
async function pruneOldSessions(actorType, actorId, keepCount = 35) {
  const sb = getSupabaseAdmin();
  const { data, error } = await sb
    .from('auth_refresh_sessions')
    .select('jti')
    .eq('actor_type', actorType)
    .eq('actor_id', actorId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  const rows = data || [];
  const toRemove = rows.slice(keepCount);
  const jtis = toRemove.map((r) => r.jti).filter(Boolean);
  if (jtis.length === 0) return;
  await sb.from('auth_refresh_sessions').delete().in('jti', jtis);
}

module.exports = {
  createSession,
  findByJti,
  deleteByJti,
  deleteAllForActor,
  pruneOldSessions,
};
