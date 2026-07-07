const messagesService = require('../messages/messages.service');
const documentRequestsRepo = require('../../db/supabase/repositories/document-requests.repository');
const clientsRepository = require('../../db/supabase/repositories/clients.repository');

/**
 * Inbox agregada do escritório — uma resposta para threads + pedidos + resumo.
 */
async function getFirmInbox({ firmId, clientId, requestStatus, requestLimit = 500 }) {
  const [threads, requests, unread, clientRows] = await Promise.all([
    messagesService.listThreads({ firmId }),
    documentRequestsRepo.listByFirm({
      firmId,
      clientId: clientId || undefined,
      status: requestStatus || undefined,
      limit: requestLimit,
    }),
    messagesService.getUnreadSummary({ firmId }),
    clientsRepository.listClients(firmId, { limit: 250, includeInactive: false }),
  ]);

  const clientById = new Map(
    (clientRows || []).map((c) => [
      c.id,
      c.displayName || c.fullName || c.name || 'Cliente',
    ]),
  );

  for (const t of threads) {
    if (!t.clientName || t.clientName === 'Cliente') {
      t.clientName = clientById.get(t.clientId) || t.clientName || 'Cliente';
    }
  }

  const reconciled = await documentRequestsRepo.reconcileWithApprovedDocuments(firmId, requests);

  const requestsWithNames = reconciled.map((r) => ({
    ...r,
    clientName: clientById.get(r.clientId) || 'Cliente',
  }));

  return {
    threads,
    requests: requestsWithNames,
    unread,
    clients: (clientRows || []).map((c) => ({
      id: c.id,
      _id: c.id,
      fullName: c.displayName || c.fullName || c.name,
      name: c.name,
      email: c.email,
      status: c.status,
    })),
  };
}

module.exports = { getFirmInbox };
