import type { AxiosInstance } from 'axios'

export type ServiceInquiryListItem = {
  id: string
  serviceId: string
  serviceName: string | null
  leadId: string | null
  clientId: string | null
  requesterName: string | null
  status: string
  notes: string | null
  answers: Record<string, string | string[]> | null
  submittedAt: string | null
  createdAt: string
}

export type ServiceInquiryChecklistItem = {
  tag: string
  title: string
  instructions?: string | null
  received: boolean
  documentId: string | null
  mimeType: string | null
  createdAt: string | null
}

export function createContabilServiceInquiriesApi(api: AxiosInstance) {
  return {
    list: (params?: { status?: string; serviceId?: string }) =>
      api
        .get('/contabil/service-inquiries', { params })
        .then((r) => r.data as { items: ServiceInquiryListItem[] }),

    getById: (id: string) =>
      api
        .get(`/contabil/service-inquiries/${encodeURIComponent(id)}`)
        .then((r) => r.data as { inquiry: ServiceInquiryListItem; checklist: ServiceInquiryChecklistItem[] }),

    patch: (id: string, payload: Record<string, unknown>) =>
      api.patch(`/contabil/service-inquiries/${encodeURIComponent(id)}`, payload).then((r) => r.data),

    getDocumentDownloadUrl: (id: string, documentId: string) =>
      api
        .get(`/contabil/service-inquiries/${encodeURIComponent(id)}/documents/${encodeURIComponent(documentId)}/download`)
        .then((r) => r.data as { url: string; title: string; mimeType: string | null }),
  }
}

export type ContabilServiceInquiriesApi = ReturnType<typeof createContabilServiceInquiriesApi>
