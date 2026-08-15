const { getSupabaseAdmin } = require('../client');
const { encryptField, decryptField } = require('../../../utils/crypto-fields');

/**
 * Encripta o blob inteiro de respostas (enc:v1), não campo a campo — as
 * perguntas são configuradas livremente pela contabilista, o Teglion não sabe
 * de antemão quais são sensíveis (ver especificação da sessão, v8, secção 1E).
 */
function encryptAnswers(answers) {
  if (!answers) return null;
  return encryptField(JSON.stringify(answers));
}

function decryptAnswers(value) {
  if (!value) return null;
  return JSON.parse(decryptField(value));
}

function map(row) {
  if (!row) return null;
  return {
    id: row.id,
    firmId: row.firm_id,
    serviceId: row.service_id,
    leadId: row.lead_id,
    clientId: row.client_id,
    consultationId: row.consultation_id,
    status: row.status,
    assignedStaffId: row.assigned_staff_id,
    notes: row.notes,
    // answers_enc é a forma actual; answers (JSONB em texto plano) é lida como
    // fallback só para linhas antigas que possam existir de antes desta migration.
    answers: row.answers_enc ? decryptAnswers(row.answers_enc) : row.answers || null,
    submittedAt: row.submitted_at || null,
    accessToken: row.access_token || null,
    accessTokenExpiresAt: row.access_token_expires_at || null,
    accessTokenRevokedAt: row.access_token_revoked_at || null,
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    staffSeenAt: row.staff_seen_at || null,
  };
}

async function listByFirm(firmId, { status, serviceId, limit = 200, offset = 0 } = {}) {
  const sb = getSupabaseAdmin();
  let q = sb
    .from('service_inquiries')
    .select('*')
    .eq('firm_id', firmId)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);
  if (status) q = q.eq('status', status);
  if (serviceId) q = q.eq('service_id', serviceId);
  const { data, error } = await q;
  if (error) throw error;
  return (data || []).map(map);
}

async function findByIdForFirm(id, firmId) {
  const sb = getSupabaseAdmin();
  const { data, error } = await sb
    .from('service_inquiries')
    .select('*')
    .eq('id', id)
    .eq('firm_id', firmId)
    .maybeSingle();
  if (error) throw error;
  return map(data);
}

async function createRow({
  firmId,
  serviceId,
  leadId,
  clientId,
  notes,
  assignedStaffId,
  createdBy,
  answers,
  submittedAt,
  accessToken,
  accessTokenExpiresAt,
  status,
}) {
  const sb = getSupabaseAdmin();
  const insertRow = {
    firm_id: firmId,
    service_id: serviceId,
    lead_id: leadId || null,
    client_id: clientId || null,
    notes: notes ? String(notes).trim() : null,
    assigned_staff_id: assignedStaffId || null,
    created_by: createdBy || null,
    answers_enc: encryptAnswers(answers),
    submitted_at: submittedAt || null,
    access_token: accessToken || null,
    access_token_expires_at: accessTokenExpiresAt || null,
  };
  if (status) insertRow.status = status;
  const { data, error } = await sb.from('service_inquiries').insert(insertRow).select().single();
  if (error) throw error;
  return map(data);
}

/** Pura, testável directamente: um token revogado ou expirado nunca é válido,
 * independentemente de quem o chama. Sem accessTokenExpiresAt, nunca expira por si só. */
function isAccessTokenActive(inquiry) {
  if (!inquiry) return false;
  if (inquiry.accessTokenRevokedAt) return false;
  if (inquiry.accessTokenExpiresAt && new Date(inquiry.accessTokenExpiresAt).getTime() < Date.now()) return false;
  return true;
}

/** Lookup público pelo token opaco do mini-portal — não faz .eq('firm_id', ...) porque
 * o token É a credencial (o chamador ainda não sabe a que firm pertence). Devolve null
 * (mesma resposta genérica de "não encontrado") se o token foi revogado ou expirou —
 * nunca distingue esse caso de "nunca existiu", evita dar pistas a quem tenta adivinhar. */
async function findByAccessToken(token) {
  const value = String(token || '').trim();
  if (!value) return null;
  const sb = getSupabaseAdmin();
  const { data, error } = await sb
    .from('service_inquiries')
    .select('*')
    .eq('access_token', value)
    .maybeSingle();
  if (error) throw error;
  const inquiry = map(data);
  return isAccessTokenActive(inquiry) ? inquiry : null;
}

async function updateRow(id, firmId, patch) {
  const sb = getSupabaseAdmin();
  const row = { updated_at: new Date().toISOString() };
  if (patch.status !== undefined) row.status = patch.status;
  if (patch.notes !== undefined) row.notes = patch.notes ? String(patch.notes).trim() : null;
  if (patch.assignedStaffId !== undefined) row.assigned_staff_id = patch.assignedStaffId || null;
  if (patch.consultationId !== undefined) row.consultation_id = patch.consultationId || null;
  if (patch.accessTokenExpiresAt !== undefined) row.access_token_expires_at = patch.accessTokenExpiresAt || null;
  if (patch.accessTokenRevokedAt !== undefined) row.access_token_revoked_at = patch.accessTokenRevokedAt || null;
  if (patch.submittedAt !== undefined) row.submitted_at = patch.submittedAt || null;
  if (patch.staffSeenAt !== undefined) row.staff_seen_at = patch.staffSeenAt || null;
  if (patch.answers !== undefined) {
    row.answers_enc = encryptAnswers(patch.answers);
    row.answers = null;
  }

  const { data, error } = await sb
    .from('service_inquiries')
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
  const { error } = await sb.from('service_inquiries').delete().eq('id', id).eq('firm_id', firmId);
  if (error) throw error;
}

/** Solicitações activas ainda não abertas pela equipa (badge Solicitações). */
async function countUnseenByFirm(firmId) {
  const sb = getSupabaseAdmin();
  const { count, error } = await sb
    .from('service_inquiries')
    .select('id', { count: 'exact', head: true })
    .eq('firm_id', firmId)
    .is('staff_seen_at', null)
    .not('status', 'in', '(COMPLETED,CANCELLED)');
  if (error) throw error;
  return Number(count || 0);
}

/** Repontar todas as ServiceInquiries de um Lead para o Client resultante da conversão (secção 3.2 da spec). */
async function reassignLeadToClient(firmId, leadId, clientId) {
  const sb = getSupabaseAdmin();
  const { data, error } = await sb
    .from('service_inquiries')
    .update({ client_id: clientId, lead_id: null, updated_at: new Date().toISOString() })
    .eq('firm_id', firmId)
    .eq('lead_id', leadId)
    .select();
  if (error) throw error;
  return (data || []).map(map);
}

module.exports = {
  listByFirm,
  findByIdForFirm,
  findByAccessToken,
  isAccessTokenActive,
  encryptAnswers,
  decryptAnswers,
  createRow,
  updateRow,
  deleteRow,
  countUnseenByFirm,
  reassignLeadToClient,
  map,
};
