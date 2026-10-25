import type { AxiosInstance } from 'axios'

export type FeeChargeStatus = 'draft' | 'confirmed' | 'sent' | 'paid' | 'cancelled'

export type FeeCharge = {
  id: string
  firmId?: string
  clientId: string
  yearMonth: string
  amountCents: number
  currency: string
  status: FeeChargeStatus
  paymentMethod?: string | null
  paidAt?: string | null
  dueDate?: string | null
  notes?: string | null
  source?: string
  overdue?: boolean
}

export type ClientBilling = {
  retainerAmountCents: number | null
  retainerCurrency: string
  retainerActive: boolean
  retainerDueDay: number
}

export type FeeChargesMapResponse = {
  year: number
  months: string[]
  statusLabels: Record<string, string>
  paymentMethods: Array<{ id: string; label: string }>
  rows: Array<{
    clientId: string
    displayName: string
    taxId?: string | null
    billing: ClientBilling
    months: Record<string, FeeCharge>
  }>
  summary: {
    paidCents: number
    openCents: number
    overdueCents: number
    draftCents: number
  }
  connect: {
    optional: boolean
    ready: boolean
    configured: boolean
    platformFeePercent: string
    nudge: string | null
  }
}

export function createContabilFeeChargesApi(api: AxiosInstance) {
  return {
    meta: () => api.get('/contabil/fee-charges/meta').then((r) => r.data),
    map: (params?: { year?: number; q?: string }) =>
      api.get('/contabil/fee-charges/map', { params }).then((r) => r.data as FeeChargesMapResponse),
    generate: (payload: { yearMonth: string; clientIds?: string[] }) =>
      api.post('/contabil/fee-charges/generate', payload).then((r) => r.data),
    patch: (id: string, payload: Record<string, unknown>) =>
      api.patch(`/contabil/fee-charges/${encodeURIComponent(id)}`, payload).then((r) => r.data),
    getClientBilling: (clientId: string) =>
      api.get(`/contabil/clients/${encodeURIComponent(clientId)}/billing`).then((r) => r.data),
    patchClientBilling: (clientId: string, payload: Record<string, unknown>) =>
      api
        .patch(`/contabil/clients/${encodeURIComponent(clientId)}/billing`, payload)
        .then((r) => r.data),
  }
}

export type ContabilFeeChargesApi = ReturnType<typeof createContabilFeeChargesApi>
