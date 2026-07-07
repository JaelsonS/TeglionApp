const { getSupabaseAdmin } = require('../client');

function mapClient(row) {
  if (!row) return null;
  return {
    id: row.id,
    _id: row.id,
    firmId: row.firm_id,
    displayName: row.display_name,
    name: row.display_name,
    fullName: row.display_name,
    email: row.email,
    phone: row.phone,
    taxId: row.tax_id,
    status: row.status,
    linkStatus: row.link_status,
    hasPortalAccess: Boolean(row.password_hash),
    lastLoginAt: row.last_login_at,
    assignedStaffId: row.assigned_staff_id,
    metadata: row.metadata || {},
  };
}

async function listClients(firmId, { limit = 100, offset = 0, includeInactive = false } = {}) {
  const sb = getSupabaseAdmin();
  let q = sb.from('clients').select('*').eq('firm_id', firmId).order('updated_at', { ascending: false });
  if (!includeInactive) q = q.eq('status', 'ACTIVE');
  const { data, error } = await q.range(offset, offset + limit - 1);
  if (error) throw error;
  return (data || []).map(mapClient);
}

async function countClients(firmId, { includeInactive = false } = {}) {
  const sb = getSupabaseAdmin();
  let q = sb.from('clients').select('id', { count: 'exact', head: true }).eq('firm_id', firmId);
  if (!includeInactive) q = q.eq('status', 'ACTIVE');
  const { count, error } = await q;
  if (error) throw error;
  return count ?? 0;
}

async function touchClientLogin(clientId) {
  const sb = getSupabaseAdmin();
  const { error } = await sb
    .from('clients')
    .update({ last_login_at: new Date().toISOString() })
    .eq('id', clientId);
  if (error) throw error;
}

async function updateClient(id, firmId, patch) {
  const sb = getSupabaseAdmin();
  const row = { updated_at: new Date().toISOString() };
  if (patch.assignedStaffId !== undefined) row.assigned_staff_id = patch.assignedStaffId;
  if (patch.displayName !== undefined) row.display_name = patch.displayName;
  if (patch.phone !== undefined) row.phone = patch.phone;
  if (patch.email !== undefined) row.email = patch.email ? String(patch.email).trim().toLowerCase() : null;
  if (patch.taxId !== undefined) row.tax_id = patch.taxId || null;
  if (patch.status !== undefined) row.status = patch.status;
  if (patch.metadata !== undefined) row.metadata = patch.metadata;
  const { data, error } = await sb.from('clients').update(row).eq('id', id).eq('firm_id', firmId).select().maybeSingle();
  if (error) throw error;
  return mapClient(data);
}

async function findClientsByIds(firmId, clientIds) {
  const ids = [...new Set((clientIds || []).filter(Boolean))];
  if (!ids.length) return [];
  const sb = getSupabaseAdmin();
  const { data, error } = await sb
    .from('clients')
    .select('id, firm_id, display_name, email, phone, tax_id, status, link_status, password_hash, last_login_at, assigned_staff_id, metadata')
    .eq('firm_id', firmId)
    .in('id', ids);
  if (error) throw error;
  return (data || []).map(mapClient);
}

async function findClientById(firmId, clientId) {
  const sb = getSupabaseAdmin();
  const { data, error } = await sb
    .from('clients')
    .select('*')
    .eq('firm_id', firmId)
    .eq('id', clientId)
    .maybeSingle();
  if (error) throw error;
  return mapClient(data);
}

async function findClientsByEmail(email) {
  const sb = getSupabaseAdmin();
  const normalized = String(email || '').trim().toLowerCase();
  if (!normalized) return [];
  const { data, error } = await sb
    .from('clients')
    .select('*')
    .eq('email', normalized)
    .order('updated_at', { ascending: false });
  if (error) throw error;
  return (data || []).map(mapClient);
}

async function findClientByEmailForFirm(email, firmId) {
  const sb = getSupabaseAdmin();
  const normalized = String(email || '').trim().toLowerCase();
  if (!normalized || !firmId) return null;
  const { data, error } = await sb
    .from('clients')
    .select('*')
    .eq('email', normalized)
    .eq('firm_id', firmId)
    .maybeSingle();
  if (error) throw error;
  return mapClient(data);
}

/** @deprecated Prefer findClientByEmailForFirm — global lookup is unsafe for multi-tenant login. */
async function findClientByEmail(email) {
  const list = await findClientsByEmail(email);
  const preferred = list.find((r) => r.hasPortalAccess) || list[0];
  return preferred || null;
}

async function findClientByTaxId(firmId, taxId) {
  const normalized = String(taxId || '').replace(/\D+/g, '');
  if (!normalized) return null;
  const sb = getSupabaseAdmin();
  const { data, error } = await sb
    .from('clients')
    .select('*')
    .eq('firm_id', firmId)
    .eq('tax_id', normalized)
    .maybeSingle();
  if (error) throw error;
  return mapClient(data);
}

async function createClient({ firmId, displayName, email, phone, taxId, metadata, assignedStaffId }) {
  const sb = getSupabaseAdmin();
  const row = {
    firm_id: firmId,
    display_name: displayName,
    email: email || null,
    phone: phone || null,
    tax_id: taxId || null,
    status: 'ACTIVE',
    link_status: 'APPROVED',
  };
  if (assignedStaffId) row.assigned_staff_id = assignedStaffId;
  if (metadata && typeof metadata === 'object' && Object.keys(metadata).length) {
    row.metadata = metadata;
  }
  const { data, error } = await sb
    .from('clients')
    .insert(row)
    .select()
    .single();
  if (error) throw error;
  return mapClient(data);
}

async function updateClientAuth(clientId, { passwordHash, refreshTokenHash, refreshTokenExpiresAt }) {
  const sb = getSupabaseAdmin();
  const row = {};
  if (passwordHash !== undefined) row.password_hash = passwordHash;
  if (refreshTokenHash !== undefined) row.refresh_token_hash = refreshTokenHash;
  if (refreshTokenExpiresAt !== undefined) row.refresh_token_expires_at = refreshTokenExpiresAt;
  const { data, error } = await sb.from('clients').update(row).eq('id', clientId).select().single();
  if (error) throw error;
  return mapClient(data);
}

async function getClientRowById(clientId) {
  const sb = getSupabaseAdmin();
  const { data, error } = await sb.from('clients').select('*').eq('id', clientId).maybeSingle();
  if (error) throw error;
  return data;
}

module.exports = {
  mapClient,
  listClients,
  countClients,
  findClientById,
  findClientsByIds,
  findClientsByEmail,
  findClientByEmailForFirm,
  findClientByEmail,
  findClientByTaxId,
  createClient,
  updateClient,
  updateClientAuth,
  touchClientLogin,
  getClientRowById,
};
