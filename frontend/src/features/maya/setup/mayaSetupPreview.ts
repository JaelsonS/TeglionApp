import type { MayaSetupProposalV1 } from '@/infrastructure/api/contabil/mayaSetup'

type SectionLike = { type?: string; content?: Record<string, unknown> }

function sectionByType(proposal: MayaSetupProposalV1, type: string): SectionLike | null {
  const sections = proposal.publicSitePatch?.sections
  if (!Array.isArray(sections)) return null
  return (sections.find((s) => s && typeof s === 'object' && (s as SectionLike).type === type) as SectionLike) || null
}

export function formatPublicSitePreview(proposal: MayaSetupProposalV1): {
  empty: boolean
  seoTitle: string | null
  seoDescription: string | null
  heroTitle: string | null
  heroTagline: string | null
  heroBio: string | null
  aboutHeading: string | null
  aboutBody: string | null
} {
  const patch = proposal.publicSitePatch || {}
  const seo = patch.seo as { title?: string; description?: string } | undefined
  const hero = sectionByType(proposal, 'hero')
  const about = sectionByType(proposal, 'about')
  const heroContent = (hero?.content || {}) as Record<string, string>
  const aboutContent = (about?.content || {}) as Record<string, string>

  const seoTitle = seo?.title?.trim() || null
  const seoDescription = seo?.description?.trim() || null
  const heroTitle = heroContent.title?.trim() || null
  const heroTagline = heroContent.tagline?.trim() || null
  const heroBio = heroContent.bio?.trim() || null
  const aboutHeading = aboutContent.heading?.trim() || null
  const aboutBody = aboutContent.body?.trim() || null

  const empty = !seoTitle && !heroTitle && !aboutBody

  return {
    empty,
    seoTitle,
    seoDescription,
    heroTitle,
    heroTagline,
    heroBio,
    aboutHeading,
    aboutBody,
  }
}

const WEEKDAY_PT = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

export function formatBookingPreview(proposal: MayaSetupProposalV1): string[] {
  const schedule = proposal.booking?.defaultSchedule || {}
  const lines: string[] = []
  lines.push(`Fuso horário: ${proposal.booking?.timezone || '—'}`)
  const days = Object.keys(schedule)
    .map(Number)
    .filter((d) => Number.isInteger(d))
    .sort((a, b) => a - b)
  if (!days.length) {
    lines.push('Horário por definir na proposta.')
    return lines
  }
  for (const d of days) {
    const intervals = schedule[d] ?? schedule[String(d)]
    if (!Array.isArray(intervals) || !intervals.length) continue
    const slots = intervals.map((iv) => `${iv.start}–${iv.end}`).join(', ')
    lines.push(`${WEEKDAY_PT[d] || d}: ${slots}`)
  }
  return lines
}
