/**
 * Cockpit agregado da empresa (escritório) — uma request, visão operacional completa.
 */
const { AppError } = require('../../middlewares/error.middleware');
const { getRepository } = require('../../db/supabase/repositories');
const clientsRepository = require('../../db/supabase/repositories/clients.repository');
const messagesRepository = require('../../db/supabase/repositories/messages.repository');
const activityService = require('../../services/activity/activity.service');
const { resolveFiscalProfile } = require('../../utils/client-metadata');
const broadcastsRepository = require('../../db/supabase/repositories/broadcasts.repository');

function operationalStatus(obligations, now) {
  const active = obligations.filter((o) => !['DELIVERED', 'CANCELLED'].includes(o.status));
  if (!active.length) return 'ativo';
  if (active.some((o) => new Date(o.dueDate) < now || o.status === 'OVERDUE')) return 'critico';
  const ms5d = 5 * 24 * 60 * 60 * 1000;
  if (active.some((o) => new Date(o.dueDate).getTime() - now.getTime() <= ms5d)) return 'atencao';
  return 'ativo';
}

/** Pontuação 0–100 com base em sinais reais (sem piso artificial de 15%). */
function computeRiskScore({
  overdueCount,
  fiscalHealth,
  operationalStatus,
  documentsPending,
  tasksOpen,
  unreadMessages,
}) {
  let score = 0;
  if (overdueCount > 0) {
    score = Math.max(score, 70 + Math.min(20, overdueCount * 8));
  }
  if (fiscalHealth === 'critical') score = Math.max(score, 75);
  else if (fiscalHealth === 'attention') score = Math.max(score, 38);
  if (operationalStatus === 'critico') score = Math.max(score, 82);
  else if (operationalStatus === 'atencao') score = Math.max(score, 42);
  if (documentsPending > 0) score += Math.min(12, documentsPending * 4);
  if (tasksOpen > 3) score += Math.min(10, (tasksOpen - 3) * 3);
  else if (tasksOpen > 0) score += Math.min(4, tasksOpen);
  if (unreadMessages > 0) score += Math.min(8, unreadMessages * 4);
  return Math.min(100, Math.max(0, Math.round(score)));
}

function fiscalHealthFrom(obligations, now) {
  const overdue = obligations.filter(
    (o) => o.status !== 'DELIVERED' && o.status !== 'CANCELLED' && new Date(o.dueDate) < now
  );
  if (overdue.length) return 'critical';
  const next = obligations
    .filter((o) => !['DELIVERED', 'CANCELLED'].includes(o.status))
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())[0];
  if (!next) return 'ok';
  const ms48h = 48 * 60 * 60 * 1000;
  const delta = new Date(next.dueDate).getTime() - now.getTime();
  if (delta <= ms48h) return 'critical';
  if (delta <= 5 * 24 * 60 * 60 * 1000) return 'attention';
  return 'ok';
}

function mapTimelineKind(eventType) {
  return activityService.mapTimelineKind(eventType);
}

async function buildUnifiedTimeline({ activities }) {
  return (activities || [])
    .map((a) => activityService.toTimelineItem(a))
    .filter((i) => i.at && !Number.isNaN(new Date(i.at).getTime()))
    .sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime())
    .slice(0, 40);
}

async function getClientHub({ firmId, clientId }) {
  const client = await clientsRepository.findClientById(firmId, clientId);
  if (!client) throw new AppError('Cliente não encontrado', 404);

  const now = new Date();
  const repo = getRepository();

  const [obligations, tasks, documents, messages, activities, unreadClient, clientAlerts, alertsUnread] =
    await Promise.all([
    repo.listObligations({ firmId, clientId }),
    repo.listClientTasks({ firmId, clientId }),
    repo.listDocuments({ firmId, clientId, limit: 24 }).then((r) => r?.items || r || []),
    messagesRepository.listMessages({ firmId, clientId, limit: 20 }),
    activityService.listActivityForClient({ firmId, clientId, limit: 35 }),
    messagesRepository.countUnreadForClient(firmId, clientId),
    broadcastsRepository.listPublishedForClient(firmId, clientId, { limit: 6 }),
    broadcastsRepository.countUnreadForClient(firmId, clientId),
  ]);

  const activeObligations = obligations.filter((o) => !['DELIVERED', 'CANCELLED'].includes(o.status));
  const overdueObligations = activeObligations.filter((o) => new Date(o.dueDate) < now || o.status === 'OVERDUE');
  const upcomingDeadlines = [...activeObligations]
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
    .slice(0, 6)
    .map((o) => ({
      id: o._id || o.id,
      title: o.title || o.type,
      type: o.type,
      dueDate: o.dueDate,
      status: o.status,
      priority: o.priority || 'NORMAL',
    }));

  const doneStatuses = ['DONE', 'ARCHIVED', 'APPROVED', 'CANCELLED'];
  const openTasks = tasks.filter((t) => !doneStatuses.includes(t.status));
  const criticalTasks = openTasks
    .filter(
      (t) =>
        t.isOverdue ||
        t.helpRequestedAt ||
        ['TODO', 'IN_PROGRESS', 'WAITING_CLIENT', 'OPEN', 'SUBMITTED'].includes(t.status),
    )
    .slice(0, 5);

  const pendingDocuments = documents.filter((d) => d.validationStatus === 'PENDING');
  const lastMessage = [...messages].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  )[0];

  const timeline = await buildUnifiedTimeline({
    activities,
  });

  const profileChanges = (activities || []).filter((a) => a.eventType === 'CLIENT_UPDATED').slice(0, 15);

  return {
    client: {
      ...client,
      fiscalProfile: resolveFiscalProfile(client.metadata),
    },
    summary: {
      operationalStatus: operationalStatus(obligations, now),
      fiscalHealth: fiscalHealthFrom(obligations, now),
      riskScore: computeRiskScore({
        overdueCount: overdueObligations.length,
        fiscalHealth: fiscalHealthFrom(obligations, now),
        operationalStatus: operationalStatus(obligations, now),
        documentsPending: pendingDocuments.length,
        tasksOpen: openTasks.length,
        unreadMessages: unreadClient,
      }),
    },
    counts: {
      obligationsOpen: activeObligations.length,
      obligationsOverdue: overdueObligations.length,
      tasksOpen: openTasks.length,
      documentsPending: pendingDocuments.length,
      unreadMessagesFromClient: unreadClient,
    },
    cards: {
      upcomingDeadlines,
      criticalTasks: criticalTasks.map((t) => ({
        id: t._id || t.id,
        title: t.title,
        status: t.status,
        dueDate: t.dueDate,
      })),
      pendingDocuments: pendingDocuments.slice(0, 5).map((d) => ({
        id: d._id || d.id,
        title: d.title,
        period: d.period,
        createdAt: d.createdAt,
      })),
      lastInteraction: lastMessage
        ? {
            at: lastMessage.createdAt,
            preview: String(lastMessage.body || '').slice(0, 120),
            from: lastMessage.senderRole,
          }
        : null,
    },
    timeline,
    profileHistory: profileChanges,
    recentActivity: activities.slice(0, 12),
    alerts: {
      unread: alertsUnread,
      urgent: clientAlerts.filter(
        (a) => a.priority === 'URGENT' && (!a.isRead || a.needsAck)
      ).length,
      items: clientAlerts.slice(0, 4).map((a) => ({
        id: a.id,
        title: a.title,
        priority: a.priority,
        category: a.category,
        dueAt: a.dueAt,
        isRead: a.isRead,
        needsAck: a.needsAck,
        pinned: a.pinned,
      })),
    },
  };
}

module.exports = { getClientHub };
