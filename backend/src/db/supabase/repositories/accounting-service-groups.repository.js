const { getSupabaseAdmin } = require('../client');

function map(row) {
  if (!row) return null;
  return {
    id: row.id,
    firmId: row.firm_id,
    name: row.name,
    isActive: Boolean(row.is_active),
    isPubliclyListed: Boolean(row.is_publicly_listed),
    sortOrder: row.sort_order,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

async function listByFirm(firmId) {
  const sb = getSupabaseAdmin();
  const { data, error } = await sb
    .from('accounting_service_groups')
    .select('*')
    .eq('firm_id', firmId)
    .order('sort_order', { ascending: true })
    .order('name', { ascending: true });
  if (error) throw error;
  return (data || []).map(map);
}

async function findByIdForFirm(id, firmId) {
  const sb = getSupabaseAdmin();
  const { data, error } = await sb
    .from('accounting_service_groups')
    .select('*')
    .eq('id', id)
    .eq('firm_id', firmId)
    .maybeSingle();
  if (error) throw error;
  return map(data);
}

async function createRow({ firmId, name, sortOrder, isActive, isPubliclyListed }) {
  const sb = getSupabaseAdmin();
  const { data, error } = await sb
    .from('accounting_service_groups')
    .insert({
      firm_id: firmId,
      name: String(name).trim(),
      sort_order: sortOrder ?? 0,
      is_active: isActive !== false,
      is_publicly_listed: isPubliclyListed !== false,
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
  if (patch.sortOrder !== undefined) row.sort_order = patch.sortOrder;
  if (patch.isActive !== undefined) row.is_active = Boolean(patch.isActive);
  if (patch.isPubliclyListed !== undefined) row.is_publicly_listed = Boolean(patch.isPubliclyListed);
  const { data, error } = await sb
    .from('accounting_service_groups')
    .update(row)
    .eq('id', id)
    .eq('firm_id', firmId)
    .select()
    .maybeSingle();
  if (error) throw error;
  return map(data);
}

async function deleteRow(id, firmId) {
  const sb = getSupabaseAdmin();
  const { error } = await sb.from('accounting_service_groups').delete().eq('id', id).eq('firm_id', firmId);
  if (error) throw error;
}

module.exports = {
  listByFirm,
  findByIdForFirm,
  createRow,
  updateRow,
  deleteRow,
  map,
};
