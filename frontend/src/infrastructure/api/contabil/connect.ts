import type { AxiosInstance } from 'axios'

export type ConnectTermsInfo = {
  version: string
  title: string
  body: string
  sha256: string
  accepted: boolean
  acceptedAt?: string | null
}

export type ConnectAccountStatus = {
  stripeAccountId: string
  detailsSubmitted: boolean
  chargesEnabled: boolean
  payoutsEnabled: boolean
  onboardingStatus: 'not_started' | 'pending' | 'restricted' | 'complete' | string
  requirementsCurrentlyDue?: string[]
  requirementsDisabledReason?: string | null
  livemode: boolean
  readyForCharges: boolean
}

export type ConnectStatus = {
  configured: boolean
  paymentsOnlineAllowed: boolean
  canStartOnboarding: boolean
  /** Percentagem da taxa Teglion (ex. "2") */
  platformFeePercent?: string
  terms: ConnectTermsInfo
  account: ConnectAccountStatus | null
}

export const CONNECT_STATUS_QUERY_KEY = ['contabil', 'connect', 'status'] as const

export function createContabilConnectApi(api: AxiosInstance) {
  return {
    getStatus: () => api.get('/contabil/connect/status').then((r) => r.data as ConnectStatus),
    startOnboarding: (payload: { acceptedConnectTerms: true }) =>
      api
        .post('/contabil/connect/onboarding-link', payload)
        .then(
          (r) =>
            r.data as {
              url: string | null
              alreadyReady?: boolean
              stripeAccountId: string
              termsAcceptanceId: string
            },
        ),
    refreshOnboarding: () =>
      api
        .post('/contabil/connect/refresh-link')
        .then((r) => r.data as { url: string; stripeAccountId: string }),
  }
}

export type ContabilConnectApi = ReturnType<typeof createContabilConnectApi>
