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

function mapEmbeddedTag(row) {
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    colorHex: row.color_hex || '#0F2942',
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
  return replaceEntityLinks({
    firmId,
    table: 'service_inquiry_tag_links',
    entityColumn: 'service_inquiry_id',
    entityId: inquiryId,
    tagIds,
  });
}

async function listLinksForClients(firmId, clientIds) {
  if (!clientIds?.length) return [];
  const sb = getSupabaseAdmin();
  const { data, error } = await sb
    .from('client_tag_links')
    .select('client_id, tag_id, firm_inquiry_tags(id, name, color_hex)')
    .eq('firm_id', firmId)
    .in('client_id', clientIds);
  if (error) throw error;
  return data || [];
}

async function replaceLinksForClient(firmId, clientId, tagIds) {
  return replaceEntityLinks({
    firmId,
    table: 'client_tag_links',
    entityColumn: 'client_id',
    entityId: clientId,
    tagIds,
  });
}

async function listLinksForLeads(firmId, leadIds) {
  if (!leadIds?.length) return [];
  const sb = getSupabaseAdmin();
  const { data, error } = await sb
    .from('lead_tag_links')
    .select('lead_id, tag_id, firm_inquiry_tags(id, name, color_hex)')
    .eq('firm_id', firmId)
    .in('lead_id', leadIds);
  if (error) throw error;
  return data || [];
}

async function replaceLinksForLead(firmId, leadId, tagIds) {
  return replaceEntityLinks({
    firmId,
    table: 'lead_tag_links',
    entityColumn: 'lead_id',
    entityId: leadId,
    tagIds,
  });
}

async function listLinksForFirmUsers(firmId, firmUserIds) {
  if (!firmUserIds?.length) return [];
  const sb = getSupabaseAdmin();
  const { data, error } = await sb
    .from('firm_user_tag_links')
    .select('firm_user_id, tag_id, firm_inquiry_tags(id, name, color_hex)')
    .eq('firm_id', firmId)
    .in('firm_user_id', firmUserIds);
  if (error) throw error;
  return data || [];
}

async function replaceLinksForFirmUser(firmId, firmUserId, tagIds) {
  return replaceEntityLinks({
    firmId,
    table: 'firm_user_tag_links',
    entityColumn: 'firm_user_id',
    entityId: firmUserId,
    tagIds,
  });
}

/** Copia etiquetas do lead para o cliente (conversão). */
async function copyLeadTagsToClient(firmId, leadId, clientId) {
  const rows = await listLinksForLeads(firmId, [leadId]);
  const tagIds = rows.map((r) => r.tag_id).filter(Boolean);
  return replaceLinksForClient(firmId, clientId, tagIds);
}

async function replaceEntityLinks({ firmId, table, entityColumn, entityId, tagIds }) {
  const sb = getSupabaseAdmin();
  const { error: delError } = await sb
    .from(table)
    .delete()
    .eq('firm_id', firmId)
    .eq(entityColumn, entityId);
  if (delError) throw delError;

  const unique = [...new Set((tagIds || []).filter(Boolean))];
  if (!unique.length) return [];

  const rows = unique.map((tagId) => ({
    firm_id: firmId,
    [entityColumn]: entityId,
    tag_id: tagId,
  }));
  const { data, error } = await sb.from(table).insert(rows).select('tag_id');
  if (error) throw error;
  return (data || []).map((r) => r.tag_id);
}

function mapLinkRowsToTagsByKey(linkRows, entityKey) {
  const byEntity = new Map();
  for (const row of linkRows || []) {
    const entityId = row[entityKey];
    const tag = mapEmbeddedTag(row.firm_inquiry_tags);
    if (!entityId || !tag) continue;
    const list = byEntity.get(entityId) || [];
    list.push(tag);
    byEntity.set(entityId, list);
  }
  return byEntity;
}

/** Filtra tagIds para os que existem no catálogo do escritório. */
async function resolveAllowedTagIds(firmId, tagIds) {
  const firmTags = await module.exports.listByFirm(firmId);
  const allowed = new Set(firmTags.map((t) => t.id));
  return [...new Set((tagIds || []).map(String).filter((tid) => allowed.has(tid)))];
}

module.exports = {
  listByFirm,
  findByIdForFirm,
  createRow,
  updateRow,
  removeRow,
  listLinksForInquiries,
  replaceLinksForInquiry,
  listLinksForClients,
  replaceLinksForClient,
  listLinksForLeads,
  replaceLinksForLead,
  listLinksForFirmUsers,
  replaceLinksForFirmUser,
  copyLeadTagsToClient,
  mapLinkRowsToTagsByKey,
  mapEmbeddedTag,
  resolveAllowedTagIds,
};
