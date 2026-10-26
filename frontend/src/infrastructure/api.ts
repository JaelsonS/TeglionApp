/**
 * Barrel HTTP — cliente axios, auth e APIs de domínio contabil.
 * Implementação: infrastructure/http/ e infrastructure/api/contabil/.
 */
import { api, refreshApi } from '@/infrastructure/http/apiClient'
import {
  prefetchAuthCsrf as prefetchAuthCsrfInternal,
  warmupAuthApi as warmupAuthApiInternal,
} from '@/infrastructure/http/csrf'

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
  getGoogleCalendarConnectUrl,
  normalizeApiBase,
  refreshAccessToken,
  refreshApi,
  toPublicAssetUrl,
} from '@/infrastructure/http/apiClient'
export { clearClientCsrfCache } from '@/infrastructure/http/csrf'

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

export {
  contabilFirmApi,
  contabilClientsApi,
  contabilMessagesApi,
  contabilDocumentsApi,
  contabilObligationsApi,
  contabilConsultationsApi,
  contabilAccountingServicesApi,
  contabilNewsApi,
  contabilNavBadgesApi,
  contabilFiscalCalendarApi,
  contabilBroadcastsApi,
  contabilBillingApi,
  contabilConnectApi,
  contabilPublicApi,
  contabilServiceInquiriesApi,
  contabilInquiryTagsApi,
  contabilGoogleCalendarApi,
  contabilGoogleDriveApi,
  contabilLeadsApi,
  contabilFeeChargesApi,
  contabilRentalsApi,
  contabilSaftApi,
  contabilFiscalVatApi,
  contabilFiscalIrsApi,
  contabilFiscalSsApi,
  contabilFiscalWithholdingApi,
  contabilFiscalImtApi,
  contabilFiscalIrcApi,
  clientPortalContabilApi,
  platformOpsApi,
} from '@/infrastructure/api/contabilApis'

export type { BillingStatus } from '@/infrastructure/api/contabil/billing'
export type { ConnectStatus } from '@/infrastructure/api/contabil/connect'
export { CONNECT_STATUS_QUERY_KEY } from '@/infrastructure/api/contabil/connect'

export default api
