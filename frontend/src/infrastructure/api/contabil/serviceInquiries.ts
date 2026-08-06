import type { AxiosInstance } from 'axios'

export function createContabilServiceInquiriesApi(api: AxiosInstance) {
  return {
    list: (params?: { status?: string; serviceId?: string }) =>
      api.get('/contabil/service-inquiries', { params }).then((r) => r.data),

    getDetail: (id: string) => api.get(`/contabil/service-inquiries/${encodeURIComponent(id)}`).then((r) => r.data),

    create: (payload: { serviceId: string; leadId?: string; clientId?: string; notes?: string }) =>
      api.post('/contabil/service-inquiries', payload).then((r) => r.data),

    patch: (id: string, payload: Record<string, unknown>) =>
      api.patch(`/contabil/service-inquiries/${encodeURIComponent(id)}`, payload).then((r) => r.data),
  }
}

export type ContabilServiceInquiriesApi = ReturnType<typeof createContabilServiceInquiriesApi>
