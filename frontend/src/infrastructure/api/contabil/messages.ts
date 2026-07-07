import type { AxiosInstance } from 'axios'

export function createContabilMessagesApi(api: AxiosInstance) {
  return {
    listThreads: () => api.get('/contabil/messages/threads').then((r) => r.data),

    getUnreadSummary: () =>
      api
        .get('/contabil/messages/unread-summary')
        .then((r) => r.data as { total: number; threadsWithUnread?: number }),

    listByClient: (clientId: string) =>
      api.get(`/contabil/messages/clients/${encodeURIComponent(clientId)}`).then((r) => r.data),

    send: (
      payload: {
        clientId: string
        body?: string
        quickReplyKey?: string
        obligationId?: string
        clientTaskId?: string
        isDocumentRequest?: boolean
      },
      file?: File | null,
    ) => {
      if (file) {
        const fd = new FormData()
        fd.append('clientId', payload.clientId)
        if (payload.body) fd.append('body', payload.body)
        if (payload.quickReplyKey) fd.append('quickReplyKey', payload.quickReplyKey)
        if (payload.isDocumentRequest) fd.append('isDocumentRequest', 'true')
        fd.append('file', file)
        return api.post('/contabil/messages', fd).then((r) => r.data)
      }
      return api.post('/contabil/messages', payload).then((r) => r.data)
    },

    update: (payload: { messageId: string; clientId: string; body: string }) =>
      api
        .patch(`/contabil/messages/${encodeURIComponent(payload.messageId)}`, {
          clientId: payload.clientId,
          body: payload.body,
        })
        .then((r) => r.data),

    listDocumentRequests: (clientId: string) =>
      api.get(`/contabil/document-requests/clients/${encodeURIComponent(clientId)}`).then((r) => r.data),

    createDocumentRequest: (payload: {
      clientId: string
      messageId?: string
      obligationId?: string
      periodMonth?: string
      title?: string
      instructions?: string
    }) => api.post('/contabil/document-requests', payload).then((r) => r.data),

    convertMessageToDocumentRequest: (
      messageId: string,
      payload?: { obligationId?: string; periodMonth?: string },
    ) =>
      api
        .post(`/contabil/messages/${encodeURIComponent(messageId)}/convert-to-request`, payload || {})
        .then((r) => r.data),

    notifyCriticalObligations: () => api.post('/contabil/messages/notify-critical').then((r) => r.data),

    notifyInactiveClients: () => api.post('/contabil/messages/notify-inactive').then((r) => r.data),
  }
}

export type ContabilMessagesApi = ReturnType<typeof createContabilMessagesApi>
