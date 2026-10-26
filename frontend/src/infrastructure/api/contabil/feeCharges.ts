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
  retainerStartMonth?: string | null
  retainerEndMonth?: string | null
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
    generate: (payload: {
      yearMonth?: string
      fromYearMonth?: string
      toYearMonth?: string
      clientIds?: string[]
    }) => api.post('/contabil/fee-charges/generate', payload).then((r) => r.data),
    replicate: (payload: {
      clientId: string
      fromYearMonth: string
      toYearMonth: string
      amountCents: number
      status?: FeeChargeStatus
      paymentMethod?: string | null
      overwriteDrafts?: boolean
    }) => api.post('/contabil/fee-charges/replicate', payload).then((r) => r.data),
    create: (payload: {
      clientId: string
      yearMonth: string
      amountCents?: number
      status?: FeeChargeStatus
      dueDate?: string
    }) => api.post('/contabil/fee-charges', payload).then((r) => r.data as { charge: FeeCharge; created: boolean }),
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
