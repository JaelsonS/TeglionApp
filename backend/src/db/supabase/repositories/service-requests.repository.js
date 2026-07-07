const { getSupabaseAdmin } = require('../client');

const STATUSES = [
  'DRAFT', 'SUBMITTED', 'ASSIGNED', 'QUOTED', 'APPROVED', 'PAID',
  'IN_PROGRESS', 'DONE', 'RATED', 'CANCELLED',
];

function mapRow(row) {
  if (!row) return null;
  return {
    id: row.id,
    _id: row.id,
    firmId: row.firm_id,
    clientId: row.client_id,
    accountingServiceId: row.accounting_service_id,
    title: row.title,
    description: row.description,
    status: row.status,
    priority: row.priority,
    assigneeId: row.assignee_id,
    quotedAmountCents: row.quoted_amount_cents,
    currency: row.currency || 'EUR',
    slaDueAt: row.sla_due_at,
    internalNotes: row.internal_notes,
    clientNotes: row.client_notes,
    consultationId: row.consultation_id,
    submittedAt: row.submitted_at,
    quotedAt: row.quoted_at,
    approvedAt: row.approved_at,
    completedAt: row.completed_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

async function list({ firmId, clientId, statusIn, limit = 100 }) {
  const sb = getSupabaseAdmin();
  let q = sb
    .from('service_requests')
    .select('*')
    .eq('firm_id', firmId)
    .order('updated_at', { ascending: false })
    .limit(limit);
  if (clientId) q = q.eq('client_id', clientId);
  if (statusIn?.length) q = q.in('status', statusIn);
  const { data, error } = await q;
  if (error) throw error;
  return (data || []).map(mapRow);
}

async function findById(firmId, id, clientId) {
  const sb = getSupabaseAdmin();
  let q = sb.from('service_requests').select('*').eq('id', id).eq('firm_id', firmId);
  if (clientId) q = q.eq('client_id', clientId);
  const { data, error } = await q.maybeSingle();
  if (error) throw error;
  return mapRow(data);
}

async function insert(row) {
  const sb = getSupabaseAdmin();
  const { data, error } = await sb.from('service_requests').insert(row).select().single();
  if (error) throw error;
  return mapRow(data);
}

async function update(id, firmId, patch) {
  const sb = getSupabaseAdmin();
  const row = { updated_at: new Date().toISOString() };
  const map = {
    title: 'title',
    description: 'description',
    status: 'status',
    priority: 'priority',
    assignee_id: 'assigneeId',
    quoted_amount_cents: 'quotedAmountCents',
    currency: 'currency',
    sla_due_at: 'slaDueAt',
    internal_notes: 'internalNotes',
    client_notes: 'clientNotes',
    consultation_id: 'consultationId',
    submitted_at: 'submittedAt',
    quoted_at: 'quotedAt',
    approved_at: 'approvedAt',
    completed_at: 'completedAt',
  };
  for (const [col, key] of Object.entries(map)) {
    if (patch[key] !== undefined) row[col] = patch[key];
  }
  const { data, error } = await sb
    .from('service_requests')
    .update(row)
    .eq('id', id)
    .eq('firm_id', firmId)
    .select()
    .single();
  if (error) throw error;
  return mapRow(data);
}

async function listComments(requestId, { includeInternal = true } = {}) {
  const sb = getSupabaseAdmin();
  let q = sb
    .from('service_request_comments')
    .select('*')
    .eq('service_request_id', requestId)
    .order('created_at', { ascending: true });
  if (!includeInternal) q = q.eq('is_internal', false);
  const { data, error } = await q;
  if (error) throw error;
  return (data || []).map((r) => ({
    id: r.id,
    authorRole: r.author_role,
    authorName: r.author_name,
    body: r.body,
    isInternal: r.is_internal,
    createdAt: r.created_at,
  }));
}

async function insertComment({ firmId, requestId, authorRole, authorId, authorName, body, isInternal }) {
  const sb = getSupabaseAdmin();
  const { data, error } = await sb
    .from('service_request_comments')
    .insert({
      firm_id: firmId,
      service_request_id: requestId,
      author_role: authorRole,
      author_id: authorId,
      author_name: authorName,
      body: String(body).trim(),
      is_internal: Boolean(isInternal),
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

module.exports = { STATUSES, mapRow, list, findById, insert, update, listComments, insertComment };
