import type { PublicSiteSection } from '@/shared/types/firmPublicSite'

/**
 * Ordem canónica do visitante — a UI e o save devem seguir isto
 * (header → … → footer), não a ordem arbitrária guardada no rascunho.
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

/** Ordena secções pela ordem do visitante e reindexa `order` 0..n-1. */
export function normalizePublicSiteSectionsOrder(sections: PublicSiteSection[]): PublicSiteSection[] {
  return [...sections]
    .sort((a, b) => {
      const rankDiff = rankPublicSiteSectionType(a.type) - rankPublicSiteSectionType(b.type)
      if (rankDiff !== 0) return rankDiff
      return a.order - b.order
    })
    .map((section, index) => ({ ...section, order: index }))
}
