const { getSupabaseAdmin } = require('../client');

async function invalidateUserTokens(userType, userId) {
  const sb = getSupabaseAdmin();
  const { error } = await sb
    .from('password_reset_tokens')
    .update({ used_at: new Date().toISOString() })
    .eq('user_type', userType)
    .eq('user_id', userId)
    .is('used_at', null);
  if (error) throw error;
}

async function createToken({ userType, userId, tokenHash, expiresAt }) {
  const sb = getSupabaseAdmin();
  const { data, error } = await sb
    .from('password_reset_tokens')
    .insert({
      user_type: userType,
      user_id: userId,
      token_hash: tokenHash,
      expires_at: expiresAt,
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

async function findValidToken(tokenHash) {
  const sb = getSupabaseAdmin();
  const { data, error } = await sb
    .from('password_reset_tokens')
    .select('*')
    .eq('token_hash', tokenHash)
    .is('used_at', null)
    .gt('expires_at', new Date().toISOString())
    .maybeSingle();
  if (error) throw error;
  return data;
}

async function markTokenUsed(id) {
  const sb = getSupabaseAdmin();
  const { error } = await sb
    .from('password_reset_tokens')
    .update({ used_at: new Date().toISOString() })
    .eq('id', id);
  if (error) throw error;
}

module.exports = {
  invalidateUserTokens,
  createToken,
  findValidToken,
  markTokenUsed,
};
