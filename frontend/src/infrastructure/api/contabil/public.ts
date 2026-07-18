import type { AxiosInstance } from 'axios'

export type PublicPricingPlans = {
  currency: string
  trialDays: number
  monthly: { interval: 'month'; amountCents: number; configured: boolean }
  yearly: { interval: 'year'; amountCents: number; equivalentMonthlyCents: number; configured: boolean }
}

export function createContabilPublicApi(api: AxiosInstance) {
  return {
    getPricing: (countryCode?: string) =>
      api
        .get('/public/pricing', { params: countryCode ? { country: countryCode } : undefined })
        .then((r) => r.data as PublicPricingPlans),

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
