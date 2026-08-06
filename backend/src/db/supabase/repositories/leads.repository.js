const { getSupabaseAdmin } = require('../client');

function map(row) {
  if (!row) return null;
  return {
    id: row.id,
    firmId: row.firm_id,
    name: row.name,
    email: row.email,
    phone: row.phone,
    taxId: row.tax_id,
    source: row.source,
    status: row.status,
    consentMarketing: row.consent_marketing,
    convertedClientId: row.converted_client_id,
    convertedAt: row.converted_at,
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

async function listByFirm(firmId, { status, limit = 200, offset = 0 } = {}) {
  const sb = getSupabaseAdmin();
  let q = sb
    .from('leads')
    .select('*')
    .eq('firm_id', firmId)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);
  if (status) q = q.eq('status', status);
  const { data, error } = await q;
  if (error) throw error;
  return (data || []).map(map);
}

async function findByIdForFirm(id, firmId) {
  const sb = getSupabaseAdmin();
  const { data, error } = await sb.from('leads').select('*').eq('id', id).eq('firm_id', firmId).maybeSingle();
  if (error) throw error;
  return map(data);
}

/**
 * Match determinístico: NIF exacto, depois email exacto, nunca cross-tenant.
 * `email` deve chegar já normalizado (trim + lowercase) pelo chamador — a coluna
 * `email` é sempre gravada em lowercase (ver createRow/updateRow), por isso um
 * `.eq()` simples já é case-insensitive na prática, sem usar `.ilike()` (que
 * trata `%`/`_` no valor como wildcard — um email real pode conter esses
 * caracteres no local-part e causar um match incorrecto/mais amplo do que o
 * pretendido).
 */
async function findMatchForFirm(firmId, { email, taxId }) {
  const sb = getSupabaseAdmin();
  if (taxId) {
    const { data, error } = await sb
      .from('leads')
      .select('*')
      .eq('firm_id', firmId)
      .eq('tax_id', taxId)
      .neq('status', 'CONVERTED')
      .order('created_at', { ascending: true })
      .limit(1)
      .maybeSingle();
    if (error) throw error;
    if (data) return map(data);
  }
  if (email) {
    const { data, error } = await sb
      .from('leads')
      .select('*')
      .eq('firm_id', firmId)
      .eq('email', email)
      .neq('status', 'CONVERTED')
      .order('created_at', { ascending: true })
      .limit(1)
      .maybeSingle();
    if (error) throw error;
    if (data) return map(data);
  }
  return null;
}

async function createRow({ firmId, name, email, phone, taxId, source, createdBy }) {
  const sb = getSupabaseAdmin();
  const { data, error } = await sb
    .from('leads')
    .insert({
      firm_id: firmId,
      name: String(name).trim(),
      email: email ? String(email).trim().toLowerCase() : null,
      phone: phone ? String(phone).trim() : null,
      tax_id: taxId ? String(taxId).replace(/\D+/g, '') || null : null,
      source: source || 'MANUAL',
      created_by: createdBy || null,
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
  if (patch.email !== undefined) row.email = patch.email ? String(patch.email).trim().toLowerCase() : null;
  if (patch.phone !== undefined) row.phone = patch.phone ? String(patch.phone).trim() : null;
  if (patch.taxId !== undefined) row.tax_id = patch.taxId ? String(patch.taxId).replace(/\D+/g, '') || null : null;
  if (patch.status !== undefined) row.status = patch.status;
  if (patch.consentMarketing !== undefined) row.consent_marketing = patch.consentMarketing;

  const { data, error } = await sb.from('leads').update(row).eq('id', id).eq('firm_id', firmId).select().maybeSingle();
  if (error) throw error;
  return map(data);
}

async function markConverted(id, firmId, clientId) {
  const sb = getSupabaseAdmin();
  const { data, error } = await sb
    .from('leads')
    .update({
      status: 'CONVERTED',
      converted_client_id: clientId,
      converted_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .eq('firm_id', firmId)
    .select()
    .maybeSingle();
  if (error) throw error;
  return map(data);
}

module.exports = {
  listByFirm,
  findByIdForFirm,
  findMatchForFirm,
  createRow,
  updateRow,
  markConverted,
  map,
};
