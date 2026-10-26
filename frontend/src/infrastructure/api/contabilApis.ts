/**
 * Instâncias das APIs contabil ligadas ao cliente HTTP partilhado.
 * Mantém o barrel `infrastructure/api.ts` abaixo do limite de linhas do CI.
 */
import { createContabilAccountingServicesApi } from '@/infrastructure/api/contabil/accountingServices'
import { createContabilBillingApi } from '@/infrastructure/api/contabil/billing'
import { createContabilConnectApi } from '@/infrastructure/api/contabil/connect'
import { createContabilBroadcastsApi } from '@/infrastructure/api/contabil/broadcastsApi'
import { createClientPortalContabilApi } from '@/infrastructure/api/contabil/clientPortal'
import { createContabilClientsApi } from '@/infrastructure/api/contabil/clients'
import { createContabilConsultationsApi } from '@/infrastructure/api/contabil/consultations'
import { createContabilDocumentsApi } from '@/infrastructure/api/contabil/documents'
import { createContabilFirmApi } from '@/infrastructure/api/contabil/firm'
import { createContabilFiscalCalendarApi } from '@/infrastructure/api/contabil/fiscalCalendar'
import { createContabilGoogleCalendarApi } from '@/infrastructure/api/contabil/googleCalendar'
import { createContabilGoogleDriveApi } from '@/infrastructure/api/contabil/googleDrive'
import { createContabilLeadsApi } from '@/infrastructure/api/contabil/leads'
import { createContabilFeeChargesApi } from '@/infrastructure/api/contabil/feeCharges'
import { createContabilRentalsApi } from '@/infrastructure/api/contabil/rentals'
import { createContabilSaftApi } from '@/infrastructure/api/contabil/saft'
import { createContabilFiscalVatApi } from '@/infrastructure/api/contabil/fiscalVat'
import { createContabilFiscalIrsApi } from '@/infrastructure/api/contabil/fiscalIrs'
import { createContabilFiscalSsApi } from '@/infrastructure/api/contabil/fiscalSs'
import { createContabilFiscalWithholdingApi } from '@/infrastructure/api/contabil/fiscalWithholding'
import { createContabilFiscalImtApi } from '@/infrastructure/api/contabil/fiscalImt'
import { createContabilFiscalIrcApi } from '@/infrastructure/api/contabil/fiscalIrc'
import { createContabilMessagesApi } from '@/infrastructure/api/contabil/messages'
import { createContabilNewsApi } from '@/infrastructure/api/contabil/news'
import { createContabilNavBadgesApi } from '@/infrastructure/api/contabil/navBadges'
import { createContabilObligationsApi } from '@/infrastructure/api/contabil/obligations'
import { createContabilPublicApi } from '@/infrastructure/api/contabil/public'
import { createContabilServiceInquiriesApi } from '@/infrastructure/api/contabil/serviceInquiries'
import { createContabilInquiryTagsApi } from '@/infrastructure/api/contabil/inquiryTags'
import { api } from '@/infrastructure/http/apiClient'

export const contabilFirmApi = createContabilFirmApi(api)
export const contabilClientsApi = createContabilClientsApi(api)
export const contabilMessagesApi = createContabilMessagesApi(api)
export const contabilDocumentsApi = createContabilDocumentsApi(api)
export const contabilObligationsApi = createContabilObligationsApi(api)
export const contabilConsultationsApi = createContabilConsultationsApi(api)
export const contabilAccountingServicesApi = createContabilAccountingServicesApi(api)
export const contabilNewsApi = createContabilNewsApi(api)
export const contabilNavBadgesApi = createContabilNavBadgesApi(api)
export const contabilFiscalCalendarApi = createContabilFiscalCalendarApi(api)
export const contabilBroadcastsApi = createContabilBroadcastsApi(api)
export const contabilBillingApi = createContabilBillingApi(api)
export const contabilConnectApi = createContabilConnectApi(api)
export const contabilPublicApi = createContabilPublicApi(api)
export const contabilServiceInquiriesApi = createContabilServiceInquiriesApi(api)
export const contabilInquiryTagsApi = createContabilInquiryTagsApi(api)
export const contabilGoogleCalendarApi = createContabilGoogleCalendarApi(api)
export const contabilGoogleDriveApi = createContabilGoogleDriveApi(api)
export const contabilLeadsApi = createContabilLeadsApi(api)
export const contabilFeeChargesApi = createContabilFeeChargesApi(api)
export const contabilRentalsApi = createContabilRentalsApi(api)
export const contabilSaftApi = createContabilSaftApi(api)
export const contabilFiscalVatApi = createContabilFiscalVatApi(api)
export const contabilFiscalIrsApi = createContabilFiscalIrsApi(api)
export const contabilFiscalSsApi = createContabilFiscalSsApi(api)
export const contabilFiscalWithholdingApi = createContabilFiscalWithholdingApi(api)
export const contabilFiscalImtApi = createContabilFiscalImtApi(api)
export const contabilFiscalIrcApi = createContabilFiscalIrcApi(api)
export const clientPortalContabilApi = createClientPortalContabilApi(api)
