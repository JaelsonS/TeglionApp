import type { AxiosInstance } from 'axios'

export type FirmNavBadgesResponse = {
  messages: number
  serviceInquiries: number
  consultations: number
  documents: number
  tasks: number
  obligations: number
}

export function createContabilNavBadgesApi(api: AxiosInstance) {
  return {
    get: () => api.get('/contabil/nav-badges').then((r) => r.data as FirmNavBadgesResponse),
  }
}
