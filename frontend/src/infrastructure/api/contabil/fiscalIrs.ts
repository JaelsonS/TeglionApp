import type { AxiosInstance } from 'axios'

export type IrsSimulation = {
  calcType: string
  jurisdiction: string
  tax: string
  ruleVersion: string
  input: {
    taxableIncomeCents: number
    filingStatus: 'single' | 'joint'
    includeSolidarity: boolean
    quotient: number
  }
  result: {
    taxCents: number
    solidarityCents: number
    totalCents: number
    effectiveBps: number
    bracketIndex: number
    taxablePerUnitCents: number
    parts: Array<{
      kind: string
      baseCents: number
      rateMilli: number
      taxCents: number
    }>
    solidarityParts: Array<{
      baseCents: number
      rateMilli: number
      taxCents: number
    }>
  }
  disclaimer: string
  source?: { label: string; url?: string; notes?: string }
  limitations?: string[]
}

export function createContabilFiscalIrsApi(api: AxiosInstance) {
  return {
    catalog: () => api.get('/contabil/fiscal/irs/catalog').then((r) => r.data),
    simulate: (payload: Record<string, unknown>) =>
      api.post('/contabil/fiscal/irs/simulate', payload).then((r) => r.data as { simulation: IrsSimulation }),
    save: (payload: Record<string, unknown>) =>
      api.post('/contabil/fiscal/irs/calculations', payload).then((r) => r.data),
    list: (params?: { limit?: number; calcType?: string }) =>
      api
        .get('/contabil/fiscal/calculations', {
          params: { calcType: 'irs_brackets', ...params },
        })
        .then((r) => r.data),
    get: (id: string) =>
      api.get(`/contabil/fiscal/calculations/${encodeURIComponent(id)}`).then((r) => r.data),
  }
}

export type ContabilFiscalIrsApi = ReturnType<typeof createContabilFiscalIrsApi>
