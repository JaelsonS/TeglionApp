import type { AxiosInstance } from 'axios'

export function createContabilNewsApi(api: AxiosInstance) {
  return {
    list: (params?: { status?: string }) => api.get('/contabil/news', { params }).then((r) => r.data),

    getTemplates: () => api.get('/contabil/news/templates').then((r) => r.data),

    uploadCover: (file: File) => {
      const fd = new FormData()
      fd.append('cover', file)
      return api
        .post('/contabil/news/cover', fd)
        .then((r) => r.data as { storageKey: string; previewUrl: string })
    },

    create: (payload: Record<string, unknown>) => api.post('/contabil/news', payload).then((r) => r.data),

    update: (id: string, payload: Record<string, unknown>) =>
      api.patch(`/contabil/news/${encodeURIComponent(id)}`, payload).then((r) => r.data),

    remove: (id: string) => api.delete(`/contabil/news/${encodeURIComponent(id)}`).then((r) => r.data),
  }
}

export type ContabilNewsApi = ReturnType<typeof createContabilNewsApi>
