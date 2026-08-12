const { getSupabaseAdmin } = require('../client');

function mapTag(row) {
  if (!row) return null;
  return {
    id: row.id,
    firmId: row.firm_id,
    name: row.name,
    colorHex: row.color_hex || '#0F2942',
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

async function listByFirm(firmId) {
  const sb = getSupabaseAdmin();
  const { data, error } = await sb
    .from('firm_inquiry_tags')
    .select('*')
    .eq('firm_id', firmId)
    .order('name', { ascending: true });
  if (error) throw error;
  return (data || []).map(mapTag);
}

async function findByIdForFirm(id, firmId) {
  const sb = getSupabaseAdmin();
  const { data, error } = await sb
    .from('firm_inquiry_tags')
    .select('*')
    .eq('id', id)
    .eq('firm_id', firmId)
    .maybeSingle();
  if (error) throw error;
  return mapTag(data);
}

async function createRow({ firmId, name, colorHex }) {
  const sb = getSupabaseAdmin();
  const { data, error } = await sb
    .from('firm_inquiry_tags')
    .insert({
      firm_id: firmId,
      name: String(name).trim(),
      color_hex: String(colorHex || '#0F2942').trim(),
    })
    .select('*')
    .single();
  if (error) throw error;
  return mapTag(data);
}

async function updateRow(id, firmId, { name, colorHex }) {
  const sb = getSupabaseAdmin();
  const patch = { updated_at: new Date().toISOString() };
  if (name != null) patch.name = String(name).trim();
  if (colorHex != null) patch.color_hex = String(colorHex).trim();
  const { data, error } = await sb
    .from('firm_inquiry_tags')
    .update(patch)
    .eq('id', id)
    .eq('firm_id', firmId)
    .select('*')
    .maybeSingle();
  if (error) throw error;
  return mapTag(data);
}

async function removeRow(id, firmId) {
  const sb = getSupabaseAdmin();
  const { error } = await sb.from('firm_inquiry_tags').delete().eq('id', id).eq('firm_id', firmId);
  if (error) throw error;
  return { ok: true };
}

async function listLinksForInquiries(firmId, inquiryIds) {
  if (!inquiryIds?.length) return [];
  const sb = getSupabaseAdmin();
  const { data, error } = await sb
    .from('service_inquiry_tag_links')
    .select('service_inquiry_id, tag_id, firm_inquiry_tags(id, name, color_hex)')
    .eq('firm_id', firmId)
    .in('service_inquiry_id', inquiryIds);
  if (error) throw error;
  return data || [];
}

async function replaceLinksForInquiry(firmId, inquiryId, tagIds) {
  const sb = getSupabaseAdmin();
  const { error: delError } = await sb
    .from('service_inquiry_tag_links')
    .delete()
    .eq('firm_id', firmId)
    .eq('service_inquiry_id', inquiryId);
  if (delError) throw delError;

  const unique = [...new Set((tagIds || []).filter(Boolean))];
  if (!unique.length) return [];

  const rows = unique.map((tagId) => ({
    firm_id: firmId,
    service_inquiry_id: inquiryId,
    tag_id: tagId,
  }));
  const { data, error } = await sb.from('service_inquiry_tag_links').insert(rows).select('tag_id');
  if (error) throw error;
  return (data || []).map((r) => r.tag_id);
}

module.exports = {
  listByFirm,
  findByIdForFirm,
  createRow,
  updateRow,
  removeRow,
  listLinksForInquiries,
  replaceLinksForInquiry,
};
