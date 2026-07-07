/**
 * Tarefas do cliente — anexos e documentos enviados pelo escritório.
 */
const { AppError } = require('../../middlewares/error.middleware');
const { getRepository } = require('../../db/supabase/repositories');
const clientsRepository = require('../../db/supabase/repositories/clients.repository');
const contabilStorage = require('../../services/storage/contabil-storage.service');
const activityService = require('../../services/activity/activity.service');

function currentPeriod() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

async function attachDocumentToTask({
  firmId,
  taskId,
  clientId,
  obligationId = null,
  file,
  actorId,
  actorName,
  period = null,
  notifyClient = true,
}) {
  if (!file) throw new AppError('Ficheiro obrigatório', 400);
  const repo = getRepository();
  const task = await repo.findClientTaskById(taskId, firmId, clientId);
  if (!task) throw new AppError('Tarefa não encontrada', 404);

  const client = await clientsRepository.findClientById(firmId, clientId);
  if (!client) throw new AppError('Cliente não encontrado', 404);

  const uploaded = await contabilStorage.uploadClientDocument({
    firmId,
    clientId,
    file,
  });

  const doc = await repo.createDocument({
    firm_id: firmId,
    client_id: clientId,
    client_task_id: taskId,
    obligation_id: obligationId || task.obligationId || null,
    period: period || currentPeriod(),
    title: file.originalname || `Documento — ${task.title}`,
    category: 'Pedido do escritório',
    workflow_status: 'RECEIVED',
    storage_provider: uploaded.provider,
    storage_key: uploaded.path,
    mime_type: file.mimetype || null,
    size_bytes: file.size || null,
    uploaded_by_role: 'FIRM',
    uploaded_by_id: actorId,
    uploaded_by_name: actorName || 'Escritório',
    validation_status: 'APPROVED',
  });

  void activityService.recordActivity({
    firmId,
    clientId,
    actorRole: 'FIRM',
    actorId,
    actorName,
    eventType: 'DOCUMENT_UPLOADED',
    entityType: 'DOCUMENT',
    entityId: doc.id,
    title: `Documento anexado à tarefa: ${task.title}`,
    metadata: { taskId, mimeType: file.mimetype },
  });

  if (notifyClient) {
    const sb = require('../../db/supabase/client').getSupabaseAdmin();
    if (sb) {
      const hasObligation = Boolean(doc.obligation_id || doc.obligationId);
      const targetRoute = hasObligation ? '/app/client/agenda' : '/app/client/requests';
      const { error: notifErr } = await sb.from('in_app_notifications').insert({
        firm_id: firmId,
        client_id: clientId,
        category: 'DOCUMENT',
        type: 'DOCUMENT',
        title: 'Novo documento do escritório',
        body: doc.title,
        entity_type: 'DOCUMENT',
        entity_id: doc.id,
        action_url: targetRoute,
      });
      if (notifErr) console.warn('[client-tasks] notification:', notifErr.message);
    }
  }

  return { document: { _id: doc.id, title: doc.title, mimeType: doc.mime_type } };
}

module.exports = { attachDocumentToTask };
