/**
 * Sincroniza estados OVERDUE e envia lembretes automáticos (5d / 1d / dia).
 * Executado periodicamente pelo boot TegLion.
 */
const { getSupabaseAdmin, isSupabaseConfigured } = require('../../../db/supabase/client');
const messagesRepository = require('../../../db/supabase/repositories/messages.repository');
const clientsRepository = require('../../../db/supabase/repositories/clients.repository');
const firmsRepository = require('../../../db/supabase/repositories/firms.repository');
const contabilNotifications = require('../../../services/notifications/contabil-notifications.service');
const { contabilRepository } = require('../../../db/supabase/repositories/contabil.repository');

const MS_DAY = 24 * 60 * 60 * 1000;

function daysUntil(dueDate, now) {
  const due = new Date(dueDate);
  due.setHours(0, 0, 0, 0);
  const n = new Date(now);
  n.setHours(0, 0, 0, 0);
  return Math.round((due.getTime() - n.getTime()) / MS_DAY);
}

async function processFirm(firmId) {
  await contabilRepository.syncOverdueObligations(firmId);
  const obligations = await contabilRepository.listObligations({ firmId });
  const firm = await firmsRepository.findFirmById(firmId).catch(() => null);
  const now = new Date();
  const open = obligations.filter((o) => !['DELIVERED', 'CANCELLED'].includes(o.status));

  for (const ob of open) {
    const d = daysUntil(ob.dueDate, now);
    let template = null;
    if (d === 5) template = 'Lembrete: faltam 5 dias para «{title}». Envie os documentos no portal.';
    else if (d === 1) template = 'Reforço: amanhã é o prazo de «{title}». Confirme ou envie o que falta.';
    else if (d === 0) template = 'Alerta crítico: hoje é o prazo de «{title}».';
    else if (d < 0 && ob.status === 'OVERDUE') template = 'A obrigação «{title}» está em atraso. Contacte o escritório se precisar de ajuda.';
    if (!template) continue;
    const title = ob.title || ob.type;
    const body = template.replace('{title}', title);
    await messagesRepository
      .createMessage({
        firmId,
        clientId: ob.clientId,
        senderRole: 'FIRM',
        senderId: firmId,
        body,
        obligationId: ob.id,
      })
      .catch(() => {});

    const client = await clientsRepository.findClientById(firmId, ob.clientId).catch(() => null);
    if (client?.email) {
      void contabilNotifications
        .notifyClientObligationReminder({
          clientEmail: client.email,
          clientName: client.displayName || client.name,
          obligationTitle: title,
          firmName: firm?.name,
          body,
        })
        .catch(() => {});
      if (client.phone) {
        const smsLogs = require('../../../services/sms/sms-logs.service');
        const templateKey =
          d === 5 ? 'DEADLINE_NEAR' : d === 1 ? 'DEADLINE_NEAR' : d === 0 ? 'DEADLINE_NEAR' : 'DEADLINE_NEAR';
        void smsLogs
          .sendTemplatedSms({
            firmId,
            clientId: ob.clientId,
            phone: client.phone,
            templateKey,
            templateVars: {
              firmName: firm?.name,
              obligationTitle: title,
              dueDate: ob.dueDate ? new Date(ob.dueDate).toLocaleDateString('pt-PT') : undefined,
            },
            entityType: 'OBLIGATION',
            entityId: ob.id,
            dedupeWindowMs: 24 * 60 * 60 * 1000,
          })
          .catch(() => {});
      }
    }
  }
}

async function runAllFirms() {
  if (!isSupabaseConfigured()) return;
  const sb = getSupabaseAdmin();
  const { data, error } = await sb.from('firms').select('id').eq('status', 'ACTIVE');
  if (error) {
    console.warn('[TegLion] obligation reminders:', error.message);
    return;
  }
  for (const row of data || []) {
    await processFirm(row.id).catch((e) => {
      console.warn('[TegLion] reminders firm', row.id, e.message);
    });
  }
}

module.exports = { runAllFirms, processFirm };
