const { getSupabaseAdmin } = require('../client');

function map(row) {
  if (!row) return null;
  return {
    parentServiceId: row.parent_service_id,
    childServiceId: row.child_service_id,
    firmId: row.firm_id,
    sortOrder: Number(row.sort_order) || 0,
    createdAt: row.created_at,
  };
}

async function listByFirm(firmId) {
  const sb = getSupabaseAdmin();
  const { data, error } = await sb
    .from('accounting_service_option_links')
    .select('*')
    .eq('firm_id', firmId)
    .order('sort_order', { ascending: true });
  if (error) throw error;
  return (data || []).map(map);
}

async function listByParent(firmId, parentServiceId) {
  const sb = getSupabaseAdmin();
  const { data, error } = await sb
    .from('accounting_service_option_links')
    .select('*')
    .eq('firm_id', firmId)
    .eq('parent_service_id', parentServiceId)
    .order('sort_order', { ascending: true });
  if (error) throw error;
  return (data || []).map(map);
}

async function listParentIdsForChild(firmId, childServiceId) {
  const sb = getSupabaseAdmin();
  const { data, error } = await sb
    .from('accounting_service_option_links')
    .select('parent_service_id')
    .eq('firm_id', firmId)
    .eq('child_service_id', childServiceId);
  if (error) throw error;
  return (data || []).map((r) => r.parent_service_id);
}

async function replaceForParent(firmId, parentServiceId, childIdsOrdered) {
  const sb = getSupabaseAdmin();
  const { error: delErr } = await sb
    .from('accounting_service_option_links')
    .delete()
    .eq('firm_id', firmId)
    .eq('parent_service_id', parentServiceId);
  if (delErr) throw delErr;

  if (!childIdsOrdered.length) return [];

  const rows = childIdsOrdered.map((childServiceId, index) => ({
    parent_service_id: parentServiceId,
    child_service_id: childServiceId,
    firm_id: firmId,
    sort_order: index,
  }));
  const { data, error } = await sb.from('accounting_service_option_links').insert(rows).select('*');
  if (error) throw error;
  return (data || []).map(map);
}

module.exports = {
  listByFirm,
  listByParent,
  listParentIdsForChild,
  replaceForParent,
};
