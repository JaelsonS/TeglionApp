import type { PublicSiteSection } from '@/shared/types/firmPublicSite'

/**
 * Ordem recomendada do visitante (header → … → footer).
 * Usada no reset / «ordem recomendada»; a ordem guardada do utilizador prevalece depois.
 */
export const PUBLIC_SITE_SECTION_TYPE_ORDER = [
  'header',
  'hero',
  'about',
  'services',
  'bookingServices',
  'features',
  'process',
  'faq',
  'contact',
  'footer',
] as const

export type PublicSiteSectionTypeOrder = (typeof PUBLIC_SITE_SECTION_TYPE_ORDER)[number]

const TYPE_RANK = Object.fromEntries(
  PUBLIC_SITE_SECTION_TYPE_ORDER.map((type, index) => [type, index]),
) as Record<string, number>

export function rankPublicSiteSectionType(type: string): number {
  return TYPE_RANK[type] ?? 100
}

/** Ordena só por `order` e reindexa 0..n-1 (preserva a escolha do utilizador). */
export function reindexPublicSiteSectionsOrder(sections: PublicSiteSection[]): PublicSiteSection[] {
  return [...sections]
    .sort((a, b) => a.order - b.order)
    .map((section, index) => ({ ...section, order: index }))
}

/** Força a ordem recomendada por tipo e reindexa. */
export function normalizePublicSiteSectionsOrder(sections: PublicSiteSection[]): PublicSiteSection[] {
  return [...sections]
    .sort((a, b) => {
      const rankDiff = rankPublicSiteSectionType(a.type) - rankPublicSiteSectionType(b.type)
      if (rankDiff !== 0) return rankDiff
      return a.order - b.order
    })
    .map((section, index) => ({ ...section, order: index }))
}

/**
 * Reordena após drag-and-drop (qualquer secção, ordem livre do utilizador).
 */
export function reorderPublicSiteSections(
  sections: PublicSiteSection[],
  activeKey: string,
  overKey: string,
): PublicSiteSection[] {
  if (activeKey === overKey) return reindexPublicSiteSectionsOrder(sections)

  const sorted = reindexPublicSiteSectionsOrder(sections)
  const activeIndex = sorted.findIndex((s) => s.key === activeKey)
  const overIndex = sorted.findIndex((s) => s.key === overKey)
  if (activeIndex === -1 || overIndex === -1) return sorted

  const next = [...sorted]
  const [moved] = next.splice(activeIndex, 1)
  next.splice(overIndex, 0, moved)
  return next.map((section, index) => ({ ...section, order: index }))
}
