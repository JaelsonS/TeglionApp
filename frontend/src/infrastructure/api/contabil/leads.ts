import type { AxiosInstance } from 'axios'

export type ContabilLead = {
  id: string
  name: string
  email: string | null
  phone: string | null
  taxId: string | null
  source: string
  status: string
}

export function createContabilLeadsApi(api: AxiosInstance) {
  return {
    getById: (id: string) => api.get(`/contabil/leads/${encodeURIComponent(id)}`).then((r) => r.data as { lead: ContabilLead }),
  }
}

export type ContabilLeadsApi = ReturnType<typeof createContabilLeadsApi>
