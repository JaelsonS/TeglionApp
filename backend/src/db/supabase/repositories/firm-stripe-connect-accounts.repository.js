const { getSupabaseAdmin } = require('../client');

function mapRow(row) {
  if (!row) return null;
  return {
    id: row.id,
    firmId: row.firm_id,
    stripeAccountId: row.stripe_account_id,
    detailsSubmitted: Boolean(row.details_submitted),
    chargesEnabled: Boolean(row.charges_enabled),
    payoutsEnabled: Boolean(row.payouts_enabled),
    requirementsCurrentlyDue: row.requirements_currently_due || [],
    requirementsDisabledReason: row.requirements_disabled_reason || null,
    onboardingStatus: row.onboarding_status,
    livemode: Boolean(row.livemode),
    createdByUserId: row.created_by_user_id || null,
    lastAccountUpdatedEventId: row.last_account_updated_event_id || null,
    latestTermsVersion: row.latest_terms_version || null,
    latestTermsAcceptedAt: row.latest_terms_accepted_at || null,
    latestTermsAcceptedByUserId: row.latest_terms_accepted_by_user_id || null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

async function findByFirmId(firmId) {
  const sb = getSupabaseAdmin();
  const { data, error } = await sb
    .from('firm_stripe_connect_accounts')
    .select('*')
    .eq('firm_id', firmId)
    .maybeSingle();
  if (error) throw error;
  return mapRow(data);
}

async function findByStripeAccountId(stripeAccountId) {
  const id = String(stripeAccountId || '').trim();
  if (!id) return null;
  const sb = getSupabaseAdmin();
  const { data, error } = await sb
    .from('firm_stripe_connect_accounts')
    .select('*')
    .eq('stripe_account_id', id)
    .maybeSingle();
  if (error) throw error;
  return mapRow(data);
}

async function insertAccount({
  firmId,
  stripeAccountId,
  livemode,
  createdByUserId,
  detailsSubmitted = false,
  chargesEnabled = false,
  payoutsEnabled = false,
  onboardingStatus = 'pending',
  requirementsCurrentlyDue = [],
  requirementsDisabledReason = null,
}) {
  const sb = getSupabaseAdmin();
  const { data, error } = await sb
    .from('firm_stripe_connect_accounts')
    .insert({
      firm_id: firmId,
      stripe_account_id: stripeAccountId,
      livemode: Boolean(livemode),
      created_by_user_id: createdByUserId || null,
      details_submitted: detailsSubmitted,
      charges_enabled: chargesEnabled,
      payouts_enabled: payoutsEnabled,
      onboarding_status: onboardingStatus,
      requirements_currently_due: requirementsCurrentlyDue,
      requirements_disabled_reason: requirementsDisabledReason,
    })
    .select('*')
    .single();
  if (error) throw error;
  return mapRow(data);
}

async function updateByFirmId(firmId, patch) {
  const row = { updated_at: new Date().toISOString() };
  if (patch.detailsSubmitted !== undefined) row.details_submitted = patch.detailsSubmitted;
  if (patch.chargesEnabled !== undefined) row.charges_enabled = patch.chargesEnabled;
  if (patch.payoutsEnabled !== undefined) row.payouts_enabled = patch.payoutsEnabled;
  if (patch.requirementsCurrentlyDue !== undefined) {
    row.requirements_currently_due = patch.requirementsCurrentlyDue;
  }
  if (patch.requirementsDisabledReason !== undefined) {
    row.requirements_disabled_reason = patch.requirementsDisabledReason;
  }
  if (patch.onboardingStatus !== undefined) row.onboarding_status = patch.onboardingStatus;
  if (patch.lastAccountUpdatedEventId !== undefined) {
    row.last_account_updated_event_id = patch.lastAccountUpdatedEventId;
  }
  if (patch.latestTermsVersion !== undefined) row.latest_terms_version = patch.latestTermsVersion;
  if (patch.latestTermsAcceptedAt !== undefined) {
    row.latest_terms_accepted_at = patch.latestTermsAcceptedAt;
  }
  if (patch.latestTermsAcceptedByUserId !== undefined) {
    row.latest_terms_accepted_by_user_id = patch.latestTermsAcceptedByUserId;
  }

  const sb = getSupabaseAdmin();
  const { data, error } = await sb
    .from('firm_stripe_connect_accounts')
    .update(row)
    .eq('firm_id', firmId)
    .select('*')
    .single();
  if (error) throw error;
  return mapRow(data);
}

module.exports = {
  findByFirmId,
  findByStripeAccountId,
  insertAccount,
  updateByFirmId,
  mapRow,
};
