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
 * Reordena após drag-and-drop.
 * Barra do topo fica sempre primeiro; rodapé sempre por último.
 */
export function reorderPublicSiteSections(
  sections: PublicSiteSection[],
  activeKey: string,
  overKey: string,
): PublicSiteSection[] {
  if (activeKey === overKey) return reindexPublicSiteSectionsOrder(sections)

  const sorted = reindexPublicSiteSectionsOrder(sections)
  const active = sorted.find((s) => s.key === activeKey)
  const over = sorted.find((s) => s.key === overKey)
  if (!active || !over) return sorted

  // Header e footer não se movem
  if (active.type === 'header' || active.type === 'footer') return sorted
  // Não colocar nada antes do header nem depois do footer
  if (over.type === 'header' || over.type === 'footer') return sorted

  const without = sorted.filter((s) => s.key !== activeKey)
  const overIndex = without.findIndex((s) => s.key === overKey)
  if (overIndex === -1) return sorted

  const next = [...without.slice(0, overIndex), active, ...without.slice(overIndex)]
  return next.map((section, index) => ({ ...section, order: index }))
}
