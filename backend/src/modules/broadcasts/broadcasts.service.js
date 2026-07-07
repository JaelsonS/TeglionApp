/**
 * Central de Alertas — broadcasts com fan-out e analytics.
 */
const { AppError } = require('../../middlewares/error.middleware');
const broadcastsRepository = require('../../db/supabase/repositories/broadcasts.repository');
const clientsRepository = require('../../db/supabase/repositories/clients.repository');
const activityService = require('../../services/activity/activity.service');
const { FAN_OUT_CHUNK } = require('./broadcast.constants');

function slugify(title) {
  return (
    String(title || 'alerta')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 72) || 'alerta'
  );
}

async function resolveUniqueSlug(firmId, base) {
  let candidate = base;
  for (let n = 0; n < 100; n += 1) {
    const existing = await broadcastsRepository.findBySlug(firmId, candidate);
    if (!existing) return candidate;
    candidate = n === 0 ? `${base}-2` : `${base}-${n + 2}`;
  }
  return `${base}-${Date.now()}`;
}

async function resolveTargetClientIds(firmId, broadcast) {
  if (broadcast.targetType === 'SELECTED') {
    return (broadcast.targetClientIds || []).filter(Boolean);
  }
  const clients = await clientsRepository.listClients(firmId, { limit: 5000, includeInactive: false });
  return clients.map((c) => c.id);
}

async function fanOutBroadcast(broadcast) {
  const clientIds = await resolveTargetClientIds(broadcast.firmId, broadcast);
  if (!clientIds.length) return { delivered: 0 };

  const now = new Date().toISOString();
  let delivered = 0;

  for (let i = 0; i < clientIds.length; i += FAN_OUT_CHUNK) {
    const chunk = clientIds.slice(i, i + FAN_OUT_CHUNK);
    const readRows = chunk.map((clientId) => ({
      broadcast_id: broadcast.id,
      firm_id: broadcast.firmId,
      client_id: clientId,
    }));
    await broadcastsRepository.bulkInsertReads(readRows);

    const notifRows = chunk.map((clientId) => ({
      firm_id: broadcast.firmId,
      client_id: clientId,
      type: 'BROADCAST',
      title: broadcast.title,
      body: broadcast.excerpt || broadcast.body?.slice(0, 200) || null,
      entity_type: 'BROADCAST',
      entity_id: broadcast.id,
    }));
    await broadcastsRepository.bulkInsertNotifications(notifRows);
    delivered += chunk.length;
  }

  await broadcastsRepository.updateBroadcast(broadcast.id, broadcast.firmId, {
    delivery_count: delivered,
    read_count: 0,
    ack_count: 0,
  });

  return { delivered };
}

async function publishScheduledIfDue(firmId) {
  const sb = require('../../db/supabase/client').getSupabaseAdmin();
  const now = new Date().toISOString();
  const { data } = await sb
    .from('firm_broadcasts')
    .select('*')
    .eq('firm_id', firmId)
    .eq('status', 'SCHEDULED')
    .lte('scheduled_at', now);
  for (const row of data || []) {
    const mapped = broadcastsRepository.mapBroadcast(row);
    await broadcastsRepository.updateBroadcast(mapped.id, firmId, {
      status: 'PUBLISHED',
      published_at: now,
    });
    const updated = await broadcastsRepository.findById(firmId, mapped.id);
    await fanOutBroadcast(updated);
  }
}

async function listForFirm({ firmId, status, category, priority, search, page = 1, limit = 30 }) {
  await publishScheduledIfDue(firmId);
  const offset = (Math.max(1, page) - 1) * limit;
  return broadcastsRepository.listBroadcasts(firmId, { status, category, priority, search, limit, offset });
}

async function getAnalytics({ firmId, broadcastId }) {
  const broadcast = await broadcastsRepository.findById(firmId, broadcastId);
  if (!broadcast) throw new AppError('Alerta não encontrado', 404);

  const reads = await broadcastsRepository.listReadsForAnalytics(broadcastId);
  const delivered = broadcast.deliveryCount || reads.length;
  const readClients = reads.filter((r) => r.read_at);
  const ackClients = reads.filter((r) => r.acknowledged_at);
  const pending = reads.filter((r) => !r.read_at);

  const clientIds = [...new Set(reads.map((r) => r.client_id))];
  const clients =
    clientIds.length > 0 ? await clientsRepository.findClientsByIds(firmId, clientIds) : [];
  const nameById = new Map(clients.map((c) => [c.id, c.displayName || c.name]));

  return {
    broadcast,
    metrics: {
      delivered,
      read: readClients.length,
      acknowledged: ackClients.length,
      pending: pending.length,
      readRate: delivered ? Math.round((readClients.length / delivered) * 100) : 0,
      ackRate: delivered ? Math.round((ackClients.length / delivered) * 100) : 0,
    },
    readers: readClients.map((r) => ({
      clientId: r.client_id,
      clientName: nameById.get(r.client_id) || 'Cliente',
      readAt: r.read_at,
      acknowledgedAt: r.acknowledged_at,
    })),
    pendingClients: pending.map((r) => ({
      clientId: r.client_id,
      clientName: nameById.get(r.client_id) || 'Cliente',
    })),
  };
}

