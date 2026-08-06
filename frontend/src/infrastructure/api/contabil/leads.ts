import type { AxiosInstance } from 'axios'

export function createContabilLeadsApi(api: AxiosInstance) {
  return {
    list: (params?: { status?: string }) => api.get('/contabil/leads', { params }).then((r) => r.data),

    getDetail: (id: string) => api.get(`/contabil/leads/${encodeURIComponent(id)}`).then((r) => r.data),

    create: (payload: { name: string; email?: string; phone?: string; taxId?: string }) =>
      api.post('/contabil/leads', payload).then((r) => r.data),

    patch: (id: string, payload: Record<string, unknown>) =>
      api.patch(`/contabil/leads/${encodeURIComponent(id)}`, payload).then((r) => r.data),

    convertToClient: (id: string) =>
      api.post(`/contabil/leads/${encodeURIComponent(id)}/convert-to-client`).then((r) => r.data),
  }
}

export type ContabilLeadsApi = ReturnType<typeof createContabilLeadsApi>
