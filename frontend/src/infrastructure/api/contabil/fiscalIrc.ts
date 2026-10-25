import type { AxiosInstance } from 'axios'

export type IrcSimulation = {
  calcType: string
  jurisdiction: string
  tax: string
  ruleVersion: string
  regime: { code: string; label: string }
  input: {
    regimeCode: string
    taxableCents: number
    profitCents: number
    includeStateSurcharge: boolean
    municipalDerramaBps: number
  }
  result: {
    ircCents: number
    stateSurchargeCents: number
    municipalSurchargeCents: number
    totalCents: number
    effectiveBps: number
    ircParts: Array<{ baseCents: number; rateMilli: number; taxCents: number }>
  }
  disclaimer: string
  source?: { label: string; url?: string; notes?: string }
  limitations?: string[]
}

export function createContabilFiscalIrcApi(api: AxiosInstance) {
  return {
    catalog: () => api.get('/contabil/fiscal/irc/catalog').then((r) => r.data),
    simulate: (payload: Record<string, unknown>) =>
      api.post('/contabil/fiscal/irc/simulate', payload).then((r) => r.data as { simulation: IrcSimulation }),
    save: (payload: Record<string, unknown>) =>
      api.post('/contabil/fiscal/irc/calculations', payload).then((r) => r.data),
    list: (params?: { limit?: number }) =>
      api
        .get('/contabil/fiscal/calculations', { params: { calcType: 'irc', ...params } })
        .then((r) => r.data),
    get: (id: string) =>
      api.get(`/contabil/fiscal/calculations/${encodeURIComponent(id)}`).then((r) => r.data),
  }
}

export type ContabilFiscalIrcApi = ReturnType<typeof createContabilFiscalIrcApi>
