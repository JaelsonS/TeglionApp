import type { AxiosInstance } from 'axios'
import type { ConsultingCatalogEntry } from '@/shared/types/contabil'

export function createContabilAccountingServicesApi(api: AxiosInstance) {
  return {
    list: (params?: { activeOnly?: boolean }) =>
      api.get('/contabil/accounting-services', { params }).then((r) => r.data),

    getCatalogTemplate: () =>
      api
        .get('/contabil/accounting-services/catalog-template')
        .then((r) => r.data as { items: ConsultingCatalogEntry[] }),

    activateCatalog: (catalogKeys: string[]) =>
      api.post('/contabil/accounting-services/activate-catalog', { catalogKeys }).then((r) => r.data),

    create: (payload: Record<string, unknown>) =>
      api.post('/contabil/accounting-services', payload).then((r) => r.data),

    patch: (id: string, payload: Record<string, unknown>) =>
      api.patch(`/contabil/accounting-services/${encodeURIComponent(id)}`, payload).then((r) => r.data),

    duplicate: (id: string) =>
      api.post(`/contabil/accounting-services/${encodeURIComponent(id)}/duplicate`).then((r) => r.data),

    remove: (id: string) =>
      api.delete(`/contabil/accounting-services/${encodeURIComponent(id)}`).then((r) => r.data),

    bulkPatch: (payload: { ids: string[]; patch: Record<string, unknown> }) =>
      api.post('/contabil/accounting-services/bulk', payload).then((r) => r.data),
  }
}

export type ContabilAccountingServicesApi = ReturnType<typeof createContabilAccountingServicesApi>
