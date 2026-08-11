import type { AxiosInstance } from 'axios'
import type { IntakeForm } from '@/shared/types/contabil'

export type PublicServiceIntake = {
  firmName: string
  serviceName: string
  description?: string | null
  intakeForm: IntakeForm
  requiresBooking: boolean
}

export type PublicFirmServiceSummary = {
  slug: string
  name: string
  description?: string | null
  durationMinutes: number
  priceCents: number
  requiresBooking: boolean
}

export type PublicFirmServices = {
  firmName: string
  items: PublicFirmServiceSummary[]
}

export type PublicIntakeSubmitPayload = {
  name: string
  email?: string
  phone?: string
  taxId?: string
  answers: Record<string, string | string[]>
  website?: string
  scheduledAt?: string
}

export type PublicIntakeSubmitResult = {
  ok: true
  accessToken: string
  documentsRequired: number
  /** false quando o submissor é um Lead novo — o horário fica só como preferência, não é uma reserva real. */
  bookingConfirmed: boolean
  scheduledAt: string | null
}

export type IntakeChecklistItem = {
  id: string
  kind: 'document' | 'question'
  tag: string | null
  title: string
  instructions?: string | null
  received: boolean
  textReply?: string | null
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

    getPublicFirmServices: (firmSlug: string) =>
      api
        .get(`/public/firms/${encodeURIComponent(firmSlug)}/services`)
        .then((r) => r.data as PublicFirmServices),

    getPublicService: (firmSlug: string, serviceSlug: string) =>
      api
        .get(`/public/firms/${encodeURIComponent(firmSlug)}/services/${encodeURIComponent(serviceSlug)}`)
        .then((r) => r.data as PublicServiceIntake),

    getPublicSlots: (firmSlug: string, serviceSlug: string) =>
      api
        .get(`/public/firms/${encodeURIComponent(firmSlug)}/services/${encodeURIComponent(serviceSlug)}/slots`)
        .then((r) => r.data as { slots: string[] }),

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

    submitIntakeReply: (token: string, requestId: string, textReply: string) =>
      api
        .post(`/public/service-inquiries/${encodeURIComponent(token)}/requests/${encodeURIComponent(requestId)}/reply`, {
          textReply,
        })
        .then((r) => r.data as { checklist: IntakeChecklistItem[] }),
  }
}

export type ContabilPublicApi = ReturnType<typeof createContabilPublicApi>