function normalizePayload(payload) {
  const p = payload || {};
  return {
    title: String(p.title || '').trim(),
    body: String(p.body || '').trim(),
    excerpt: p.excerpt ? String(p.excerpt).trim() : null,
    category: p.category || 'AVISO',
    priority: p.priority || 'MEDIUM',
    dueAt: p.dueAt || p.due_at || null,
    scheduledAt: p.scheduledAt || p.scheduled_at || null,
    expiresAt: p.expiresAt || p.expires_at || null,
    status: p.status || 'DRAFT',
    targetType: p.targetType || p.target_type || 'ALL_CLIENTS',
    targetClientIds: p.targetClientIds || p.target_client_ids || [],
    ctaLabel: p.ctaLabel || p.cta_label || null,
    ctaUrl: p.ctaUrl || p.cta_url || null,
    attachments: Array.isArray(p.attachments) ? p.attachments : [],
    pinned: Boolean(p.pinned),
    readConfirmationRequired: Boolean(p.readConfirmationRequired ?? p.read_confirmation_required),
    coverUrl: p.coverUrl || p.cover_url || null,
  };
}

async function createBroadcast({ firmId, payload, author }) {
  const norm = normalizePayload(payload);
  if (!norm.title) throw new AppError('Título é obrigatório', 400);
  if (!norm.body) throw new AppError('Conteúdo é obrigatório', 400);

  const slug = await resolveUniqueSlug(firmId, slugify(norm.title));
  let status = norm.status;
  if (norm.scheduledAt && new Date(norm.scheduledAt) > new Date()) {
    status = 'SCHEDULED';
  }

  const row = {
    firm_id: firmId,
    title: norm.title,
    slug,
    excerpt: norm.excerpt,
    body: norm.body,
    category: norm.category,
    priority: norm.priority,
    due_at: norm.dueAt,
    scheduled_at: norm.scheduledAt,
    expires_at: norm.expiresAt,
    status,
    target_type: norm.targetType,
    target_client_ids: norm.targetClientIds,
    cta_label: norm.ctaLabel,
    cta_url: norm.ctaUrl,
    attachments: norm.attachments,
    pinned: norm.pinned,
    read_confirmation_required: norm.readConfirmationRequired,
    cover_url: norm.coverUrl,
    author_id: author?.id || null,
    author_name: author?.name || 'Escritório',
    published_at: status === 'PUBLISHED' ? new Date().toISOString() : null,
  };

  const broadcast = await broadcastsRepository.insertBroadcast(row);

  if (status === 'PUBLISHED') {
    await fanOutBroadcast(broadcast);
    void activityService.recordActivity({
      firmId,
      actorRole: 'FIRM',
      actorId: author?.id,
      actorName: author?.name,
      eventType: 'BROADCAST_PUBLISHED',
      entityType: 'BROADCAST',
      entityId: broadcast.id,
      title: `Alerta publicado: ${broadcast.title}`,
      metadata: { priority: broadcast.priority, category: broadcast.category },
    });
  }

  return broadcast;
}

async function updateBroadcast({ firmId, id, payload }) {
  const existing = await broadcastsRepository.findById(firmId, id);
  if (!existing) throw new AppError('Alerta não encontrado', 404);

  const norm = normalizePayload({ ...existing, ...payload });
  const wasPublished = existing.status === 'PUBLISHED';
  let status = norm.status || existing.status;

  if (norm.scheduledAt && new Date(norm.scheduledAt) > new Date() && status !== 'ARCHIVED') {
    status = 'SCHEDULED';
  }

  const patch = {
    title: norm.title || existing.title,
    excerpt: norm.excerpt,
    body: norm.body || existing.body,
    category: norm.category,
    priority: norm.priority,
    due_at: norm.dueAt,
    scheduled_at: norm.scheduledAt,
    expires_at: norm.expiresAt,
    status,
    target_type: norm.targetType,
    target_client_ids: norm.targetClientIds,
    cta_label: norm.ctaLabel,
    cta_url: norm.ctaUrl,
    attachments: norm.attachments,
    pinned: norm.pinned,
    read_confirmation_required: norm.readConfirmationRequired,
    cover_url: norm.coverUrl,
  };

  if (status === 'PUBLISHED' && !existing.publishedAt) {
    patch.published_at = new Date().toISOString();
  }

  const updated = await broadcastsRepository.updateBroadcast(id, firmId, patch);

  if (status === 'PUBLISHED' && !wasPublished) {
    await fanOutBroadcast(updated);
  }

  return updated;
}

