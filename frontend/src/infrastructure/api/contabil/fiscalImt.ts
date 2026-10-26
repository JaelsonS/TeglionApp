import type { AxiosInstance } from 'axios'

export type ImtSimulation = {
  calcType: string
  jurisdiction: string
  tax: string
  ruleVersion: string
  regime: { kind: string; code: string; label: string }
  input: {
    tableCode: string | null
    flatRateCode: string | null
    taxableValueCents: number
  }
  result: {
    imtCents: number
    rateMilli: number
    parcelaCents: number
    flat: boolean
    bracketIndex: number
    effectiveBps: number
  }
  disclaimer: string
  source?: { label: string; url?: string; notes?: string }
  limitations?: string[]
}

export function createContabilFiscalImtApi(api: AxiosInstance) {
  return {
    catalog: () => api.get('/contabil/fiscal/imt/catalog').then((r) => r.data),
    simulate: (payload: Record<string, unknown>) =>
      api.post('/contabil/fiscal/imt/simulate', payload).then((r) => r.data as { simulation: ImtSimulation }),
    save: (payload: Record<string, unknown>) =>
      api.post('/contabil/fiscal/imt/calculations', payload).then((r) => r.data),
    list: (params?: { limit?: number }) =>
      api
        .get('/contabil/fiscal/calculations', { params: { calcType: 'imt', ...params } })
        .then((r) => r.data),
    get: (id: string) =>
      api.get(`/contabil/fiscal/calculations/${encodeURIComponent(id)}`).then((r) => r.data),
  }
}

export type ContabilFiscalImtApi = ReturnType<typeof createContabilFiscalImtApi>
