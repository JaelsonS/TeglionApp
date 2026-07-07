import type { AxiosInstance } from 'axios'

export function createContabilDocumentsApi(api: AxiosInstance) {
  return {
    list: (params?: Record<string, string | number | undefined>) =>
      api.get('/contabil/documents', { params }).then((r) => r.data),

    validate: (id: string, validationStatus: 'APPROVED' | 'REJECTED' | 'PENDING') =>
      api.patch(`/contabil/documents/${encodeURIComponent(id)}/validate`, { validationStatus }).then((r) => r.data),

    getDetail: (id: string) =>
      api.get(`/contabil/documents/${encodeURIComponent(id)}/detail`).then((r) => r.data),

    requestResend: (id: string, payload?: { message?: string }) =>
      api
        .post(`/contabil/documents/${encodeURIComponent(id)}/request-resend`, payload || {})
        .then((r) => r.data),

    remove: (id: string) => api.delete(`/contabil/documents/${encodeURIComponent(id)}`).then((r) => r.data),

    getViews: (id: string) => api.get(`/contabil/documents/${encodeURIComponent(id)}/views`).then((r) => r.data),

    getInbox: (params?: { clientId?: string; status?: string }) =>
      api
        .get('/contabil/inbox', {
          params: {
            ...(params?.clientId ? { clientId: params.clientId } : {}),
            ...(params?.status ? { status: params.status } : {}),
          },
        })
        .then((r) => r.data),
  }
}

export type ContabilDocumentsApi = ReturnType<typeof createContabilDocumentsApi>
