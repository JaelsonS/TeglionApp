/**
 * Helpers puros do hub do portal cliente — extraídos de portal.service.js.
 */

const ACTIVE_TASK_STATUSES = ['BACKLOG', 'TODO', 'IN_PROGRESS', 'WAITING_CLIENT', 'REVIEW'];

function currentPeriod() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

/** Normaliza listDocuments (objeto paginado) ou array legado. */
function normalizeDocumentList(result) {
  if (Array.isArray(result)) return result;
  if (result && Array.isArray(result.items)) return result.items;
  return [];
}

function buildMinimalHubResponse({ firmId, period } = {}) {
  const p = period || currentPeriod();
  return {
    period: p,
    firm: {
      id: firmId ? String(firmId) : '',
      name: 'Escritório',
      status: null,
      logoUrl: null,
    },
    fiscalHealth: 'ok',
    nextCriticalObligation: null,
    counts: {
      obligationsOpen: 0,
      obligationsOverdue: 0,
      tasksOpen: 0,
      documents: 0,
      unreadMessages: 0,
    },
    obligations: [],
    tasks: [],
    documents: [],
    recentMessages: [],
    historyPeriods: [],
    upcomingConsultations: [],
    alerts: [],
    metrics: {},
    degraded: true,
  };
}

function computeFiscalHealth(obligations, now) {
  const list = Array.isArray(obligations) ? obligations : [];
  const overdue = list.filter(
    (o) =>
      o &&
      o.status !== 'DELIVERED' &&
      o.status !== 'CANCELLED' &&
      o.dueDate &&
      new Date(o.dueDate) < now,
  );
  const nextCritical = list
    .filter((o) => o && !['DELIVERED', 'CANCELLED'].includes(o.status) && o.dueDate)
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())[0];

  let fiscalHealth = 'ok';
  if (overdue.length > 0) fiscalHealth = 'critical';
  else if (nextCritical?.dueDate) {
    const ms48h = 48 * 60 * 60 * 1000;
    const delta = new Date(nextCritical.dueDate).getTime() - now.getTime();
    if (delta <= ms48h) fiscalHealth = 'critical';
    else if (delta <= 5 * 24 * 60 * 60 * 1000) fiscalHealth = 'attention';
  }
  return { fiscalHealth, overdue, nextCritical };
}

async function loadHubSection(section, fn, fallback) {
  try {
    return await fn();
  } catch (err) {
    const { logger } = require('../../../utils/logger');
    logger.error('[portal.hub] section_failed', {
      section,
      message: err?.message || String(err),
      code: err?.code,
    });
    return fallback;
  }
}

module.exports = {
  ACTIVE_TASK_STATUSES,
  currentPeriod,
  normalizeDocumentList,
  buildMinimalHubResponse,
  computeFiscalHealth,
  loadHubSection,
};
