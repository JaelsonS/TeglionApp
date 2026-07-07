import type { AxiosInstance } from 'axios'

function appendObligationPayload(fd: FormData, payload: Record<string, unknown>) {
  const required = new Set(['clientId', 'type', 'period', 'dueDate', 'title'])
  for (const [key, value] of Object.entries(payload)) {
    if (value === undefined || value === null) continue
    if (!required.has(key) && value === '') continue
    fd.append(key, String(value))
  }
}

export function createContabilObligationsApi(api: AxiosInstance) {
  return {
    list: (params?: Record<string, string | number | undefined>) =>
      api.get('/contabil/obligations', { params }).then((r) => r.data),

    excludeFromMonth: (obligationId: string, month?: string) =>
      api
        .post(`/contabil/obligations/${encodeURIComponent(obligationId)}/month-exclusion`, { month })
        .then((r) => r.data),

    restoreForMonth: (obligationId: string, month: string) =>
      api
        .delete(`/contabil/obligations/${encodeURIComponent(obligationId)}/month-exclusion`, {
          params: { month },
        })
        .then((r) => r.data),

    getOperationalDashboard: () =>
      api.get('/contabil/obligations/operational-dashboard').then((r) => r.data),

    listTemplates: () => api.get('/contabil/obligation-templates').then((r) => r.data),

    createFromTemplate: (payload: Record<string, unknown>) =>
      api.post('/contabil/obligations/from-template', payload).then((r) => r.data),

    createRecurrenceRule: (payload: Record<string, unknown>) =>
      api.post('/contabil/obligation-recurrence-rules', payload).then((r) => r.data),

    create: (payload: Record<string, unknown>, file?: File | null) => {
      if (file) {
        const fd = new FormData()
        appendObligationPayload(fd, payload)
        fd.append('file', file)
        return api.post('/contabil/obligations', fd).then((r) => r.data)
      }
      return api.post('/contabil/obligations', payload).then((r) => r.data)
    },

    update: (id: string, payload: Record<string, unknown>) =>
      api.patch(`/contabil/obligations/${encodeURIComponent(id)}`, payload).then((r) => r.data),

    getViews: (id: string) =>
      api.get(`/contabil/obligations/${encodeURIComponent(id)}/views`).then((r) => r.data),

    uploadGuide: (id: string, formData: FormData) =>
      api.post(`/contabil/obligations/${encodeURIComponent(id)}/upload-guide`, formData).then((r) => r.data),

    getTimeline: (id: string) =>
      api.get(`/contabil/obligations/${encodeURIComponent(id)}/timeline`).then((r) => r.data),
  }
}

export type ContabilObligationsApi = ReturnType<typeof createContabilObligationsApi>
