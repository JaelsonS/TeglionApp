import type { AxiosInstance } from 'axios'

export type PublicPricingPlans = {
  currency: string
  trialDays: number
  monthly: { interval: 'month'; amountCents: number; configured: boolean }
  yearly: { interval: 'year'; amountCents: number; equivalentMonthlyCents: number; configured: boolean }
}

export type SupportRequestPayload = {
  name: string
  email: string
  phone?: string
  subject?: string
  message: string
}

export function createContabilPublicApi(api: AxiosInstance) {
  return {
    getPricing: (countryCode?: string) =>
      api
        .get('/public/pricing', { params: countryCode ? { country: countryCode } : undefined })
        .then((r) => r.data as PublicPricingPlans),

    sendSupportRequest: (payload: SupportRequestPayload) =>
      api.post('/public/support', payload).then((r) => r.data as { ok: true }),

    getLegalVersions: () =>
      api.get('/public/legal/versions').then(
        (r) =>
          r.data as {
            versions: Record<string, string>
            operator: Record<string, string>
            required: string[]
          },
      ),

    getSupportedCountries: () =>
      api
        .get('/public/countries')
        .then((r) => r.data as { countries: Array<{ code: string; name: string; currency: string }> }),

    postalLookup: (code: string) =>
      api.get('/public/postal-lookup', { params: { code } }).then((r) => r.data),

    getFirmBranding: (slug: string) =>
      api
        .get('/public/firm-branding', { params: { slug } })
        .then((r) => r.data as { slug: string; name: string; logoUrl?: string | null }),
  }
}

export type ContabilPublicApi = ReturnType<typeof createContabilPublicApi>
