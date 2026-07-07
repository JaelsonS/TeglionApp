const { ensureClient } = require('./shared');
const { mapObligationRow } = require('./mappers');

async function listObligations({ firmId, clientId, period, statusIn, limit = 500 }) {
  const sb = ensureClient();
  let q = sb
    .from('obligations')
    .select('*, clients(display_name, email, tax_id)')
    .eq('firm_id', firmId)
    .order('due_date', { ascending: true })
    .limit(limit);
  if (clientId) q = q.eq('client_id', clientId);
  if (period) q = q.eq('period', period);
  if (statusIn?.length) q = q.in('status', statusIn);
  const { data, error } = await q;
  if (error) throw error;
  return (data || []).map(mapObligationRow);
}

async function listObligationsEnriched(params) {
  return listObligations(params);
}

async function findObligationById(id, firmId) {
  const sb = ensureClient();
  const { data, error } = await sb.from('obligations').select('*').eq('id', id).eq('firm_id', firmId).maybeSingle();
  if (error) throw error;
  return mapObligationRow(data);
}

async function createObligation(data) {
  const sb = ensureClient();
  const row = {
    firm_id: data.firmId,
    client_id: data.clientId,
    type: data.type,
    period: data.period,
    title: data.title,
    due_date: data.dueDate,
    status: data.status || 'PENDING',
    notes: data.notes || null,
    assigned_staff_id: data.assignedStaffId || null,
    created_by: data.createdByUserId || null,
  };
  const { data: inserted, error } = await sb.from('obligations').insert(row).select().single();
  if (error) throw error;
  return mapObligationRow(inserted);
}

async function updateObligation(id, firmId, patch) {
  const sb = ensureClient();
  const row = {};
  if (patch.status !== undefined) row.status = patch.status;
  if (patch.notes !== undefined) row.notes = patch.notes;
  if (patch.title !== undefined) row.title = patch.title;
  if (patch.dueDate !== undefined) row.due_date = patch.dueDate;
  if (patch.assignedStaffId !== undefined) row.assigned_staff_id = patch.assignedStaffId;
  if (patch.amountCents !== undefined) row.amount_cents = patch.amountCents;
  if (patch.paymentStatus !== undefined) row.payment_status = patch.paymentStatus;
  if (patch.priority !== undefined) row.priority = patch.priority;
  if (patch.documentId !== undefined) row.document_id = patch.documentId;
  if (patch.accountantNotes !== undefined) row.accountant_notes = patch.accountantNotes;
  if (patch.paymentProofDocumentId !== undefined) row.payment_proof_document_id = patch.paymentProofDocumentId;
  if (patch.paidAt !== undefined) row.paid_at = patch.paidAt;
  if (patch.status === 'DELIVERED') row.delivered_at = new Date().toISOString();
  if (patch.paymentStatus === 'PAID' && !patch.paidAt) row.paid_at = new Date().toISOString();
  const { data, error } = await sb.from('obligations').update(row).eq('id', id).eq('firm_id', firmId).select().maybeSingle();
  if (error) throw error;
  return mapObligationRow(data);
}

async function syncOverdueObligations(firmId) {
  const sb = ensureClient();
  const today = new Date().toISOString().slice(0, 10);
  const { error } = await sb
    .from('obligations')
    .update({ status: 'OVERDUE' })
    .eq('firm_id', firmId)
    .lt('due_date', today)
    .in('status', ['PENDING', 'IN_PROGRESS', 'WAITING_CLIENT']);
  if (error) throw error;
}

module.exports = {
  listObligations,
  listObligationsEnriched,
  findObligationById,
  createObligation,
  updateObligation,
  syncOverdueObligations,
};
