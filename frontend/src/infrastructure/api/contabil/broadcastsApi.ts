import type { AxiosInstance } from 'axios'

export function createContabilBroadcastsApi(api: AxiosInstance) {
  return {
    getMeta: () => api.get('/contabil/broadcasts/meta').then((r) => r.data),

    list: (params?: Record<string, string | number | undefined>) =>
      api.get('/contabil/broadcasts', { params }).then((r) => r.data),

    create: (payload: Record<string, unknown>) =>
      api.post('/contabil/broadcasts', payload).then((r) => r.data),

    update: (id: string, payload: Record<string, unknown>) =>
      api.patch(`/contabil/broadcasts/${encodeURIComponent(id)}`, payload).then((r) => r.data),

    remove: (id: string) => api.delete(`/contabil/broadcasts/${encodeURIComponent(id)}`).then((r) => r.data),

    getAnalytics: (id: string) =>
      api.get(`/contabil/broadcasts/${encodeURIComponent(id)}/analytics`).then((r) => r.data),
  }
}

export type ContabilBroadcastsApi = ReturnType<typeof createContabilBroadcastsApi>
