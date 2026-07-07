const { getSupabaseAdmin } = require('../client');
const { safeDecryptText } = require('../../../utils/safe-display-text');

function mapRow(row) {
  if (!row) return null;
  return {
    id: row.id,
    firmId: row.firm_id,
    clientId: row.client_id,
    conversationId: row.conversation_id,
    messageId: row.message_id,
    obligationId: row.obligation_id,
    periodMonth: row.period_month,
    title: row.title,
    instructions: safeDecryptText(row.instructions),
    status: row.status,
    seenAt: row.seen_at,
    answeredAt: row.answered_at,
    completedAt: row.completed_at,
    documentId: row.document_id,
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

async function create({
  firmId,
  clientId,
  conversationId,
  messageId,
  obligationId,
  periodMonth,
  title,
  instructions,
  createdBy,
}) {
  const sb = getSupabaseAdmin();
  const { data, error } = await sb
    .from('document_requests')
    .insert({
      firm_id: firmId,
      client_id: clientId,
      conversation_id: conversationId,
      message_id: messageId || null,
      obligation_id: obligationId || null,
      period_month: periodMonth || null,
      title: title || null,
      instructions: instructions ? String(instructions).trim() : null,
      status: 'pending',
      created_by: createdBy || null,
    })
    .select()
    .single();
  if (error) throw error;
  return mapRow(data);
}

async function findById(id, firmId) {
  const sb = getSupabaseAdmin();
  const { data, error } = await sb
    .from('document_requests')
    .select('*')
    .eq('id', id)
    .eq('firm_id', firmId)
    .maybeSingle();
  if (error) throw error;
  return mapRow(data);
}

async function listByClient({ firmId, clientId, limit = 50 }) {
  const sb = getSupabaseAdmin();
  const { data, error } = await sb
    .from('document_requests')
    .select('*')
    .eq('firm_id', firmId)
    .eq('client_id', clientId)
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data || []).map(mapRow);
}

async function listByFirm({ firmId, clientId, status, limit = 500 }) {
  const sb = getSupabaseAdmin();
  let q = sb
    .from('document_requests')
    .select('*')
    .eq('firm_id', firmId)
    .order('created_at', { ascending: false })
    .limit(limit);
  if (clientId) q = q.eq('client_id', clientId);
  if (status) q = q.eq('status', status);
  const { data, error } = await q;
  if (error) throw error;
  return (data || []).map(mapRow);
}

async function updateStatus(id, firmId, { status, seenAt, answeredAt, completedAt, documentId }) {
  const sb = getSupabaseAdmin();
  const patch = { updated_at: new Date().toISOString() };
  if (status) patch.status = status;
  if (seenAt !== undefined) patch.seen_at = seenAt;
  if (answeredAt !== undefined) patch.answered_at = answeredAt;
  if (completedAt !== undefined) patch.completed_at = completedAt;
  if (documentId !== undefined) patch.document_id = documentId;

  const { data, error } = await sb
    .from('document_requests')
    .update(patch)
    .eq('id', id)
    .eq('firm_id', firmId)
    .select()
    .single();
  if (error) throw error;
  return mapRow(data);
}

async function markPendingAsSeenForClient({ firmId, clientId }) {
  const sb = getSupabaseAdmin();
  const now = new Date().toISOString();
  const { data, error } = await sb
    .from('document_requests')
    .update({ status: 'seen', seen_at: now, updated_at: now })
    .eq('firm_id', firmId)
    .eq('client_id', clientId)
    .eq('status', 'pending')
    .is('seen_at', null)
    .select();
  if (error) throw error;
  return (data || []).map(mapRow);
}

async function completeByDocumentId(firmId, documentId) {
  const sb = getSupabaseAdmin();
  const now = new Date().toISOString();
  const { data, error } = await sb
    .from('document_requests')
    .update({
      status: 'completed',
      completed_at: now,
      document_id: documentId,
      updated_at: now,
    })
    .eq('firm_id', firmId)
    .eq('document_id', documentId)
    .neq('status', 'completed')
    .select();
  if (error) throw error;
  return (data || []).map(mapRow);
}

/** Alinha pedidos com documentos já aprovados (corrige estados desactualizados na inbox). */
async function reconcileWithApprovedDocuments(firmId, requests) {
  const open = (requests || []).filter((r) => r.documentId && r.status !== 'completed');
  if (!open.length) return requests;

  const { getRepository } = require('./index');
  const repo = getRepository();
  const now = new Date().toISOString();
  const byId = new Map((requests || []).map((r) => [r.id, r]));

  for (const req of open) {
    const doc = await repo.findDocumentById(req.documentId, firmId);
    if (doc?.validationStatus !== 'APPROVED') continue;
    const updated = await updateStatus(req.id, firmId, {
      status: 'completed',
      completedAt: now,
      documentId: req.documentId,
    });
    byId.set(req.id, updated);
  }

  return (requests || []).map((r) => byId.get(r.id) || r);
}

async function markOpenAsAnswered({ firmId, clientId, documentId }) {
  const sb = getSupabaseAdmin();
  const now = new Date().toISOString();
  const patch = { status: 'answered', answered_at: now, updated_at: now };
  if (documentId) patch.document_id = documentId;
  const { data, error } = await sb
    .from('document_requests')
    .update(patch)
    .eq('firm_id', firmId)
    .eq('client_id', clientId)
    .in('status', ['pending', 'seen'])
    .select();
  if (error) throw error;
  return (data || []).map(mapRow);
}

module.exports = {
  mapRow,
  create,
  findById,
  listByClient,
  listByFirm,
  updateStatus,
  markPendingAsSeenForClient,
  markOpenAsAnswered,
  completeByDocumentId,
  reconcileWithApprovedDocuments,
};
