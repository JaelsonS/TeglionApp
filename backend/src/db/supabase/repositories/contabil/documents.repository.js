const { ensureClient } = require('./shared');
const { mapDocumentRow } = require('./mappers');

async function listDocuments({
  firmId,
  clientId,
  period,
  validationStatus,
  obligationId,
  page = 1,
  limit = 50,
}) {
  const sb = ensureClient();
  const safeLimit = Math.min(Math.max(Number(limit) || 50, 1), 200);
  const safePage = Math.max(Number(page) || 1, 1);
  const from = (safePage - 1) * safeLimit;
  const to = from + safeLimit - 1;

  let q = sb
    .from('documents')
    .select(
      '*, clients(display_name, email, tax_id), obligations!documents_obligation_id_fkey(title, period)',
      { count: 'exact' },
    )
    .eq('firm_id', firmId)
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .range(from, to);
  if (clientId) q = q.eq('client_id', clientId);
  if (period) q = q.eq('period', period);
  if (validationStatus) q = q.eq('validation_status', validationStatus);
  if (obligationId) q = q.eq('obligation_id', obligationId);
  const { data, error, count } = await q;
  if (error) throw error;
  const items = (data || []).map(mapDocumentRow);
  const total = count ?? items.length;
  return {
    items,
    total,
    page: safePage,
    limit: safeLimit,
    hasMore: from + items.length < total,
  };
}

async function listDocumentAuditLogs({ firmId, documentId, limit = 30 }) {
  const sb = ensureClient();
  const { data, error } = await sb
    .from('audit_logs')
    .select('*')
    .eq('firm_id', firmId)
    .eq('entity_type', 'document')
    .eq('entity_id', documentId)
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data || []).map((row) => ({
    id: row.id,
    action: row.action,
    actorRole: row.actor_role,
    actorId: row.actor_id,
    metadata: row.metadata,
    createdAt: row.created_at,
  }));
}

async function findDocumentById(id, firmId) {
  const sb = ensureClient();
  const { data, error } = await sb
    .from('documents')
    .select('*')
    .eq('id', id)
    .eq('firm_id', firmId)
    .eq('is_active', true)
    .maybeSingle();
  if (error) throw error;
  return data ? mapDocumentRow(data) : null;
}

async function validateDocument(id, firmId, { validationStatus, validatedBy }) {
  const sb = ensureClient();
  const { data, error } = await sb
    .from('documents')
    .update({
      validation_status: validationStatus,
      validated_at: new Date().toISOString(),
      validated_by: validatedBy,
    })
    .eq('id', id)
    .eq('firm_id', firmId)
    .select()
    .maybeSingle();
  if (error) throw error;
  return data ? mapDocumentRow(data) : null;
}

async function findDuplicateDocument({ firmId, clientId, title, period }) {
  const sb = ensureClient();
  const { data, error } = await sb
    .from('documents')
    .select('id, title, period, created_at')
    .eq('firm_id', firmId)
    .eq('client_id', clientId)
    .eq('is_active', true)
    .ilike('title', title)
    .eq('period', period || null)
    .limit(3);
  if (error) throw error;
  return (data || []).map(mapDocumentRow);
}

async function createDocument(row) {
  const sb = ensureClient();
  const { data, error } = await sb.from('documents').insert(row).select().single();
  if (error) throw error;
  return data;
}

async function softDeleteDocument(id, firmId) {
  const sb = ensureClient();
  const { data, error } = await sb
    .from('documents')
    .update({ is_active: false })
    .eq('id', id)
    .eq('firm_id', firmId)
    .eq('is_active', true)
    .select()
    .maybeSingle();
  if (error) throw error;
  return data ? mapDocumentRow(data) : null;
}

module.exports = {
  listDocuments,
  listDocumentAuditLogs,
  findDocumentById,
  validateDocument,
  findDuplicateDocument,
  createDocument,
  softDeleteDocument,
};
