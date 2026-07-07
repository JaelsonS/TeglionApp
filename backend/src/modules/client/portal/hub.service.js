/**
 * Hub do portal cliente — resumo e dashboard.
 */
const { getRepository } = require('../../../db/supabase/repositories');
const firmsRepository = require('../../../db/supabase/repositories/firms.repository');
const firmBrandingService = require('../../firm/firm-branding.service');
const messagesRepository = require('../../../db/supabase/repositories/messages.repository');
const consultationsRepository = require('../../../db/supabase/repositories/consultations.repository');
const { logger } = require('../../../utils/logger');
const { requireLinkedClient } = require('./client.guard');
const {
  ACTIVE_TASK_STATUSES,
  currentPeriod,
  normalizeDocumentList,
  computeFiscalHealth,
  loadHubSection,
} = require('./hub.helpers');

async function getHubSummary({ actor }) {
  let client;
  try {
    client = await requireLinkedClient(actor);
  } catch (err) {
    logger.error('[portal.hub] client_resolution_failed', {
      message: err?.message,
      role: actor?.role,
    });
    throw err;
  }

  const firmId = client.firmId;
  const clientId = client.id;
  const period = currentPeriod();
  const repo = getRepository();
  const now = new Date();

  const [firm, obligations, tasks, documentsRaw, consultationsRaw, recentMessages] = await Promise.all([
    loadHubSection('firm', () => firmsRepository.findFirmById(firmId), null),
    loadHubSection('obligations', () => repo.listObligations({ firmId, clientId }), []),
    loadHubSection(
      'tasks',
      () =>
        repo.listClientTasks({
          firmId,
          clientId,
          statusIn: ACTIVE_TASK_STATUSES,
        }),
      [],
    ),
    loadHubSection(
      'documents',
      () => repo.listDocuments({ firmId, clientId, limit: 50 }),
      { items: [] },
    ),
    loadHubSection(
      'consultations',
      () =>
        consultationsRepository.listConsultations({
          firmId,
          clientId,
          from: now.toISOString(),
          limit: 48,
        }),
      [],
    ),
    loadHubSection(
      'messages',
      () => messagesRepository.listMessages({ firmId, clientId, limit: 8 }),
      [],
    ),
  ]);

  const documents = normalizeDocumentList(documentsRaw);
  const obligationsList = Array.isArray(obligations) ? obligations : [];
  const tasksList = Array.isArray(tasks) ? tasks : [];
  const messagesList = Array.isArray(recentMessages) ? recentMessages : [];
  const consultationsList = Array.isArray(consultationsRaw) ? consultationsRaw : [];

  const upcomingConsultations = consultationsList
    .filter((c) => c && c.status === 'SCHEDULED' && c.scheduledAt && new Date(c.scheduledAt).getTime() >= now.getTime())
    .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime())
    .slice(0, 8)
    .map((c) => ({
      _id: c._id,
      clientId: c.clientId,
      title: c.title,
      scheduledAt: c.scheduledAt,
      durationMinutes: c.durationMinutes,
      status: c.status,
      source: c.source,
    }));

  const { fiscalHealth, overdue, nextCritical } = computeFiscalHealth(obligationsList, now);

  const sortedDocuments = [...documents].sort((a, b) => {
    const aFirm = a.uploadedByRole === 'FIRM' ? 1 : 0;
    const bFirm = b.uploadedByRole === 'FIRM' ? 1 : 0;
    if (bFirm !== aFirm) return bFirm - aFirm;
    const ta = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const tb = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    return tb - ta;
  });

  const firmLogoUrl = firm
    ? await loadHubSection('firm_logo', () => firmBrandingService.resolveLogoUrl(firm), null)
    : null;

  return {
    period,
    firm: {
      id: firmId,
      slug: firm?.slug || null,
      name: firm?.name || 'Escritório',
      status: firm?.status || null,
      logoUrl: firmLogoUrl,
    },
    fiscalHealth,
    nextCriticalObligation: nextCritical || null,
    counts: {
      obligationsOpen: obligationsList.filter((o) => o && !['DELIVERED', 'CANCELLED'].includes(o.status)).length,
      obligationsOverdue: overdue.length,
      tasksOpen: tasksList.length,
      documents: documents.length,
      unreadMessages: messagesList.filter((m) => m && m.senderRole === 'FIRM' && !m.readAt).length,
    },
    obligations: obligationsList,
    tasks: tasksList,
    documents: sortedDocuments,
    recentMessages: messagesList.slice(-5),
    historyPeriods: [...new Set(obligationsList.map((o) => o?.period).filter(Boolean))].sort().reverse(),
    upcomingConsultations,
    alerts: [],
    metrics: {},
  };
}

async function getClientDashboard({ actor }) {
  const client = await requireLinkedClient(actor);
  const firmId = client.firmId;
  const clientId = client.id;
  const period = currentPeriod();
  const repo = getRepository();
  const documentRequestsService = require('../../document-requests/document-requests.service');
  const now = new Date();

  const [firm, obligations, documentRequests, unreadMessages] = await Promise.all([
    loadHubSection('firm', () => firmsRepository.findFirmById(firmId), null),
    loadHubSection('obligations', () => repo.listObligations({ firmId, clientId }), []),
    loadHubSection(
      'document_requests',
      () => documentRequestsService.listByClient({ firmId, clientId }),
      { items: [] },
    ),
    loadHubSection(
      'unread_messages',
      () => messagesRepository.countUnreadForClient(firmId, clientId),
      0,
    ),
  ]);

  const obligationsList = Array.isArray(obligations) ? obligations : [];
  const requestsList = documentRequests?.items || documentRequests || [];
  const { fiscalHealth, overdue } = computeFiscalHealth(obligationsList, now);
  const pendingRequests = (Array.isArray(requestsList) ? requestsList : []).filter(
    (r) => r && ['pending', 'seen'].includes(String(r.status)),
  ).length;

  const firmLogoUrl = firm
    ? await loadHubSection('firm_logo', () => firmBrandingService.resolveLogoUrl(firm), null)
    : null;

  return {
    period,
    firm: {
      id: String(firmId),
      name: firm?.name || 'Escritório',
      logoUrl: firmLogoUrl,
    },
    fiscalHealth,
    counts: {
      obligationsOpen: obligationsList.filter((o) => o && !['DELIVERED', 'CANCELLED'].includes(o.status)).length,
      obligationsOverdue: overdue.length,
      pendingDocumentRequests: pendingRequests,
      unreadMessages: typeof unreadMessages === 'number' ? unreadMessages : 0,
    },
  };
}

async function listMyObligations({ actor, period }) {
  const client = await requireLinkedClient(actor);
  const items = await getRepository().listObligations({
    firmId: client.firmId,
    clientId: client.id,
    period: period ? String(period).trim() : undefined,
  });
  return { items };
}

module.exports = {
  getHubSummary,
  getClientDashboard,
  listMyObligations,
};
