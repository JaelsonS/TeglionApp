import type { AxiosInstance } from 'axios'

export function createClientPortalContabilApi(api: AxiosInstance) {
  return {
    getHub: () => api.get('/client-portal/me/contabil/hub').then((r) => r.data),

    listObligations: (params?: { period?: string }) =>
      api.get('/client-portal/me/contabil/obligations', { params }).then((r) => r.data),

    listTasks: (params?: { status?: string }) =>
      api.get('/client-portal/me/contabil/tasks', { params }).then((r) => r.data),

    completeTask: (id: string, payload?: { note?: string }) =>
      api
        .post(`/client-portal/me/contabil/tasks/${encodeURIComponent(id)}/complete`, payload ?? {})
        .then((r) => r.data),

    requestTaskHelp: (id: string, payload?: { message?: string }) =>
      api
        .post(`/client-portal/me/contabil/tasks/${encodeURIComponent(id)}/help`, payload ?? {})
        .then((r) => r.data),

    addTaskComment: (id: string, body: string) =>
      api
        .post(`/client-portal/me/contabil/tasks/${encodeURIComponent(id)}/comments`, { body })
        .then((r) => r.data),

    submitTask: (id: string, payload?: { note?: string }) =>
      api
        .post(`/client-portal/me/contabil/tasks/${encodeURIComponent(id)}/submit`, payload || {})
        .then((r) => r.data),

    uploadDocument: (formData: FormData) =>
      api
        .post('/client-portal/me/contabil/documents/upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
          onUploadProgress: (e) => {
            if (e.total) {
              const pct = Math.round((e.loaded * 100) / e.total)
              formData.set('_progress', String(pct))
            }
          },
        })
        .then((r) => r.data),

    recordDocumentView: (id: string, sessionId?: string) =>
      api
        .post(`/client-portal/me/contabil/documents/${encodeURIComponent(id)}/view`, { sessionId })
        .then((r) => r.data as { viewId?: string; viewedAtLabel?: string }),

    recordObligationView: (id: string, sessionId?: string) =>
      api
        .post(`/client-portal/me/contabil/obligations/${encodeURIComponent(id)}/view`, { sessionId })
        .then((r) => r.data as { viewId?: string; viewedAtLabel?: string }),

    endView: (viewId: string, durationSeconds: number) =>
      api
        .post('/client-portal/me/contabil/tracking/end-view', { viewId, durationSeconds })
        .then((r) => r.data),

    markObligationPaid: (id: string, formData?: FormData) =>
      api
        .post(`/client-portal/me/contabil/obligations/${encodeURIComponent(id)}/mark-paid`, formData || {}, {
          headers: formData ? { 'Content-Type': 'multipart/form-data' } : undefined,
        })
        .then((r) => r.data),

    listNotifications: () => api.get('/client-portal/me/contabil/notifications').then((r) => r.data),

    markNotificationRead: (id: string) =>
      api.patch(`/client-portal/me/contabil/notifications/${encodeURIComponent(id)}/read`).then((r) => r.data),

    markAllNotificationsRead: () =>
      api.post('/client-portal/me/contabil/notifications/read-all').then((r) => r.data),

    listAlerts: (params?: { category?: string; search?: string }) =>
      api.get('/client-portal/me/contabil/alerts', { params }).then((r) => r.data),

    markAlertRead: (id: string, acknowledge?: boolean) =>
      api
        .post(`/client-portal/me/contabil/alerts/${encodeURIComponent(id)}/read`, { acknowledge })
        .then((r) => r.data),

    listNews: (params?: { category?: string; search?: string }) =>
      api.get('/client-portal/me/contabil/news', { params }).then((r) => r.data),

    getNewsArticle: (slug: string) =>
      api.get(`/client-portal/me/contabil/news/${encodeURIComponent(slug)}`).then((r) => r.data),

    getMessagesUnreadCount: () =>
      api.get('/client-portal/me/contabil/messages/unread-count').then((r) => r.data as { total: number }),

    listMessages: () => api.get('/client-portal/me/contabil/messages').then((r) => r.data),

    listDocumentRequests: () =>
      api
        .get('/client-portal/me/contabil/document-requests')
        .then((r) => r.data as { items: unknown[] }),

    markDocumentRequestSeen: (requestId: string) =>
      api
        .post(`/client-portal/me/contabil/document-requests/${encodeURIComponent(requestId)}/seen`)
        .then((r) => r.data),

    listMyDocuments: (params?: { validationStatus?: string; period?: string; limit?: number }) =>
      api
        .get('/client-portal/me/contabil/documents', { params })
        .then((r) => r.data as { items: unknown[]; total: number }),

    sendMessage: (
      payload: { body?: string; quickReplyKey?: string; obligationId?: string },
      file?: File | null,
    ) => {
      if (file) {
        const fd = new FormData()
        if (payload.body) fd.append('body', payload.body)
        if (payload.quickReplyKey) fd.append('quickReplyKey', payload.quickReplyKey)
        if (payload.obligationId) fd.append('obligationId', payload.obligationId)
        fd.append('file', file)
        return api.post('/client-portal/me/contabil/messages', fd).then((r) => r.data)
      }
      return api.post('/client-portal/me/contabil/messages', payload).then((r) => r.data)
    },

    updateMessage: (id: string, payload: { body: string }) =>
      api.patch(`/client-portal/me/contabil/messages/${encodeURIComponent(id)}`, payload).then((r) => r.data),

    listBookingServices: () => api.get('/client-portal/me/contabil/booking/services').then((r) => r.data),

    listBookingSlots: (params: { serviceId: string; from: string; to: string }) =>
      api.get('/client-portal/me/contabil/booking/slots', { params }).then((r) => r.data),

    bookConsultation: (payload: { serviceId: string; scheduledAt: string }) =>
      api.post('/client-portal/me/contabil/booking', payload).then((r) => r.data),

    listMyServiceRequests: () =>
      api
        .get('/client-portal/me/contabil/service-requests')
        .then((r) => r.data as { items: unknown[] }),

    createServiceRequest: (payload: { title: string; description?: string; clientNotes?: string }) =>
      api.post('/client-portal/me/contabil/service-requests', payload).then((r) => r.data),

    getServiceRequestQuote: (id: string) =>
      api
        .get(`/client-portal/me/contabil/service-requests/${encodeURIComponent(id)}/quote`)
        .then(
          (r) =>
            r.data as {
              quote: {
                title: string
                amount: string
                description?: string | null
                status: string
              }
              request: {
                id: string
                title: string
                status: string
                quotedAmountCents?: number | null
                currency?: string
                description?: string | null
                clientNotes?: string | null
              }
            },
        ),

    approveServiceRequest: (id: string) =>
      api
        .post(`/client-portal/me/contabil/service-requests/${encodeURIComponent(id)}/approve`)
        .then((r) => r.data),

    deliverObligation: (id: string) =>
      api.post(`/client-portal/me/contabil/obligations/${encodeURIComponent(id)}/deliver`).then((r) => r.data),
  }
}

export type ClientPortalContabilApi = ReturnType<typeof createClientPortalContabilApi>
