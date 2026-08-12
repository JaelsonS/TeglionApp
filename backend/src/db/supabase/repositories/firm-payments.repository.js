const crypto = require('crypto');
const { getSupabaseAdmin } = require('../client');

function mapRow(row) {
  if (!row) return null;
  return {
    id: row.id,
    firmId: row.firm_id,
    purpose: row.purpose,
    referenceType: row.reference_type,
    referenceId: row.reference_id,
    amountCents: row.amount_cents,
    currency: row.currency,
    status: row.status,
    stripeCheckoutSessionId: row.stripe_checkout_session_id || null,
    stripePaymentIntentId: row.stripe_payment_intent_id || null,
    stripeAccountId: row.stripe_account_id,
    checkoutExpiresAt: row.checkout_expires_at || null,
    publicStatusToken: row.public_status_token,
    paidAt: row.paid_at || null,
    failedAt: row.failed_at || null,
    metadata: row.metadata || {},
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function newPublicStatusToken() {
  return crypto.randomBytes(24).toString('hex');
}

async function insertPayment(data) {
  const sb = getSupabaseAdmin();
  const { data: inserted, error } = await sb
    .from('firm_payments')
    .insert({
      firm_id: data.firmId,
      purpose: data.purpose,
      reference_type: data.referenceType,
      reference_id: data.referenceId,
      amount_cents: data.amountCents,
      currency: data.currency || 'EUR',
      status: data.status || 'pending',
      stripe_checkout_session_id: data.stripeCheckoutSessionId || null,
      stripe_payment_intent_id: data.stripePaymentIntentId || null,
      stripe_account_id: data.stripeAccountId,
      checkout_expires_at: data.checkoutExpiresAt || null,
      public_status_token: data.publicStatusToken || newPublicStatusToken(),
      metadata: data.metadata || {},
    })
    .select('*')
    .single();
  if (error) throw error;
  return mapRow(inserted);
}

async function updatePayment(id, firmId, patch) {
  const row = { updated_at: new Date().toISOString() };
  if (patch.status !== undefined) row.status = patch.status;
  if (patch.stripeCheckoutSessionId !== undefined) {
    row.stripe_checkout_session_id = patch.stripeCheckoutSessionId;
  }
  if (patch.stripePaymentIntentId !== undefined) {
    row.stripe_payment_intent_id = patch.stripePaymentIntentId;
  }
  if (patch.checkoutExpiresAt !== undefined) row.checkout_expires_at = patch.checkoutExpiresAt;
  if (patch.paidAt !== undefined) row.paid_at = patch.paidAt;
  if (patch.failedAt !== undefined) row.failed_at = patch.failedAt;
  if (patch.metadata !== undefined) row.metadata = patch.metadata;

  const sb = getSupabaseAdmin();
  const { data, error } = await sb
    .from('firm_payments')
    .update(row)
    .eq('id', id)
    .eq('firm_id', firmId)
    .select('*')
    .maybeSingle();
  if (error) throw error;
  return mapRow(data);
}

async function findByIdForFirm(id, firmId) {
  const sb = getSupabaseAdmin();
  const { data, error } = await sb
    .from('firm_payments')
    .select('*')
    .eq('id', id)
    .eq('firm_id', firmId)
    .maybeSingle();
  if (error) throw error;
  return mapRow(data);
}

async function findByCheckoutSessionId(sessionId) {
  const id = String(sessionId || '').trim();
  if (!id) return null;
  const sb = getSupabaseAdmin();
  const { data, error } = await sb
    .from('firm_payments')
    .select('*')
    .eq('stripe_checkout_session_id', id)
    .maybeSingle();
  if (error) throw error;
  return mapRow(data);
}

async function findByPublicToken(token) {
  const t = String(token || '').trim();
  if (!t) return null;
  const sb = getSupabaseAdmin();
  const { data, error } = await sb
    .from('firm_payments')
    .select('*')
    .eq('public_status_token', t)
    .maybeSingle();
  if (error) throw error;
  return mapRow(data);
}

async function listExpiredPending({ beforeIso, limit = 50 } = {}) {
  const sb = getSupabaseAdmin();
  const { data, error } = await sb
    .from('firm_payments')
    .select('*')
    .eq('status', 'pending')
    .lt('checkout_expires_at', beforeIso || new Date().toISOString())
    .order('checkout_expires_at', { ascending: true })
    .limit(limit);
  if (error) throw error;
  return (data || []).map(mapRow);
}

module.exports = {
  insertPayment,
  updatePayment,
  findByIdForFirm,
  findByCheckoutSessionId,
  findByPublicToken,
  listExpiredPending,
  newPublicStatusToken,
  mapRow,
};
