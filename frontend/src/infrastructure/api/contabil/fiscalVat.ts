import type { AxiosInstance } from 'axios'

export type VatSimulation = {
  calcType: string
  jurisdiction: string
  tax: string
  ruleVersion: string
  rate: { code: string; label: string; percent: number; bps: number }
  input: { direction: string; amountCents: number; rateCode: string }
  result: { netCents: number; vatCents: number; grossCents: number }
  disclaimer: string
  source?: { label: string; url?: string; notes?: string }
  rounding?: { mode: string; description: string }
  limitations?: string[]
}

export function createContabilFiscalVatApi(api: AxiosInstance) {
  return {
    catalog: () => api.get('/contabil/fiscal/vat/catalog').then((r) => r.data),
    simulate: (payload: Record<string, unknown>) =>
      api.post('/contabil/fiscal/vat/simulate', payload).then((r) => r.data as { simulation: VatSimulation }),
    save: (payload: Record<string, unknown>) =>
      api.post('/contabil/fiscal/vat/calculations', payload).then((r) => r.data),
    list: (params?: { limit?: number; calcType?: string }) =>
      api.get('/contabil/fiscal/calculations', { params }).then((r) => r.data),
    get: (id: string) =>
      api.get(`/contabil/fiscal/calculations/${encodeURIComponent(id)}`).then((r) => r.data),
  }
}

export type ContabilFiscalVatApi = ReturnType<typeof createContabilFiscalVatApi>
