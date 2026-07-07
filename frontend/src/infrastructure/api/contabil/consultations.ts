import type { AxiosInstance } from 'axios'

export function createContabilConsultationsApi(api: AxiosInstance) {
  return {
    list: (params?: Record<string, string | number | undefined>) =>
      api.get('/contabil/consultations', { params }).then((r) => r.data),

    create: (payload: Record<string, unknown>) =>
      api.post('/contabil/consultations', payload).then((r) => r.data),

    update: (id: string, payload: Record<string, unknown>) =>
      api.patch(`/contabil/consultations/${encodeURIComponent(id)}`, payload).then((r) => r.data),

    getBookingSettings: () => api.get('/contabil/booking-settings').then((r) => r.data),

    patchBookingSettings: (payload: Record<string, unknown>) =>
      api.patch('/contabil/booking-settings', payload).then((r) => r.data),
  }
}

export type ContabilConsultationsApi = ReturnType<typeof createContabilConsultationsApi>
