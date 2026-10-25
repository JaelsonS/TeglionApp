import type { AxiosInstance } from 'axios'

export type WithholdingSimulation = {
  calcType: string
  jurisdiction: string
  tax: string
  ruleVersion: string
  table: { code: string; label: string }
  input: {
    tableCode: string
    remunerationCents: number
    dependents: number
  }
  result: {
    withholdingCents: number
    netCents: number
    rateMilli: number
    parcelaCents: number
    additionalCents: number
    bracketIndex: number
    effectiveBps: number
    familyRateReduced: boolean
  }
  disclaimer: string
  source?: { label: string; url?: string; notes?: string }
  limitations?: string[]
}

export function createContabilFiscalWithholdingApi(api: AxiosInstance) {
  return {
    catalog: () => api.get('/contabil/fiscal/withholding/catalog').then((r) => r.data),
    simulate: (payload: Record<string, unknown>) =>
      api
        .post('/contabil/fiscal/withholding/simulate', payload)
        .then((r) => r.data as { simulation: WithholdingSimulation }),
    save: (payload: Record<string, unknown>) =>
      api.post('/contabil/fiscal/withholding/calculations', payload).then((r) => r.data),
    list: (params?: { limit?: number }) =>
      api
        .get('/contabil/fiscal/calculations', {
          params: { calcType: 'irs_withholding', ...params },
        })
        .then((r) => r.data),
  }
}

export type ContabilFiscalWithholdingApi = ReturnType<typeof createContabilFiscalWithholdingApi>
