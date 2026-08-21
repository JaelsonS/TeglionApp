import type { AxiosInstance } from 'axios'
import type { IntakeForm } from '@/shared/types/contabil'
import type { PublicSiteConfig } from '@/shared/types/firmPublicSite'
import { withTurnstileToken } from '@/shared/security/withTurnstileToken'

export type PublicFirmServiceSummary = {
  slug: string
  name: string
  description?: string | null
  durationMinutes: number
  priceCents: number
  priceTaxMode?: 'included' | 'excluded' | null
  requiresBooking: boolean
  publicGroup?: string | null
  paymentRequired?: boolean
  imageUrl?: string | null
  imageOriginalUrl?: string | null
  imageFocusX?: number | null
  imageFocusY?: number | null
  imageZoom?: number | null
}

export type PublicServiceIntake = {
  firmName: string
  logoUrl?: string | null
  showFirmLogo?: boolean
  showTeglionCredit?: boolean
  serviceName: string
  description?: string | null
  imageUrl?: string | null
  imageOriginalUrl?: string | null
  imageFocusX?: number | null
  imageFocusY?: number | null
  imageZoom?: number | null
  intakeForm: IntakeForm
  requiresBooking: boolean
  intakeStartMode?: 'form' | 'calendar'
  paymentRequired?: boolean
  priceCents?: number
  priceTaxMode?: 'included' | 'excluded' | null
  showPrices?: boolean
  termsText?: string | null
  privacyText?: string | null
  theme?: PublicSiteConfig['theme'] | null
}

export type PublicFirmFaq = {
  id: string
  question: string
  answer: string
}

export type PublicFirmSocialLinks = {
  instagram?: string | null
  facebook?: string | null
  linkedin?: string | null
  whatsapp?: string | null
  website?: string | null
}

export type PublicFirmContact = {
  email: string | null
  phone: string | null
  address: string | null
}

export type PublicFirmServices = {
  firmName: string
  logoUrl: string | null
  primaryColor: string | null
  secondaryColor: string | null
  tagline: string | null
  bio: string | null
  socialLinks: PublicFirmSocialLinks
  faqs: PublicFirmFaq[]
  contact: PublicFirmContact
  items: PublicFirmServiceSummary[]
}

/** v9 — resposta de `GET /public/firms/:firmSlug/site` (ver plan file da
 * sessão). Substitui `PublicFirmServices` acima como fonte da página
 * pública a partir da Fase 4 — aquele endpoint fica só para consumidores
 * antigos durante a transição. */
export type PublicFirmSite = {
  firmName: string
  logoUrl: string | null
  isPreview: boolean
  templateKey: string
  seo: PublicSiteConfig['seo']
  theme: PublicSiteConfig['theme']
  images: PublicSiteConfig['images']
  socialLinks: PublicSiteConfig['socialLinks']
  sections: PublicSiteConfig['sections']
  showPrices?: boolean
  termsText?: string | null
  privacyText?: string | null
  complaintsBookUrl?: string | null
  complaintsBookLabel?: string | null
  praiseUrl?: string | null
  praiseLabel?: string | null
  praiseContact?: string | null
  showTeglionCredit?: boolean
  contact: PublicFirmContact
  services: PublicFirmServiceSummary[]
}

export type PublicIntakeSubmitPayload = {
  name: string
  email: string
  phone?: string
  taxId?: string
  answers: Record<string, string | string[]>
  website?: string
  scheduledAt?: string
  /** Token da reserva temporária (agenda primeiro). */
  holdToken?: string
  /** Token do passo 1 (lead). Preferir `intakeToken`. */
  intakeToken?: string
  /** @deprecated Use intakeToken — mantido para clients antigos. */
  leadAccessToken?: string
  turnstileToken?: string
}

export type PublicIntakeSubmitResult = {
  ok: true
  /** Token opaco do portal `/pedidos/:token` (não é JWT). */
  intakeToken: string
  documentsRequired: number
  bookingConfirmed: boolean
  bookingPendingPayment?: boolean
  scheduledAt: string | null
  checkoutUrl?: string | null
  paymentPublicToken?: string | null
  holdExpiresAt?: string | null
  paymentRequired?: boolean
  consultationId?: string | null
}

