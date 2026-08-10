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
  accessTokenExpiresAt?: string | null
  accessTokenRevokedAt?: string | null
  createdAt: string
}

export type ServiceInquiryRequestKind = 'document' | 'question'

export type ServiceInquiryChecklistItem = {
  id: string
  kind: ServiceInquiryRequestKind
  tag: string | null
  title: string
  instructions?: string | null
  received: boolean
  documentId: string | null
  textReply: string | null
  createdAt: string | null
  answeredAt: string | null
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

    revokeToken: (id: string) =>
      api.post(`/contabil/service-inquiries/${encodeURIComponent(id)}/revoke-token`).then((r) => r.data),

    addRequest: (id: string, payload: { kind: ServiceInquiryRequestKind; title: string; instructions?: string }) =>
      api
        .post(`/contabil/service-inquiries/${encodeURIComponent(id)}/requests`, payload)
        .then((r) => r.data as { request: ServiceInquiryChecklistItem }),
  }
}

export type ContabilServiceInquiriesApi = ReturnType<typeof createContabilServiceInquiriesApi>
