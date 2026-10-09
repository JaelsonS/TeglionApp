import type { MayaSetupProposalV1 } from '@/infrastructure/api/contabil/mayaSetup'

type SectionRow = { type?: string; enabled?: boolean; content?: Record<string, unknown> }

function cloneProposal(proposal: MayaSetupProposalV1): MayaSetupProposalV1 {
  return structuredClone(proposal)
}

function sectionsOf(proposal: MayaSetupProposalV1): SectionRow[] {
  const raw = proposal.publicSitePatch?.sections
  return Array.isArray(raw) ? (raw as SectionRow[]) : []
}

export function patchProposalSectionContent(
  proposal: MayaSetupProposalV1,
  type: string,
  contentPatch: Record<string, unknown>,
): MayaSetupProposalV1 {
  const next = cloneProposal(proposal)
  const sections = [...sectionsOf(next)]
  const idx = sections.findIndex((s) => s.type === type)
  if (idx >= 0) {
    sections[idx] = {
      ...sections[idx],
      content: { ...(sections[idx].content || {}), ...contentPatch },
    }
  } else {
    sections.push({ type, enabled: true, content: contentPatch })
  }
  next.publicSitePatch = { ...(next.publicSitePatch || {}), sections }
  return next
}

export function patchProposalSeo(
  proposal: MayaSetupProposalV1,
  seo: { title?: string; description?: string },
): MayaSetupProposalV1 {
  const next = cloneProposal(proposal)
  const prev = (next.publicSitePatch?.seo || {}) as Record<string, string>
  next.publicSitePatch = {
    ...(next.publicSitePatch || {}),
    seo: { ...prev, ...seo },
  }
  return next
}

export function patchProposalService(
  proposal: MayaSetupProposalV1,
  catalogKey: string,
  patch: { name?: string; description?: string | null },
): MayaSetupProposalV1 {
  const next = cloneProposal(proposal)
  next.services = next.services.map((s) =>
    s.catalogKey === catalogKey ? { ...s, ...patch } : s,
  )
  return next
}

export function patchProposalIrs(
  proposal: MayaSetupProposalV1,
  irs: { activateCampaign: boolean; templateIds?: string[] },
): MayaSetupProposalV1 {
  const next = cloneProposal(proposal)
  next.irs = {
    activateCampaign: irs.activateCampaign,
    templateIds: irs.activateCampaign
      ? irs.templateIds?.length
        ? irs.templateIds
        : ['irs-modelo-3']
      : [],
  }
  return next
}

export function patchProposalBookingDay(
  proposal: MayaSetupProposalV1,
  weekday: number,
  interval: { start: string; end: string } | null,
): MayaSetupProposalV1 {
  const next = cloneProposal(proposal)
  const schedule = { ...(next.booking?.defaultSchedule || {}) }
  if (interval) {
    schedule[weekday] = [interval]
  } else {
    delete schedule[weekday]
    delete schedule[String(weekday) as unknown as number]
  }
  next.booking = {
    timezone: next.booking?.timezone || 'Europe/Lisbon',
    defaultSchedule: schedule,
  }
  return next
}

export function patchProposalBookingTimezone(proposal: MayaSetupProposalV1, timezone: string): MayaSetupProposalV1 {
  const next = cloneProposal(proposal)
  next.booking = {
    timezone,
    defaultSchedule: next.booking?.defaultSchedule || {},
  }
  return next
}

export function readSectionContent(proposal: MayaSetupProposalV1, type: string): Record<string, string> {
  const sec = sectionsOf(proposal).find((s) => s.type === type)
  const c = sec?.content || {}
  const out: Record<string, string> = {}
  for (const [k, v] of Object.entries(c)) {
    if (typeof v === 'string') out[k] = v
  }
  return out
}
