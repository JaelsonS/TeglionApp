import type { AxiosInstance } from 'axios'
import type { IntakeForm } from '@/shared/types/contabil'

export type PublicServiceIntake = {
  firmName: string
  serviceName: string
  description?: string | null
  intakeForm: IntakeForm
}

export type PublicIntakeSubmitPayload = {
  name: string
  email?: string
  phone?: string
  taxId?: string
  answers: Record<string, string | string[]>
  website?: string
}

export type PublicIntakeSubmitResult = {
  ok: true
  accessToken: string
  documentsRequired: number
}

export type IntakeChecklistItem = {
  tag: string
  title: string
  instructions?: string | null
  received: boolean
}

export type PublicIntakeChecklist = {
  serviceName: string | null
  status: string
  checklist: IntakeChecklistItem[]
}

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

    getPublicService: (firmSlug: string, serviceSlug: string) =>
      api
        .get(`/public/firms/${encodeURIComponent(firmSlug)}/services/${encodeURIComponent(serviceSlug)}`)
        .then((r) => r.data as PublicServiceIntake),

    submitServiceIntake: (firmSlug: string, serviceSlug: string, payload: PublicIntakeSubmitPayload) =>
      api
        .post(
          `/public/firms/${encodeURIComponent(firmSlug)}/services/${encodeURIComponent(serviceSlug)}/submit`,
          payload,
        )
        .then((r) => r.data as PublicIntakeSubmitResult),

    getIntakeByToken: (token: string) =>
      api.get(`/public/service-inquiries/${encodeURIComponent(token)}`).then((r) => r.data as PublicIntakeChecklist),

    uploadIntakeDocument: (token: string, tag: string, file: File) => {
      const form = new FormData()
      form.append('tag', tag)
      form.append('file', file)
      return api
        .post(`/public/service-inquiries/${encodeURIComponent(token)}/documents`, form)
        .then((r) => r.data as { allComplete: boolean; checklist: IntakeChecklistItem[] })
    },
  }
}

export type ContabilPublicApi = ReturnType<typeof createContabilPublicApi>
