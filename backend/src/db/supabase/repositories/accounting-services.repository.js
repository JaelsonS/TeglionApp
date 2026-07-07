const { getSupabaseAdmin } = require('../client');

function map(row) {
  if (!row) return null;
  return {
    id: row.id,
    firmId: row.firm_id,
    catalogKey: row.catalog_key || null,
    name: row.name,
    description: row.description,
    durationMinutes: row.duration_minutes,
    priceCents: row.price_cents,
    currency: row.currency || 'EUR',
    isActive: row.is_active,
    sortOrder: row.sort_order,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

async function listByFirm(firmId, { activeOnly = false } = {}) {
  const sb = getSupabaseAdmin();
  let q = sb
    .from('accounting_services')
    .select('*')
    .eq('firm_id', firmId)
    .order('sort_order', { ascending: true })
    .order('name', { ascending: true });
  if (activeOnly) q = q.eq('is_active', true);
  const { data, error } = await q;
  if (error) throw error;
  return (data || []).map(map);
}

async function findByIdForFirm(id, firmId) {
  const sb = getSupabaseAdmin();
  const { data, error } = await sb
    .from('accounting_services')
    .select('*')
    .eq('id', id)
    .eq('firm_id', firmId)
    .maybeSingle();
  if (error) throw error;
  return map(data);
}

async function createRow({
  firmId,
  name,
  description,
  durationMinutes,
  priceCents,
  currency,
  sortOrder,
  catalogKey,
  isActive,
}) {
  const sb = getSupabaseAdmin();
  const { data, error } = await sb
    .from('accounting_services')
    .insert({
      firm_id: firmId,
      catalog_key: catalogKey || null,
      name: String(name).trim(),
      description: description != null ? String(description).trim() : null,
      duration_minutes: durationMinutes ?? 60,
      price_cents: priceCents ?? 0,
      currency: currency || 'EUR',
      is_active: isActive !== false,
      sort_order: sortOrder ?? 0,
    })
    .select()
    .single();
  if (error) throw error;
  return map(data);
}

async function updateRow(id, firmId, patch) {
  const sb = getSupabaseAdmin();
  const row = { updated_at: new Date().toISOString() };
  if (patch.name !== undefined) row.name = String(patch.name).trim();
  if (patch.description !== undefined) {
    row.description = patch.description != null ? String(patch.description).trim() : null;
  }
  if (patch.durationMinutes !== undefined) row.duration_minutes = patch.durationMinutes;
  if (patch.priceCents !== undefined) row.price_cents = patch.priceCents;
  if (patch.currency !== undefined) row.currency = patch.currency;
  if (patch.isActive !== undefined) row.is_active = Boolean(patch.isActive);
  if (patch.sortOrder !== undefined) row.sort_order = patch.sortOrder;

  const { data, error } = await sb
    .from('accounting_services')
    .update(row)
    .eq('id', id)
    .eq('firm_id', firmId)
    .select()
    .maybeSingle();
  if (error) throw error;
  return map(data);
}

async function bulkUpdate(ids, firmId, patch) {
  const sb = getSupabaseAdmin();
  const row = { updated_at: new Date().toISOString() };
  if (patch.isActive !== undefined) row.is_active = Boolean(patch.isActive);
  if (patch.durationMinutes !== undefined) row.duration_minutes = patch.durationMinutes;
  if (patch.priceCents !== undefined) row.price_cents = patch.priceCents;

  const { data, error } = await sb
    .from('accounting_services')
    .update(row)
    .eq('firm_id', firmId)
    .in('id', ids)
    .select();
  if (error) throw error;
  return (data || []).map(map);
}

async function listCatalogKeys(firmId) {
  const sb = getSupabaseAdmin();
  const { data, error } = await sb
    .from('accounting_services')
    .select('catalog_key')
    .eq('firm_id', firmId)
    .not('catalog_key', 'is', null);
  if (error) throw error;
  return new Set((data || []).map((r) => r.catalog_key).filter(Boolean));
}

module.exports = {
  listByFirm,
  findByIdForFirm,
  createRow,
  updateRow,
  bulkUpdate,
  listCatalogKeys,
  map,
};
