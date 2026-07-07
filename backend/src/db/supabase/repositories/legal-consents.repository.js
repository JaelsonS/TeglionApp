const { getSupabaseAdmin } = require('../client');

function mapRow(row) {
  if (!row) return null;
  return {
    id: row.id,
    firmUserId: row.firm_user_id,
    clientId: row.client_id,
    firmId: row.firm_id,
    accountType: row.account_type,
    termsVersion: row.terms_version,
    privacyVersion: row.privacy_version,
    dpaVersion: row.dpa_version,
    cookiesVersion: row.cookies_version,
    acceptedTerms: row.accepted_terms,
    acceptedPrivacy: row.accepted_privacy,
    acceptedDpa: row.accepted_dpa,
    acceptedCookies: row.accepted_cookies,
    acceptedAt: row.accepted_at,
    ipAddress: row.ip_address,
    userAgent: row.user_agent,
    createdAt: row.created_at,
  };
}

async function insertConsent(row) {
  const sb = getSupabaseAdmin();
  const { data, error } = await sb.from('user_legal_consents').insert(row).select().single();
  if (error) throw error;
  return mapRow(data);
}

async function listByFirmUser(firmUserId, { limit = 20 } = {}) {
  const sb = getSupabaseAdmin();
  const { data, error } = await sb
    .from('user_legal_consents')
    .select('*')
    .eq('firm_user_id', firmUserId)
    .order('accepted_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data || []).map(mapRow);
}

async function updateFirmUserConsentBundle(firmUserId, bundle) {
  const sb = getSupabaseAdmin();
  const { error } = await sb
    .from('firm_users')
    .update({ legal_consent_bundle: bundle, updated_at: new Date().toISOString() })
    .eq('id', firmUserId);
  if (error) throw error;
}

module.exports = {
  insertConsent,
  listByFirmUser,
  updateFirmUserConsentBundle,
  mapRow,
};
