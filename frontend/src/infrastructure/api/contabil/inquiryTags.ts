import type { AxiosInstance } from 'axios'

export type FirmInquiryTag = {
  id: string
  name: string
  colorHex: string
  createdAt?: string
  updatedAt?: string
}

export function createContabilInquiryTagsApi(api: AxiosInstance) {
  return {
    list: () => api.get('/contabil/inquiry-tags').then((r) => r.data as { items: FirmInquiryTag[] }),

    create: (payload: { name: string; colorHex?: string }) =>
      api.post('/contabil/inquiry-tags', payload).then((r) => r.data as { tag: FirmInquiryTag }),

    patch: (id: string, payload: { name?: string; colorHex?: string }) =>
      api
        .patch(`/contabil/inquiry-tags/${encodeURIComponent(id)}`, payload)
        .then((r) => r.data as { tag: FirmInquiryTag }),

    remove: (id: string) =>
      api.delete(`/contabil/inquiry-tags/${encodeURIComponent(id)}`).then((r) => r.data as { ok: boolean }),
  }
}

export type ContabilInquiryTagsApi = ReturnType<typeof createContabilInquiryTagsApi>
