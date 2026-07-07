/**
 * Barrel HTTP — cliente axios, auth e APIs de domínio contabil.
 * Implementação: infrastructure/http/ e infrastructure/api/contabil/.
 */
import { createContabilAccountingServicesApi } from '@/infrastructure/api/contabil/accountingServices'
import { createContabilBillingApi, type BillingStatus } from '@/infrastructure/api/contabil/billing'
import { createContabilBroadcastsApi } from '@/infrastructure/api/contabil/broadcastsApi'
import { createClientPortalContabilApi } from '@/infrastructure/api/contabil/clientPortal'
import { createContabilClientsApi } from '@/infrastructure/api/contabil/clients'
import { createContabilConsultationsApi } from '@/infrastructure/api/contabil/consultations'
import { createContabilDocumentsApi } from '@/infrastructure/api/contabil/documents'
import { createContabilFirmApi } from '@/infrastructure/api/contabil/firm'
import { createContabilMessagesApi } from '@/infrastructure/api/contabil/messages'
import { createContabilNewsApi } from '@/infrastructure/api/contabil/news'
import { createContabilObligationsApi } from '@/infrastructure/api/contabil/obligations'
import { createContabilPublicApi } from '@/infrastructure/api/contabil/public'

import { api, refreshApi } from '@/infrastructure/http/apiClient'
import { prefetchAuthCsrf as prefetchAuthCsrfInternal, warmupAuthApi as warmupAuthApiInternal } from '@/infrastructure/http/csrf'

export { authApi } from '@/infrastructure/authApi'
export { consentsApi } from '@/infrastructure/consentsApi'
export {
  api,
  API_BASE_URL,
  getApiBaseUrl,
  getApiBaseUrlCandidates,
  getApiBaseUrlResolved,
  getApiUploadsRoot,
  getGoogleAuthStartUrl,
  normalizeApiBase,
  refreshAccessToken,
  refreshApi,
  toPublicAssetUrl,
} from '@/infrastructure/http/apiClient'
export {
  clearClientCsrfCache,
} from '@/infrastructure/http/csrf'

export async function prefetchAuthCsrf(): Promise<void> {
  await prefetchAuthCsrfInternal(refreshApi)
}

export async function warmupAuthApi(): Promise<void> {
  await warmupAuthApiInternal(refreshApi)
}
export {
  documentPreviewUrl,
  fetchDocumentBlobUrl,
  fetchDocumentPreviewUrl,
  getPublicAssetPdfObjectUrl,
  openDocumentBlob,
  openPublicAssetPdf,
  openPublicAssetPdfPreview,
  resolveDocumentDownloadUrl,
  resolveDocumentPreviewPath,
} from '@/infrastructure/http/documentAssets'

export const contabilFirmApi = createContabilFirmApi(api)
export const contabilClientsApi = createContabilClientsApi(api)
export const contabilMessagesApi = createContabilMessagesApi(api)
export const contabilDocumentsApi = createContabilDocumentsApi(api)
export const contabilObligationsApi = createContabilObligationsApi(api)
export const contabilConsultationsApi = createContabilConsultationsApi(api)
export const contabilAccountingServicesApi = createContabilAccountingServicesApi(api)
export const contabilNewsApi = createContabilNewsApi(api)
export const contabilBroadcastsApi = createContabilBroadcastsApi(api)
export const contabilBillingApi = createContabilBillingApi(api)
export const contabilPublicApi = createContabilPublicApi(api)
export const clientPortalContabilApi = createClientPortalContabilApi(api)

export type { BillingStatus }

export default api
