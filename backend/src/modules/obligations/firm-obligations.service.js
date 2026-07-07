/**
 * Operações TegLion — escritório (staff).
 * Dados via getRepository() — Mongo (staging) ou Supabase (futuro prod).
 */
const { AppError } = require('../../middlewares/error.middleware');
const { getRepository } = require('../../db/supabase/repositories');
const clientsRepository = require('../../db/supabase/repositories/clients.repository');
const contabilNotifications = require('../../services/notifications/contabil-notifications.service');

const OBLIGATION_TYPE_LABELS = {
  IVA: 'IVA',
  IRC: 'IRC',
  IRS: 'IRS',
  SS: 'Segurança Social',
  DRF: 'DRF',
  IES: 'IES',
  DAS: 'DAS',
  PAYROLL: 'Salários',
  CUSTOM: 'Outra',
};

function obligationTitle(type, period, customTitle) {
  if (customTitle) return customTitle;
  const label = OBLIGATION_TYPE_LABELS[type] || type;
  return `${label} — ${period}`;
}

async function createObligationWithTask({
  firmId: firmIdRaw,
  clientId: clientIdRaw,
  type,
  period,
  dueDate,
  title,
  notes,
  accountantNotes,
  amountCents,
  priority,
  assignedStaffId,
  createdByUserId,
  createClientTask = true,
  skipClientNotify = false,
  templateId = null,
  checklist = null,
  expectedDocuments = null,
  recurrenceRuleId = null,
}) {
  const firmId = String(firmIdRaw);
  const clientId = String(clientIdRaw);

  const client = await clientsRepository.findClientById(firmId, clientId);
  if (!client) throw new AppError('Cliente não encontrado', 404);

  const repo = getRepository();
  const sb = require('../../db/supabase/client').getSupabaseAdmin();
  const obRow = {
    firm_id: firmId,
    client_id: clientId,
    type: String(type).trim(),
    period: String(period).trim(),
    title: obligationTitle(type, period, title),
    due_date: new Date(dueDate),
    status: 'WAITING_CLIENT',
    assigned_staff_id: assignedStaffId || null,
    notes: notes || null,
    accountant_notes: accountantNotes || null,
    amount_cents: amountCents != null ? Number(amountCents) : null,
    priority: priority || 'NORMAL',
    payment_status: 'PENDING',
    created_by: createdByUserId || null,
    template_id: templateId || null,
    checklist: checklist || [],
    expected_documents: expectedDocuments || [],
    recurrence_rule_id: recurrenceRuleId || null,
  };
  const { data: inserted, error: obErr } = await sb.from('obligations').insert(obRow).select().single();
  if (obErr) throw obErr;
  const obligation = {
    _id: inserted.id,
    id: inserted.id,
    clientId,
    title: inserted.title,
    type: inserted.type,
    period: inserted.period,
    dueDate: inserted.due_date,
    status: inserted.status,
    paymentStatus: inserted.payment_status,
    priority: inserted.priority,
    amountCents: inserted.amount_cents,
    accountantNotes: inserted.accountant_notes,
  };

  let task = null;
  if (createClientTask) {
    const taskDescription =
      accountantNotes ||
      'Consulte a guia e instruções no portal. Envie documentos em falta, se aplicável.';
    task = await repo.createClientTask({
      firmId,
      firmId: firmId,
      clientId,
      clientId: clientId,
      obligationId: obligation._id || obligation.id,
      title: obligation.title,
      description: taskDescription,
      status: 'TODO',
      dueDate: new Date(dueDate),
      createdByUserId: createdByUserId || null,
    });
  }

  const activityService = require('../../services/activity/activity.service');
  void activityService.recordActivity({
    firmId,
    clientId,
    actorRole: 'FIRM',
    actorId: createdByUserId,
    eventType: 'OBLIGATION_CREATED',
    entityType: 'OBLIGATION',
    entityId: obligation._id,
    title: `Obrigação criada: ${obligation.title}`,
  });

  if (task && !skipClientNotify) {
    if (client.email) {
      void contabilNotifications
        .notifyClientNewTask({
          clientEmail: client.email,
          clientName: client.displayName || client.name,
          taskTitle: task.title,
          dueDate: dueDate ? new Date(dueDate).toLocaleDateString('pt-PT') : undefined,
        })
        .catch(() => {});
    }
    if (client.phone) {
      const smsLogs = require('../../services/sms/sms-logs.service');
      const firmsRepository = require('../../db/supabase/repositories/firms.repository');
      const firm = await firmsRepository.findFirmById(firmId).catch(() => null);
      void smsLogs
        .sendTemplatedSms({
          firmId,
          clientId,
          phone: client.phone,
          templateKey: 'OBLIGATION_CREATED',
          templateVars: {
            firmName: firm?.name,
            obligationTitle: obligation.title,
            dueDate: dueDate ? new Date(dueDate).toLocaleDateString('pt-PT') : undefined,
          },
          entityType: 'OBLIGATION',
          entityId: obligation._id,
        })
        .catch(() => {});
    }

    const sbClient = require('../../db/supabase/client').getSupabaseAdmin();
    if (sbClient) {
      const { error: notifErr } = await sbClient.from('in_app_notifications').insert({
        firm_id: firmId,
        client_id: clientId,
        type: 'OBLIGATION_CREATED',
        title: 'Nova obrigação fiscal',
        body: `${obligation.title} — consulte na plataforma.`,
        entity_type: 'OBLIGATION',
        entity_id: obligation._id,
      });
      if (notifErr) console.warn('[obligations] notification:', notifErr.message);
    }
  }

  return { obligation, task };
}

