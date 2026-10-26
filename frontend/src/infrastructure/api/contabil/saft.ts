import type { AxiosInstance } from 'axios'

export type SaftImportSummary = {
  customers?: number
  suppliers?: number
  products?: number
  taxTableEntries?: number
  journals?: number
  salesInvoices?: {
    declaredEntries?: number | null
    invoiceCount?: number
    totalDebitCents?: number | null
    totalCreditCents?: number | null
    totalDebit?: number | null
    totalCredit?: number | null
  }
  purchaseInvoices?: {
    declaredEntries?: number | null
    invoiceCount?: number
  }
  payments?: number
  stockMovements?: number
  workDocuments?: number
  structuralChecks?: Record<string, boolean>
  zipEntryName?: string | null
  disclaimer?: string
}

export type SaftImport = {
  id: string
  firmId?: string
  clientId?: string | null
  originalFilename: string
  contentSha256: string
  fileBytes: number
  sourceKind: 'xml' | 'zip'
  auditFileVersion?: string | null
  companyId?: string | null
  taxRegistrationNumber?: string | null
  companyName?: string | null
  fiscalYear?: number | null
  startDate?: string | null
  endDate?: string | null
  currencyCode?: string | null
  productId?: string | null
  productVersion?: string | null
  summary: SaftImportSummary
  validationStatus: 'ok' | 'warning' | 'invalid'
  validationNotes: string[]
  createdAt?: string
}

export function createContabilSaftApi(api: AxiosInstance) {
  return {
    meta: () => api.get('/contabil/saft/meta').then((r) => r.data),
    list: (params?: { clientId?: string; limit?: number }) =>
      api.get('/contabil/saft/imports', { params }).then((r) => r.data as { items: SaftImport[]; disclaimer: string }),
    get: (id: string) =>
      api.get(`/contabil/saft/imports/${encodeURIComponent(id)}`).then((r) => r.data as { item: SaftImport; disclaimer: string }),
    importFile: (file: File, clientId?: string) => {
      const form = new FormData()
      form.append('file', file)
      if (clientId) form.append('clientId', clientId)
      return api
        .post('/contabil/saft/imports', form, {
          headers: { 'Content-Type': 'multipart/form-data' },
        })
        .then((r) => r.data as { item: SaftImport; duplicate: boolean; disclaimer: string })
    },
    remove: (id: string) =>
      api.delete(`/contabil/saft/imports/${encodeURIComponent(id)}`).then((r) => r.data),
  }
}

export type ContabilSaftApi = ReturnType<typeof createContabilSaftApi>
