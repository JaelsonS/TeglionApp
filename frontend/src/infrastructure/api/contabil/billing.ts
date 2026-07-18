import type { AxiosInstance } from 'axios'

export type BillingStatus = {
  status: string
  trialEndsAt?: string | null
  billingPlan?: string | null
  hasAccess: boolean
  accessReason: string
  stripeConfigured: boolean
  stripeCustomerId?: string | null
  hasSubscription: boolean
  priceEurCents?: number
  trialDays?: number
  plans?: {
    monthly?: { interval: string; amountCents: number; configured: boolean }
    yearly?: { interval: string; amountCents: number; equivalentMonthlyCents?: number; configured: boolean }
  }
}

export const BILLING_STATUS_QUERY_KEY = ['contabil', 'billing', 'status'] as const

/** Subscrição Stripe — trial expirado pode aceder a estas rotas. */
export function createContabilBillingApi(api: AxiosInstance) {
  return {
    getStatus: () => api.get('/contabil/billing/status').then((r) => r.data as BillingStatus),
    createCheckout: (interval: 'month' | 'year' = 'month') =>
      api
        .post('/contabil/billing/checkout', { interval })
        .then((r) => r.data as { url: string; sessionId?: string; interval?: string }),
    createPortal: () => api.post('/contabil/billing/portal').then((r) => r.data as { url: string }),
  }
}

export type ContabilBillingApi = ReturnType<typeof createContabilBillingApi>
