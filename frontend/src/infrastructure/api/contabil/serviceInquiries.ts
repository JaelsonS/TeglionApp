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
  /** Consulta agendada (Fase 3a) — só devolvida por getById(), null se não houver booking. */
  consultation?: { id: string; scheduledAt: string; status: string } | null
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

/** Evento de histórico (Fase 4) — reaproveita audit_logs, já escrito em todo o
 * ciclo de vida da solicitação, sem duplicar em nenhuma tabela nova. */
export type ServiceInquiryHistoryItem = {
  id: string
  action: string
  actorRole: string
  metadata: Record<string, unknown>
  createdAt: string
}

/** Documento condicional com timing "manual" — activado pelas respostas do
 * cliente, mas ainda não pedido porque a contabilista escolheu "só sugerir
 * depois" ao configurar o formulário. Ver DocumentTiming em shared/types. */
export type ServiceInquirySuggestedDocument = {
  tag: string
  title: string
  instructions?: string | null
}

export function createContabilServiceInquiriesApi(api: AxiosInstance) {
  return {
    list: (params?: { status?: string; serviceId?: string }) =>
      api
        .get('/contabil/service-inquiries', { params })
        .then((r) => r.data as { items: ServiceInquiryListItem[] }),

    getById: (id: string) =>
      api.get(`/contabil/service-inquiries/${encodeURIComponent(id)}`).then(
        (r) =>
          r.data as {
            inquiry: ServiceInquiryListItem
            checklist: ServiceInquiryChecklistItem[]
            suggestedDocuments: ServiceInquirySuggestedDocument[]
            history: ServiceInquiryHistoryItem[]
          },
      ),

    patch: (id: string, payload: Record<string, unknown>) =>
      api.patch(`/contabil/service-inquiries/${encodeURIComponent(id)}`, payload).then((r) => r.data),

    getDocumentDownloadUrl: (id: string, documentId: string) =>
      api
        .get(`/contabil/service-inquiries/${encodeURIComponent(id)}/documents/${encodeURIComponent(documentId)}/download`)
        .then((r) => r.data as { url: string; title: string; mimeType: string | null }),

    revokeToken: (id: string) =>
      api.post(`/contabil/service-inquiries/${encodeURIComponent(id)}/revoke-token`).then((r) => r.data),

    remove: (id: string) =>
      api.delete(`/contabil/service-inquiries/${encodeURIComponent(id)}`).then((r) => r.data),

    addRequest: (
      id: string,
      payload: { kind: ServiceInquiryRequestKind; title: string; instructions?: string; tag?: string },
    ) =>
      api
        .post(`/contabil/service-inquiries/${encodeURIComponent(id)}/requests`, payload)
        .then((r) => r.data as { request: ServiceInquiryChecklistItem }),
  }
}

export type ContabilServiceInquiriesApi = ReturnType<typeof createContabilServiceInquiriesApi>
