import type { AxiosInstance } from 'axios'

export type SsSimulation = {
  calcType: string
  jurisdiction: string
  tax: string
  ruleVersion: string
  regime: {
    code: string
    label: string
    kind: string
    workerPercent: number
    employerPercent: number
    totalPercent: number
  }
  input: {
    regimeCode: string
    baseCents: number
    servicesCents: number | null
    derivedFrom: string
    relevantIncomePct: number | null
  }
  result: {
    baseCents: number
    relevantIncomeCents: number | null
    workerCents: number
    employerCents: number
    totalCents: number
  }
  disclaimer: string
  source?: { label: string; url?: string; notes?: string }
  limitations?: string[]
}

export function createContabilFiscalSsApi(api: AxiosInstance) {
  return {
    catalog: () => api.get('/contabil/fiscal/ss/catalog').then((r) => r.data),
    simulate: (payload: Record<string, unknown>) =>
      api.post('/contabil/fiscal/ss/simulate', payload).then((r) => r.data as { simulation: SsSimulation }),
    save: (payload: Record<string, unknown>) =>
      api.post('/contabil/fiscal/ss/calculations', payload).then((r) => r.data),
    list: (params?: { limit?: number }) =>
      api
        .get('/contabil/fiscal/calculations', {
          params: { calcType: 'ss_contributions', ...params },
        })
        .then((r) => r.data),
  }
}

export type ContabilFiscalSsApi = ReturnType<typeof createContabilFiscalSsApi>
