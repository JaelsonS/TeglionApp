import type { AxiosInstance } from 'axios'

export type RentReceiptStatus = 'draft' | 'issued' | 'paid' | 'cancelled'

export type RentReceipt = {
  id: string
  firmId?: string
  leaseId: string
  yearMonth: string
  amountCents: number
  currency: string
  status: RentReceiptStatus
  paymentMethod?: string | null
  paidAt?: string | null
  dueDate?: string | null
  notes?: string | null
  source?: string
  overdue?: boolean
}

export type PropertyLease = {
  id: string
  propertyId: string
  tenantDisplayName: string
  tenantNif?: string | null
  tenantEmail?: string | null
  tenantPhone?: string | null
  startDate: string
  endDate?: string | null
  monthlyRentCents: number
  currency: string
  rentDueDay: number
  leaseType: string
  status: string
  notes?: string | null
  months?: Record<string, RentReceipt>
}

export type ClientProperty = {
  id: string
  clientId?: string | null
  label: string
  addressLine?: string | null
  postalCode?: string | null
  locality?: string | null
  artigoMatricial?: string | null
  notes?: string | null
  costCategory?: string
  supplierName?: string | null
  status: string
}

export type RentalsOverviewResponse = {
  year: number
  months: string[]
  statusLabels: Record<string, string>
  paymentMethods: Array<{ id: string; label: string }>
  disclaimer: string
  rows: Array<{
    property: ClientProperty
    client: { id: string; displayName: string; taxId?: string | null }
    leases: PropertyLease[]
  }>
  summary: {
    paidCents: number
    openCents: number
    overdueCents: number
    draftCents: number
  }
}

export function createContabilRentalsApi(api: AxiosInstance) {
  return {
    meta: () => api.get('/contabil/rentals/meta').then((r) => r.data),
    overview: (params?: { year?: number; q?: string }) =>
      api.get('/contabil/rentals/overview', { params }).then((r) => r.data as RentalsOverviewResponse),
    createProperty: (payload: Record<string, unknown>) =>
      api.post('/contabil/rentals/properties', payload).then((r) => r.data),
    patchProperty: (id: string, payload: Record<string, unknown>) =>
      api.patch(`/contabil/rentals/properties/${encodeURIComponent(id)}`, payload).then((r) => r.data),
    createLease: (propertyId: string, payload: Record<string, unknown>) =>
      api
        .post(`/contabil/rentals/properties/${encodeURIComponent(propertyId)}/leases`, payload)
        .then((r) => r.data),
    patchLease: (id: string, payload: Record<string, unknown>) =>
      api.patch(`/contabil/rentals/leases/${encodeURIComponent(id)}`, payload).then((r) => r.data),
    generateReceipts: (payload: { yearMonth: string; leaseIds?: string[] }) =>
      api.post('/contabil/rentals/receipts/generate', payload).then((r) => r.data),
    createReceipt: (payload: {
      leaseId: string
      yearMonth: string
      amountCents?: number
      status?: RentReceiptStatus
      dueDate?: string
    }) =>
      api
        .post('/contabil/rentals/receipts', payload)
        .then((r) => r.data as { receipt: RentReceipt; created: boolean }),
    patchReceipt: (id: string, payload: Record<string, unknown>) =>
      api.patch(`/contabil/rentals/receipts/${encodeURIComponent(id)}`, payload).then((r) => r.data),
  }
}

export type ContabilRentalsApi = ReturnType<typeof createContabilRentalsApi>
