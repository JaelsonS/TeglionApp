const { getSupabaseAdmin } = require('../client');

async function insertAcceptance({
  firmId,
  firmUserId,
  termsVersion,
  termsTextSha256,
  ipAddress,
  userAgent,
}) {
  const sb = getSupabaseAdmin();
  const { data, error } = await sb
    .from('firm_stripe_connect_terms_acceptances')
    .insert({
      firm_id: firmId,
      firm_user_id: firmUserId,
      terms_version: termsVersion,
      terms_text_sha256: termsTextSha256,
      ip_address: ipAddress || null,
      user_agent: userAgent ? String(userAgent).slice(0, 2000) : null,
    })
    .select('*')
    .single();
  if (error) throw error;
  return {
    id: data.id,
    firmId: data.firm_id,
    firmUserId: data.firm_user_id,
    termsVersion: data.terms_version,
    termsTextSha256: data.terms_text_sha256,
    acceptedAt: data.accepted_at,
    ipAddress: data.ip_address,
    userAgent: data.user_agent,
  };
}

async function findLatestForFirm(firmId) {
  const sb = getSupabaseAdmin();
  const { data, error } = await sb
    .from('firm_stripe_connect_terms_acceptances')
    .select('*')
    .eq('firm_id', firmId)
    .order('accepted_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  return {
    id: data.id,
    firmId: data.firm_id,
    firmUserId: data.firm_user_id,
    termsVersion: data.terms_version,
    termsTextSha256: data.terms_text_sha256,
    acceptedAt: data.accepted_at,
    ipAddress: data.ip_address,
    userAgent: data.user_agent,
  };
}

module.exports = { insertAcceptance, findLatestForFirm };
