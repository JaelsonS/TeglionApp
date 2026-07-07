const { AppError } = require('../../middlewares/error.middleware');
const serviceRequestsRepo = require('../../db/supabase/repositories/service-requests.repository');
const clientsRepository = require('../../db/supabase/repositories/clients.repository');
const tasksWorkspace = require('../tasks/tasks-workspace.service');
const activityService = require('../../services/activity/activity.service');

async function enrichWithClientNames(firmId, items) {
  const ids = [...new Set(items.map((i) => i.clientId))];
  const names = new Map();
  await Promise.all(
    ids.map(async (id) => {
      const c = await clientsRepository.findClientById(firmId, id);
      if (c) names.set(id, c.displayName || c.name);
    }),
  );
  return items.map((i) => ({ ...i, clientName: names.get(i.clientId) || null }));
}

async function listPipeline(firmId, query) {
  const items = await serviceRequestsRepo.list({
    firmId,
    clientId: query.clientId,
    statusIn: query.status ? [query.status] : undefined,
  });
  return { items: await enrichWithClientNames(firmId, items) };
}

async function getDetail(firmId, id, clientId) {
  const request = await serviceRequestsRepo.findById(firmId, id, clientId);
  if (!request) throw new AppError('Pedido não encontrado', 404);
  const comments = await serviceRequestsRepo.listComments(id, { includeInternal: !clientId });
  const client = await clientsRepository.findClientById(firmId, request.clientId);
  return {
    request: { ...request, clientName: client?.displayName || client?.name },
    comments,
  };
}

async function createFromFirm({ firmId, actor, payload }) {
  const clientId = payload.clientId || payload.clientId;
  if (!clientId || !payload.title?.trim()) throw new AppError('Cliente e título obrigatórios', 400);
  const client = await clientsRepository.findClientById(firmId, clientId);
  if (!client) throw new AppError('Cliente não encontrado', 404);

  const request = await serviceRequestsRepo.insert({
    firm_id: firmId,
    client_id: clientId,
    accounting_service_id: payload.accountingServiceId || null,
    title: payload.title.trim(),
    description: payload.description?.trim() || null,
    status: payload.status || 'ASSIGNED',
    priority: payload.priority || 'NORMAL',
    assignee_id: payload.assigneeId || actor?.id || null,
    created_by_role: 'FIRM',
    created_by_id: actor?.id,
    submitted_at: new Date().toISOString(),
  });

  void activityService.recordActivity({
    firmId,
    clientId,
    actorRole: 'FIRM',
    actorId: actor?.id,
    eventType: 'SERVICE_REQUEST_CREATED',
    entityType: 'SERVICE_REQUEST',
    entityId: request.id,
    title: `Pedido criado: ${request.title}`,
  });

  return { request };
}

async function createFromClient({ actor, payload }) {
  const clientId = actor.clientId || actor.id;
  const firmId = actor.firmId;
  if (!payload.title?.trim()) throw new AppError('Título obrigatório', 400);

  const request = await serviceRequestsRepo.insert({
    firm_id: firmId,
    client_id: clientId,
    accounting_service_id: payload.accountingServiceId || null,
    title: payload.title.trim(),
    description: payload.description?.trim() || null,
    client_notes: payload.clientNotes?.trim() || null,
    status: 'SUBMITTED',
    priority: payload.priority || 'NORMAL',
    created_by_role: 'CLIENT',
    created_by_id: clientId,
    submitted_at: new Date().toISOString(),
  });

  await tasksWorkspace.notifyFirmStaff({
    firmId,
    category: 'SYSTEM',
    type: 'SERVICE_REQUEST',
    title: 'Novo pedido de serviço',
    body: request.title,
    entityType: 'SERVICE_REQUEST',
    entityId: request.id,
    actionUrl: `/app/firm/services?request=${request.id}`,
  });

  await tasksWorkspace.notifyClientInApp({
    firmId,
    clientId,
    type: 'SERVICE_REQUEST',
    title: 'Pedido enviado',
    body: request.title,
    entityId: request.id,
  });

  return { request };
}

async function updateRequest({ firmId, id, actor, patch, clientId }) {
  const existing = await serviceRequestsRepo.findById(firmId, id, clientId);
  if (!existing) throw new AppError('Pedido não encontrado', 404);

  const next = { ...patch };
  if (next.status === 'QUOTED' && next.quotedAmountCents != null) {
    next.quotedAt = new Date().toISOString();
  }
  if (next.status === 'APPROVED') next.approvedAt = new Date().toISOString();
  if (next.status === 'DONE') next.completedAt = new Date().toISOString();

  const request = await serviceRequestsRepo.update(id, firmId, next);

  if (next.status === 'QUOTED') {
    await tasksWorkspace.notifyClientInApp({
      firmId,
      clientId: request.clientId,
      type: 'SERVICE_REQUEST',
      title: 'Orçamento disponível',
      body: request.title,
      entityId: request.id,
    });
  }

  return { request };
}

async function approveQuote({ actor, id }) {
  const clientId = actor.clientId || actor.id;
  const firmId = actor.firmId;
  const existing = await serviceRequestsRepo.findById(firmId, id, clientId);
  if (!existing) throw new AppError('Pedido não encontrado', 404);
  if (existing.status !== 'QUOTED') throw new AppError('Orçamento ainda não disponível', 409);
  return updateRequest({
    firmId,
    id,
    actor,
    patch: { status: 'APPROVED' },
    clientId,
  });
}

function buildQuoteDocument(request, client) {
  const amount =
    request.quotedAmountCents != null
      ? `${(request.quotedAmountCents / 100).toFixed(2)} ${request.currency || 'EUR'}`
      : 'A definir';
  return {
    title: `Orçamento — ${request.title}`,
    clientName: client?.displayName || client?.name || 'Cliente',
    amount,
    description: request.description,
    status: request.status,
    quotedAt: request.quotedAt,
    generatedAt: new Date().toISOString(),
  };
}

async function getQuotePdfPayload(firmId, id, clientId) {
  const request = await serviceRequestsRepo.findById(firmId, id, clientId);
  if (!request) throw new AppError('Pedido não encontrado', 404);
  const client = await clientsRepository.findClientById(firmId, request.clientId);
  return { quote: buildQuoteDocument(request, client), request };
}

module.exports = {
  listPipeline,
  getDetail,
  createFromFirm,
  createFromClient,
  updateRequest,
  approveQuote,
  getQuotePdfPayload,
  addComment: async ({ firmId, id, actor, body, isInternal, clientId }) => {
    const req = await serviceRequestsRepo.findById(firmId, id, clientId);
    if (!req) throw new AppError('Pedido não encontrado', 404);
    const comment = await serviceRequestsRepo.insertComment({
      firmId,
      requestId: id,
      authorRole: clientId ? 'CLIENT' : 'FIRM',
      authorId: actor.id,
      authorName: actor.name || actor.fullName,
      body,
      isInternal: clientId ? false : isInternal,
    });
    return { comment };
  },
};
