const { hasPermissionForUser, PERMISSIONS } = require('../../utils/permissions');
const messagesService = require('../messages/messages.service');
const serviceInquiriesService = require('./service-inquiries.service');
const consultationsService = require('../consultations/consultations.service');
const firmObligations = require('../obligations/firm-obligations.service');
const tasksWorkspace = require('../tasks/tasks-workspace.service');
const obligationOperational = require('../obligations/obligation-operational.service');

/**
 * Contagens leves para o chrome (sidebar/mobile/tablet) — 1 request em vez de 5–6 polls.
 * Cada contagem só corre se o utilizador tiver a permissão correspondente.
 */
async function getNavBadges({ firmId, user }) {
  const empty = {
    messages: 0,
    serviceInquiries: 0,
    consultations: 0,
    documents: 0,
    tasks: 0,
    obligations: 0,
  };

  const jobs = [];

  if (hasPermissionForUser(user, PERMISSIONS.FIRM_CLIENTS_MANAGE)) {
    jobs.push(
      messagesService.getUnreadSummary({ firmId }).then((s) => {
        empty.messages = Number(s?.total || 0);
      }),
    );
    jobs.push(
      firmObligations
        .listFirmDocuments({
          firmId,
          validationStatus: 'PENDING',
          limit: 1,
          page: 1,
        })
        .then((data) => {
          empty.documents = Number(data?.total ?? data?.items?.length ?? 0);
        }),
    );
    jobs.push(
      tasksWorkspace.getMetrics(firmId).then((m) => {
        empty.tasks = Number(m?.overdue || 0) + Number(m?.critical || 0);
      }),
    );
  }

  if (hasPermissionForUser(user, PERMISSIONS.FIRM_SERVICE_INQUIRIES_MANAGE)) {
    jobs.push(
      serviceInquiriesService.countUnseen({ firmId }).then((r) => {
        empty.serviceInquiries = Number(r?.count ?? r ?? 0);
      }),
    );
  }

  if (hasPermissionForUser(user, PERMISSIONS.FIRM_CONSULTATIONS_MANAGE)) {
    jobs.push(
      consultationsService.getAttentionCount({ firmId }).then((r) => {
        empty.consultations = Number(r?.count ?? r ?? 0);
      }),
    );
  }

  if (hasPermissionForUser(user, PERMISSIONS.FIRM_OBLIGATIONS_MANAGE)) {
    jobs.push(
      obligationOperational.getOperationalDashboard(firmId).then((data) => {
        const metrics = data?.metrics || {};
        empty.obligations = Number(metrics.critical || 0) + Number(metrics.overdue || 0);
      }),
    );
  }

  const results = await Promise.allSettled(jobs);
  for (const r of results) {
    if (r.status === 'rejected') {
      // Uma contagem falhou — não derrubar o chrome; manter 0 nesse campo.
      // Erros de permissão/DB não devem gerar tempestade de retries no FE.
    }
  }

  return empty;
}

module.exports = { getNavBadges };
