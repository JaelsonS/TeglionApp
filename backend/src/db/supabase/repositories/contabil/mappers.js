const { normalizeStatus } = require('../../../../modules/tasks/task.constants');
const { safeDecryptText } = require('../../../../utils/safe-display-text');

function mapObligationRow(row) {
  if (!row) return null;
  return {
    _id: row.id,
    id: row.id,
    firmId: row.firm_id,
    clientId: row.client_id,
    type: row.type,
    period: row.period,
    title: row.title,
    dueDate: row.due_date,
    status: row.status,
    notes: row.notes,
    deliveredAt: row.delivered_at,
    amountCents: row.amount_cents,
    currency: row.currency || 'EUR',
    paymentStatus: row.payment_status || 'PENDING',
    priority: row.priority || 'NORMAL',
    documentId: row.document_id,
    accountantNotes: row.accountant_notes,
    paymentProofDocumentId: row.payment_proof_document_id,
    paidAt: row.paid_at,
    viewCount: row.view_count || 0,
    firstViewedAt: row.first_viewed_at,
    lastViewedAt: row.last_viewed_at,
    templateId: row.template_id,
    checklist: row.checklist || [],
    expectedDocuments: row.expected_documents || [],
    recurrenceRuleId: row.recurrence_rule_id,
    assignedStaffId: row.assigned_staff_id,
    clientName: row.clients?.display_name || null,
    clientEmail: row.clients?.email || null,
    clientTaxId: row.clients?.tax_id || null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapTaskRow(row) {
  if (!row) return null;
  const status = normalizeStatus(row.status);
  const due = row.due_date ? String(row.due_date).slice(0, 10) : null;
  const today = new Date().toISOString().slice(0, 10);
  return {
    _id: row.id,
    id: row.id,
    firmId: row.firm_id,
    clientId: row.client_id,
    obligationId: row.obligation_id,
    title: safeDecryptText(row.title),
    description: safeDecryptText(row.description),
    status,
    priority: row.priority || 'NORMAL',
    dueDate: due,
    isOverdue: due && due < today && !['DONE', 'ARCHIVED'].includes(status),
    assigneeId: row.assignee_id,
    tags: row.tags || [],
    helpRequestedAt: row.help_requested_at,
    submittedAt: row.submitted_at,
    completedAt: row.completed_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapDocumentRow(row) {
  const client = row.clients || row.client || null;
  const obligation = row.obligations || row.obligation || null;
  return {
    _id: row.id,
    id: row.id,
    firmId: row.firm_id,
    clientId: row.client_id,
    obligationId: row.obligation_id,
    clientTaskId: row.client_task_id,
    title: row.title,
    period: row.period,
    documentType: row.document_type,
    mimeType: row.mime_type,
    sizeBytes: row.size_bytes != null ? Number(row.size_bytes) : null,
    validationStatus: row.validation_status || 'PENDING',
    validatedAt: row.validated_at,
    createdAt: row.created_at,
    originalName: row.title,
    storageUrl: row.storage_url,
    storageKey: row.storage_key,
    uploadedByRole: row.uploaded_by_role,
    uploadedById: row.uploaded_by_id,
    uploadedByName: row.uploaded_by_name,
    description: row.description,
    observations: row.observations,
    category: row.category,
    tags: row.tags || [],
    workflowStatus: row.workflow_status || 'SENT',
    viewCount: row.view_count || 0,
    firstViewedAt: row.first_viewed_at,
    lastViewedAt: row.last_viewed_at,
    clientName: client?.display_name || null,
    clientEmail: client?.email || null,
    clientTaxId: client?.tax_id || null,
    obligationTitle: obligation?.title || null,
    obligationPeriod: obligation?.period || null,
  };
}

function clientHealthFromObligations(clientObligations, now) {
  const active = clientObligations.filter((o) => !['DELIVERED', 'CANCELLED'].includes(o.status));
  if (!active.length) return 'ok';
  const hasOverdue = active.some((o) => new Date(o.dueDate) < now || o.status === 'OVERDUE');
  if (hasOverdue) return 'critical';
  const ms48h = 48 * 60 * 60 * 1000;
  const hasUrgent = active.some((o) => {
    const due = new Date(o.dueDate).getTime();
    return due - now.getTime() <= ms48h;
  });
  if (hasUrgent) return 'critical';
  const ms5d = 5 * 24 * 60 * 60 * 1000;
  const hasAttention = active.some((o) => {
    const due = new Date(o.dueDate).getTime();
    return due - now.getTime() <= ms5d;
  });
  return hasAttention ? 'attention' : 'ok';
}

module.exports = {
  mapObligationRow,
  mapTaskRow,
  mapDocumentRow,
  clientHealthFromObligations,
};
