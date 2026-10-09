import { api } from '@/infrastructure/api'

export type MayaSetupAnswers = {
  consentOpenAi: boolean
  consentVersion?: string
  countryCode: 'PT' | 'BR'
  tone: 'formal' | 'friendly'
  specialties: string[]
  serviceCatalogKeys: string[]
  irsCampaign?: boolean
  cityRegion?: string
  /** Texto livre do dono (sem PII de clientes) — orienta copy da página. */
  ownerBrief?: string
  scheduleHint?: {
    weekdays?: number[]
    dayStart?: string
    dayEnd?: string
  }
  customServices?: Array<{
    name: string
    description?: string
    durationMinutes?: number
    priceCents?: number
  }>
  mediaAssets?: {
    logoUploaded?: boolean
    heroImage?: { id: string; storageKey: string; alt?: string }
    aboutImage?: { id: string; storageKey: string; alt?: string }
    prepareServicesForPublicPage?: boolean
    includeDemoClients?: boolean
    serviceImages?: Record<string, { storageKey: string } | string>
  }
}

export type MayaSetupProposalV1 = {
  version: 1
  publicSitePatch: Record<string, unknown>
  services: Array<{
    catalogKey: string
    name?: string | null
    slug?: string | null
    publicGroup?: string | null
    description?: string | null
  }>
  irs: { activateCampaign: boolean; templateIds: string[] }
  booking: { timezone: string; defaultSchedule: Record<string, Array<{ start: string; end: string }>> }
  rationale?: string
  applySummary?: Record<string, unknown>
}

export type MayaSetupSession = {
  id: string
  status: string
  answers: MayaSetupAnswers
  proposal: MayaSetupProposalV1 | null
  appliedAt: string | null
  createdAt: string
  updatedAt: string
}

export type MayaSetupCapabilities = {
  aiSetup: boolean
  mayaGuideIncluded: boolean
  mayaGenerativeRequiresEntitlement: boolean
  demoOffice: boolean
  supportedCountries: Array<'PT' | 'BR'>
  phases: Record<string, boolean>
}

export const mayaSetupApi = {
  getCapabilities: () =>
    api.get('/contabil/maya-setup/capabilities').then((r) => r.data as { capabilities: MayaSetupCapabilities }),

  createSession: (answers: MayaSetupAnswers) =>
    api.post('/contabil/maya-setup/sessions', { answers }).then((r) => r.data as { session: MayaSetupSession }),

  getSession: (id: string) =>
    api.get(`/contabil/maya-setup/sessions/${id}`).then((r) => r.data as { session: MayaSetupSession }),

  generate: (id: string) =>
    api.post(`/contabil/maya-setup/sessions/${id}/generate`).then((r) => r.data as { session: MayaSetupSession }),

  apply: (id: string, proposal?: MayaSetupProposalV1) =>
    api
      .post(`/contabil/maya-setup/sessions/${id}/apply`, proposal ? { proposal } : undefined)
      .then(
        (r) =>
          r.data as {
            session: MayaSetupSession
            applySummary?: Record<string, unknown>
            idempotent?: boolean
          },
      ),
}