async function deleteBroadcast({ firmId, id }) {
  await broadcastsRepository.deleteBroadcast(id, firmId);
}

async function listClientFeed({ firmId, clientId, category, search }) {
  return broadcastsRepository.listPublishedForClient(firmId, clientId, { category, search });
}

async function markClientRead({ firmId, clientId, broadcastId, acknowledge = false }) {
  const broadcast = await broadcastsRepository.findById(firmId, broadcastId);
  if (!broadcast || broadcast.status !== 'PUBLISHED') {
    throw new AppError('Alerta não encontrado', 404);
  }

  const existing = await broadcastsRepository.getReadRow(broadcastId, clientId);
  if (!existing) throw new AppError('Alerta não disponível para este cliente', 403);

  const wasRead = Boolean(existing.read_at);
  const wasAck = Boolean(existing.acknowledged_at);

  await broadcastsRepository.markRead(broadcastId, clientId, {
    acknowledged: acknowledge || broadcast.readConfirmationRequired,
  });

  if (!wasRead) await broadcastsRepository.incrementBroadcastCounters(broadcastId, { readDelta: 1 });
  if (acknowledge && !wasAck) await broadcastsRepository.incrementBroadcastCounters(broadcastId, { ackDelta: 1 });

  const sb = require('../../db/supabase/client').getSupabaseAdmin();
  await sb
    .from('in_app_notifications')
    .update({ read_at: new Date().toISOString() })
    .eq('firm_id', firmId)
    .eq('client_id', clientId)
    .eq('entity_type', 'BROADCAST')
    .eq('entity_id', broadcastId);

  void activityService.recordActivity({
    firmId,
    clientId,
    actorRole: 'CLIENT',
    actorId: clientId,
    eventType: acknowledge ? 'BROADCAST_ACKNOWLEDGED' : 'BROADCAST_READ',
    entityType: 'BROADCAST',
    entityId: broadcastId,
    title: acknowledge ? 'Confirmação de leitura' : 'Alerta visualizado',
  });

  return { ok: true };
}

async function getUrgentBannerForClient(firmId, clientId) {
  const items = await broadcastsRepository.listPublishedForClient(firmId, clientId, { limit: 20 });
  const urgent = items.find(
    (a) =>
      (a.priority === 'URGENT' || a.category === 'URGENT') &&
      (!a.isRead || a.needsAck)
  );
  return urgent || null;
}

async function getHubAlertsSummary(firmId, clientId) {
  const unread = await broadcastsRepository.countUnreadForClient(firmId, clientId);
  const items = await broadcastsRepository.listPublishedForClient(firmId, clientId, { limit: 5 });
  const urgent = items.filter((a) => a.priority === 'URGENT' && (!a.isRead || a.needsAck)).length;
  return { unread, urgent, recent: items.slice(0, 3) };
}

function getEditorTemplates() {
  return [
    {
      id: 'iva-deadline',
      category: 'IVA',
      priority: 'HIGH',
      title: 'Prazo de entrega de IVA',
      excerpt: 'Lembrete do prazo de entrega do período em curso.',
      body: 'Informamos que o prazo de entrega do IVA referente ao período em curso está a aproximar-se.\n\nPor favor, envie os documentos em falta através do portal.',
      readConfirmationRequired: true,
    },
    {
      id: 'docs-pending',
      category: 'DOC_PENDING',
      priority: 'MEDIUM',
      title: 'Documentos em falta',
      excerpt: 'Existem documentos pendentes para fechar a sua contabilidade.',
      body: 'Identificámos documentos em falta na sua área de cliente. Aceda ao portal e envie os ficheiros indicados nas tarefas.',
    },
  ];
}

module.exports = {
  listForFirm,
  createBroadcast,
  updateBroadcast,
  deleteBroadcast,
  getAnalytics,
  listClientFeed,
  markClientRead,
  getUrgentBannerForClient,
  getHubAlertsSummary,
  getEditorTemplates,
};