export type PublicBookingPaymentStatus = {
  paymentStatus: string
  bookingStatus: string | null
  scheduledAt: string | null
  amountCents: number
  currency: string
  holdExpiresAt?: string | null
  confirmed: boolean
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
  turnstileToken?: string
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

    getPublicFirmSite: (firmSlug: string, previewToken?: string) =>
      api
        .get(`/public/firms/${encodeURIComponent(firmSlug)}/site`, {
          params: previewToken ? { preview: previewToken } : undefined,
        })
        .then((r) => r.data as PublicFirmSite),

    getPublicService: (firmSlug: string, serviceSlug: string) =>
      api
        .get(`/public/firms/${encodeURIComponent(firmSlug)}/services/${encodeURIComponent(serviceSlug)}`)
        .then((r) => r.data as PublicServiceIntake),

    getPublicSlots: (firmSlug: string, serviceSlug: string) =>
      api
        .get(`/public/firms/${encodeURIComponent(firmSlug)}/services/${encodeURIComponent(serviceSlug)}/slots`)
        .then((r) => r.data as { slots: string[] }),

    holdPublicSlot: (
      firmSlug: string,
      serviceSlug: string,
      payload: { scheduledAt: string; website?: string; turnstileToken?: string },
    ) =>
      api
        .post(
          `/public/firms/${encodeURIComponent(firmSlug)}/services/${encodeURIComponent(serviceSlug)}/intake/hold`,
          payload,
        )
        .then((r) => r.data as { ok: true; holdToken: string; expiresAt: string | null; scheduledAt: string | null }),

    submitServiceIntake: (firmSlug: string, serviceSlug: string, payload: PublicIntakeSubmitPayload) =>
      api
        .post(
          `/public/firms/${encodeURIComponent(firmSlug)}/services/${encodeURIComponent(serviceSlug)}/submit`,
          payload,
        )
        .then((r) => r.data as PublicIntakeSubmitResult),

    getBookingPaymentStatus: (consultationId: string, token: string) =>
      api
        .get('/public/booking/payment-status', { params: { c: consultationId, t: token } })
        .then((r) => r.data as PublicBookingPaymentStatus),

    captureServiceLead: (
      firmSlug: string,
      serviceSlug: string,
      payload: {
        name: string
        email: string
        phone?: string
        taxId?: string
        website?: string
        turnstileToken?: string
      },
    ) =>
      api
        .post(
          `/public/firms/${encodeURIComponent(firmSlug)}/services/${encodeURIComponent(serviceSlug)}/intake/lead`,
          payload,
        )
        .then((r) => r.data as { ok: true; intakeToken: string }),

    getIntakeByToken: (token: string) =>
      api.get(`/public/service-inquiries/${encodeURIComponent(token)}`).then((r) => r.data as PublicIntakeChecklist),

    uploadIntakeDocument: (token: string, tag: string, file: File, turnstileToken?: string) => {
      const form = new FormData()
      form.append('tag', tag)
      form.append('file', file)
      const ts = String(turnstileToken || '').trim()
      if (ts) form.append('turnstileToken', ts)
      return api
        .post(`/public/service-inquiries/${encodeURIComponent(token)}/documents`, form)
        .then((r) => r.data as { allComplete: boolean; checklist: IntakeChecklistItem[] })
    },

    submitIntakeReply: (
      token: string,
      requestId: string,
      textReply: string,
      turnstileToken?: string,
    ) =>
      api
        .post(
          `/public/service-inquiries/${encodeURIComponent(token)}/requests/${encodeURIComponent(requestId)}/reply`,
          withTurnstileToken({ textReply }, turnstileToken),
        )
        .then((r) => r.data as { checklist: IntakeChecklistItem[] }),
  }
}

export type ContabilPublicApi = ReturnType<typeof createContabilPublicApi>
