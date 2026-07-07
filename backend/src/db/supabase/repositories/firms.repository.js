const { getSupabaseAdmin } = require('../client');

function mapFirm(row) {
  if (!row) return null;
  return {
    id: row.id,
    _id: row.id,
    name: row.name,
    slug: row.slug,
    status: row.status,
    countryCode: row.country_code,
    trialEndsAt: row.trial_ends_at,
    billingPlan: row.billing_plan,
    stripeCustomerId: row.stripe_customer_id,
    stripeSubscriptionId: row.stripe_subscription_id,
    settings: row.settings || {},
  };
}

async function findFirmById(id) {
  const sb = getSupabaseAdmin();
  const { data, error } = await sb.from('firms').select('*').eq('id', id).maybeSingle();
  if (error) throw error;
  return mapFirm(data);
}

async function findFirmBySlug(slug) {
  const normalized = String(slug || '')
    .trim()
    .toLowerCase();
  if (!normalized) return null;
  const sb = getSupabaseAdmin();
  const { data, error } = await sb.from('firms').select('*').eq('slug', normalized).maybeSingle();
  if (error) throw error;
  return mapFirm(data);
}

/** Resolve escritório por slug ou nome (URLs de demo tipo ?firm=MayaVida). */
async function findFirmBySlugOrLabel(slugOrLabel) {
  const raw = String(slugOrLabel || '').trim();
  if (!raw) return null;
  const bySlug = await findFirmBySlug(raw);
  if (bySlug) return bySlug;
  const slugFromName = raw
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  if (slugFromName && slugFromName !== raw.toLowerCase()) {
    const byDerived = await findFirmBySlug(slugFromName);
    if (byDerived) return byDerived;
  }
  const sb = getSupabaseAdmin();
  const { data, error } = await sb.from('firms').select('*').ilike('name', raw).limit(1).maybeSingle();
  if (error) throw error;
  return mapFirm(data);
}

async function createFirm({ name, slug, countryCode = 'PT' }) {
  const sb = getSupabaseAdmin();
  const trialEndsAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString();
  const { data, error } = await sb
    .from('firms')
    .insert({
      name,
      slug,
      country_code: countryCode,
      status: 'TRIAL',
      trial_ends_at: trialEndsAt,
    })
    .select()
    .single();
  if (error) throw error;
  return mapFirm(data);
}

async function slugExists(slug) {
  const sb = getSupabaseAdmin();
  const { data, error } = await sb.from('firms').select('id').eq('slug', slug).maybeSingle();
  if (error) throw error;
  return Boolean(data);
}

async function mergeSettingsKey(firmId, key, value) {
  const current = await findFirmById(firmId);
  if (!current) return null;
  const settings = { ...(current.settings || {}), [key]: value };
  const sb = getSupabaseAdmin();
  const { data, error } = await sb
    .from('firms')
    .update({ settings, updated_at: new Date().toISOString() })
    .eq('id', firmId)
    .select()
    .single();
  if (error) throw error;
  return mapFirm(data);
}

async function updateFirm(firmId, { name, countryCode, settingsMerge }) {
  const current = await findFirmById(firmId);
  if (!current) return null;
  const row = { updated_at: new Date().toISOString() };
  if (name != null) row.name = String(name).trim();
  if (countryCode != null) row.country_code = String(countryCode).trim().toUpperCase().slice(0, 2);
  if (settingsMerge && typeof settingsMerge === 'object') {
    row.settings = { ...(current.settings || {}), ...settingsMerge };
  }
  const sb = getSupabaseAdmin();
  const { data, error } = await sb.from('firms').update(row).eq('id', firmId).select().single();
  if (error) throw error;
  return mapFirm(data);
}

async function setFirmStatus(firmId, status) {
  const sb = getSupabaseAdmin();
  const { data, error } = await sb
    .from('firms')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', firmId)
    .select()
    .single();
  if (error) throw error;
  return mapFirm(data);
}

async function findFirmByStripeCustomerId(stripeCustomerId) {
  const id = String(stripeCustomerId || '').trim();
  if (!id) return null;
  const sb = getSupabaseAdmin();
  const { data, error } = await sb.from('firms').select('*').eq('stripe_customer_id', id).maybeSingle();
  if (error) throw error;
  return mapFirm(data);
}

async function updateStripeIds(firmId, patch) {
  const row = { updated_at: new Date().toISOString() };
  if (patch.stripeCustomerId !== undefined) row.stripe_customer_id = patch.stripeCustomerId;
  if (patch.stripeSubscriptionId !== undefined) row.stripe_subscription_id = patch.stripeSubscriptionId;
  if (patch.status !== undefined) row.status = patch.status;
  if (patch.billingPlan !== undefined) row.billing_plan = patch.billingPlan;
  const sb = getSupabaseAdmin();
  const { data, error } = await sb.from('firms').update(row).eq('id', firmId).select().single();
  if (error) throw error;
  return mapFirm(data);
}

async function updateFirmBranding(firmId, brandingPatch) {
  const current = await findFirmById(firmId);
  if (!current) return null;
  const settings = {
    ...(current.settings || {}),
    branding: {
      ...((current.settings || {}).branding || {}),
      ...brandingPatch,
    },
  };
  const sb = getSupabaseAdmin();
  const { data, error } = await sb
    .from('firms')
    .update({ settings, updated_at: new Date().toISOString() })
    .eq('id', firmId)
    .select()
    .single();
  if (error) throw error;
  return mapFirm(data);
}

async function clearFirmLogoBranding(firmId) {
  const current = await findFirmById(firmId);
  if (!current) return null;
  const branding = { ...((current.settings || {}).branding || {}) };
  delete branding.logoStorageKey;
  delete branding.logoUrl;
  delete branding.logoUpdatedAt;
  const settings = {
    ...(current.settings || {}),
    branding,
  };
  const sb = getSupabaseAdmin();
  const { data, error } = await sb
    .from('firms')
    .update({ settings, updated_at: new Date().toISOString() })
    .eq('id', firmId)
    .select()
    .single();
  if (error) throw error;
  return mapFirm(data);
}

module.exports = {
  findFirmById,
  findFirmBySlug,
  findFirmBySlugOrLabel,
  createFirm,
  slugExists,
  mapFirm,
  mergeSettingsKey,
  updateFirm,
  setFirmStatus,
  findFirmByStripeCustomerId,
  updateStripeIds,
  updateFirmBranding,
  clearFirmLogoBranding,
};