async function updateObligation({ firmId, obligationId, patch }) {
  const allowed = [
    'status',
    'notes',
    'assignedStaffId',
    'dueDate',
    'title',
    'paymentStatus',
    'priority',
    'amountCents',
    'accountantNotes',
    'documentId',
  ];
  const update = {};
  for (const key of allowed) {
    if (patch[key] !== undefined) update[key] = patch[key];
  }
  if (update.dueDate) update.dueDate = new Date(update.dueDate);
  if (update.status === 'DELIVERED') update.deliveredAt = new Date();
  if (update.amountCents !== undefined) update.amountCents = Number(update.amountCents);

  if (patch.assignedStaffId !== undefined) update.assignedStaffId = patch.assignedStaffId || null;

  const repo = getRepository();
  const obligation = await repo.updateObligation(String(obligationId), String(firmId), update);
  if (!obligation) throw new AppError('Obrigação não encontrada', 404);
  await repo
    .writeAuditLog({
      firmId: String(firmId),
      actorRole: 'FIRM',
      actorId: patch.actorId || null,
      action: 'obligation.updated',
      entityType: 'obligation',
      entityId: String(obligationId),
      metadata: { status: update.status },
    })
    .catch(() => {});
  return obligation;
}

async function getFirmDashboard({ firmId }) {
  const repo = getRepository();
  return repo.getFirmDashboardStats(String(firmId));
}

async function listFirmTasks({ firmId, clientId, statusIn }) {
  const repo = getRepository();
  return repo.listClientTasks({
    firmId: String(firmId),
    clientId: clientId ? String(clientId) : undefined,
    statusIn: statusIn || ['TODO', 'IN_PROGRESS', 'WAITING_CLIENT', 'REVIEW', 'BACKLOG', 'OPEN'],
  });
}

async function listFirmDocuments({
  firmId,
  clientId,
  period,
  limit,
  validationStatus,
  obligationId,
  page,
}) {
  const repo = getRepository();
  return repo.listDocuments({
    firmId: String(firmId),
    clientId: clientId ? String(clientId) : undefined,
    period,
    validationStatus,
    obligationId: obligationId ? String(obligationId) : undefined,
    page: page || 1,
    limit: limit || 50,
  });
}

module.exports = {
  createObligationWithTask,
  updateObligation,
  getFirmDashboard,
  listFirmTasks,
  listFirmDocuments,
  OBLIGATION_TYPE_LABELS,
};
