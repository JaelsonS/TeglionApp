/**
 * Lembretes automáticos 5 dias antes da validade de documentos (certidões, licenças, etc.).
 */
const { getSupabaseAdmin, isSupabaseConfigured } = require('../../db/supabase/client');
const clientsRepository = require('../../db/supabase/repositories/clients.repository');
const firmsRepository = require('../../db/supabase/repositories/firms.repository');
const firmUsersRepository = require('../../db/supabase/repositories/firm-users.repository');
const documentReminderSends = require('../../db/supabase/repositories/document-reminder-sends.repository');
const contabilNotifications = require('../../services/notifications/contabil-notifications.service');
const tasksWorkspace = require('../tasks/tasks-workspace.service');

const MS_DAY = 24 * 60 * 60 * 1000;
const REMINDER_DAYS = 5;

function daysUntil(validUntil, now) {
  const due = new Date(validUntil);
  due.setHours(0, 0, 0, 0);
  const n = new Date(now);
  n.setHours(0, 0, 0, 0);
  return Math.round((due.getTime() - n.getTime()) / MS_DAY);
}

function dayBucketOf(now) {
  return new Date(now).toISOString().slice(0, 10);
}

async function processFirm(firmId) {
  const sb = getSupabaseAdmin();
  const now = new Date();
  const dayBucket = dayBucketOf(now);

  const { data: rows, error } = await sb
    .from('documents')
    .select('id, firm_id, client_id, title, description, valid_from, valid_until')
    .eq('firm_id', firmId)
    .eq('is_active', true)
    .not('valid_until', 'is', null);
  if (error) throw error;

  const firm = await firmsRepository.findFirmById(firmId).catch(() => null);
  const ownerEmail = await firmUsersRepository.findFirmOwnerEmail(firmId).catch(() => null);
  const notifyEmail = ownerEmail || firm?.settings?.contactEmail || firm?.settings?.notificationEmail;

  for (const row of rows || []) {
    const d = daysUntil(row.valid_until, now);
    if (d !== REMINDER_DAYS) continue;

    const title = row.title || row.description || 'Documento';
    const validUntilLabel = new Date(row.valid_until).toLocaleDateString('pt-PT');
    const body = `Faltam ${REMINDER_DAYS} dias para expirar «${title}» (validade até ${validUntilLabel}).`;
    const firmActionUrl = `/app/firm/documents/files?doc=${row.id}`;

    const canFirmInApp = await documentReminderSends
      .tryClaimReminderSend({ firmId, documentId: row.id, channel: 'in_app_firm', dayBucket })
      .catch(() => true);
    if (canFirmInApp) {
      await tasksWorkspace
        .notifyFirmStaff({
          firmId,
          category: 'DOCUMENT',
          type: 'DOCUMENT_EXPIRING',
          title: `Documento expira em ${REMINDER_DAYS} dias`,
          body,
          entityType: 'DOCUMENT',
          entityId: row.id,
          actionUrl: firmActionUrl,
        })
        .catch(() => {});
    }

    if (notifyEmail) {
      const canEmail = await documentReminderSends
        .tryClaimReminderSend({ firmId, documentId: row.id, channel: 'email', dayBucket })
        .catch(() => true);
      if (canEmail) {
        const client = row.client_id
          ? await clientsRepository.findClientById(firmId, row.client_id).catch(() => null)
          : null;
        void contabilNotifications
          .notifyFirmDocumentExpiryReminder({
            staffEmail: notifyEmail,
            documentTitle: title,
            clientName: client?.displayName || client?.name,
            firmName: firm?.name,
            validUntil: validUntilLabel,
            daysLeft: REMINDER_DAYS,
          })
          .catch(() => {});
      }
    }

    if (row.client_id) {
      const canClientInApp = await documentReminderSends
        .tryClaimReminderSend({ firmId, documentId: row.id, channel: 'in_app_client', dayBucket })
        .catch(() => true);
      if (canClientInApp) {
        await tasksWorkspace
          .notifyClientInApp({
            firmId,
            clientId: row.client_id,
            category: 'DOCUMENT',
            type: 'DOCUMENT_EXPIRING',
            title: `Documento expira em ${REMINDER_DAYS} dias`,
            body,
            entityType: 'DOCUMENT',
            entityId: row.id,
            actionUrl: '/app/client/documents',
          })
          .catch(() => {});
      }

      const client = await clientsRepository.findClientById(firmId, row.client_id).catch(() => null);
      if (client?.email) {
        const canClientEmail = await documentReminderSends
          .tryClaimReminderSend({ firmId, documentId: row.id, channel: 'email_client', dayBucket })
          .catch(() => true);
        if (canClientEmail) {
          void contabilNotifications
            .notifyClientDocumentExpiryReminder({
              clientEmail: client.email,
              clientName: client.displayName || client.name,
              documentTitle: title,
              firmName: firm?.name,
              validUntil: validUntilLabel,
              daysLeft: REMINDER_DAYS,
              body,
            })
            .catch(() => {});
        }
      }
    }
  }
}

async function runAllFirms() {
  if (!isSupabaseConfigured()) return;
  const sb = getSupabaseAdmin();
  const { data, error } = await sb.from('firms').select('id').eq('status', 'ACTIVE');
  if (error) {
    console.warn('[Teglion] document expiry reminders:', error.message);
    return;
  }
  for (const row of data || []) {
    await processFirm(row.id).catch((e) => {
      console.warn('[Teglion] document expiry firm', row.id, e.message);
    });
  }
}

module.exports = { runAllFirms, processFirm, REMINDER_DAYS };
