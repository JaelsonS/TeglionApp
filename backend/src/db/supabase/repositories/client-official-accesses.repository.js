const { getSupabaseAdmin } = require('../client');
const { encryptField, decryptField } = require('../../../utils/crypto-fields');

function mapSummary(row) {
  if (!row) return null;
  return {
    id: row.id,
    firmId: row.firm_id,
    clientId: row.client_id,
    portalKey: row.portal_key,
    label: row.label || null,
    username: row.username || null,
    hasPassword: Boolean(row.secret_enc),
    updatedAt: row.updated_at,
    updatedBy: row.updated_by || null,
  };
}

async function listByClient(firmId, clientId) {
  const sb = getSupabaseAdmin();
  const { data, error } = await sb
    .from('client_official_accesses')
    .select('id, firm_id, client_id, portal_key, label, username, secret_enc, updated_at, updated_by')
    .eq('firm_id', firmId)
    .eq('client_id', clientId)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return (data || []).map(mapSummary);
}

async function findById(firmId, clientId, id) {
  const sb = getSupabaseAdmin();
  const { data, error } = await sb
    .from('client_official_accesses')
    .select('*')
    .eq('firm_id', firmId)
    .eq('client_id', clientId)
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  return data;
}

async function findByPortalKey(firmId, clientId, portalKey) {
  const sb = getSupabaseAdmin();
  const { data, error } = await sb
    .from('client_official_accesses')
    .select('*')
    .eq('firm_id', firmId)
    .eq('client_id', clientId)
    .eq('portal_key', portalKey)
    .maybeSingle();
  if (error) throw error;
  return data;
}

function decryptSecret(row) {
  if (!row?.secret_enc) return null;
  return decryptField(row.secret_enc);
}

async function insertRow({ firmId, clientId, portalKey, label, username, password, updatedBy }) {
  const sb = getSupabaseAdmin();
  const { data, error } = await sb
    .from('client_official_accesses')
    .insert({
      firm_id: firmId,
      client_id: clientId,
      portal_key: portalKey,
      label: label || null,
      username: username || null,
      secret_enc: password ? encryptField(password) : null,
      updated_by: updatedBy || null,
      updated_at: new Date().toISOString(),
    })
    .select('id, firm_id, client_id, portal_key, label, username, secret_enc, updated_at, updated_by')
    .single();
  if (error) throw error;
  return mapSummary(data);
}

async function updateRow(firmId, clientId, id, patch) {
  const sb = getSupabaseAdmin();
  const row = { updated_at: new Date().toISOString() };
  if (patch.label !== undefined) row.label = patch.label;
  if (patch.username !== undefined) row.username = patch.username;
  if (patch.password !== undefined) {
    row.secret_enc = patch.password ? encryptField(patch.password) : null;
  }
  if (patch.updatedBy !== undefined) row.updated_by = patch.updatedBy;
  const { data, error } = await sb
    .from('client_official_accesses')
    .update(row)
    .eq('firm_id', firmId)
    .eq('client_id', clientId)
    .eq('id', id)
    .select('id, firm_id, client_id, portal_key, label, username, secret_enc, updated_at, updated_by')
    .single();
  if (error) throw error;
  return mapSummary(data);
}

async function deleteRow(firmId, clientId, id) {
  const sb = getSupabaseAdmin();
  const { error } = await sb
    .from('client_official_accesses')
    .delete()
    .eq('firm_id', firmId)
    .eq('client_id', clientId)
    .eq('id', id);
  if (error) throw error;
}

async function listUsernamesByFirm(firmId) {
  const sb = getSupabaseAdmin();
  const { data, error } = await sb
    .from('client_official_accesses')
    .select('client_id, portal_key, username')
    .eq('firm_id', firmId);
  if (error) throw error;
  return (data || []).map((row) => ({
    clientId: row.client_id,
    portalKey: row.portal_key,
    username: row.username || '',
  }));
}

module.exports = {
  listByClient,
  findById,
  findByPortalKey,
  decryptSecret,
  insertRow,
  updateRow,
  deleteRow,
  listUsernamesByFirm,
  mapSummary,
};
