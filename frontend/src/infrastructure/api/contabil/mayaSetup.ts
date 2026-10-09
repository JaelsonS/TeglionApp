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

export const mayaSetupApi = {
  createSession: (answers: MayaSetupAnswers) =>
    api.post('/contabil/maya-setup/sessions', { answers }).then((r) => r.data as { session: MayaSetupSession }),

  getSession: (id: string) =>
    api.get(`/contabil/maya-setup/sessions/${id}`).then((r) => r.data as { session: MayaSetupSession }),

  generate: (id: string) =>
    api.post(`/contabil/maya-setup/sessions/${id}/generate`).then((r) => r.data as { session: MayaSetupSession }),

  apply: (id: string) =>
    api
      .post(`/contabil/maya-setup/sessions/${id}/apply`)
      .then(
        (r) =>
          r.data as {
            session: MayaSetupSession
            applySummary?: Record<string, unknown>
            idempotent?: boolean
          },
      ),
}
