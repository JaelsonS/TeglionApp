import type { PublicSiteConfig, PublicSiteSection } from '@/shared/types/firmPublicSite'

/** Hex válido #RRGGBB (ou vazio → null). */
export function parsePublicSiteHex(value: string | null | undefined): string | null {
  const raw = String(value || '').trim()
  if (!raw) return null
  if (/^#[0-9a-f]{6}$/i.test(raw)) return raw.toLowerCase()
  if (/^[0-9a-f]{6}$/i.test(raw)) return `#${raw.toLowerCase()}`
  return null
}

/** Remove `backgroundColor` de todas as secções (para a cor da página aparecer). */
export function clearSectionBackgroundColors(sections: PublicSiteSection[]): PublicSiteSection[] {
  return sections.map((section) => {
    const content = section.content as Record<string, unknown>
    if (!content || typeof content !== 'object' || !('backgroundColor' in content)) {
      return section
    }
    if (content.backgroundColor == null || content.backgroundColor === '') {
      return section
    }
    return {
      ...section,
      content: { ...content, backgroundColor: null },
    } as PublicSiteSection
  })
}

/**
 * Ao mudar o fundo da página, limpa fundos das secções que a tapavam
 * e devolve o config pronto para o preview/save.
 */
export function applyPageBackgroundColor(
  draft: PublicSiteConfig,
  backgroundColor: string | null,
): PublicSiteConfig {
  const nextBg = parsePublicSiteHex(backgroundColor)
  const hadSectionBgs = draft.sections.some((section) => {
    const content = section.content as { backgroundColor?: string | null }
    return Boolean(content?.backgroundColor)
  })
  return {
    ...draft,
    theme: { ...draft.theme, backgroundColor: nextBg },
    sections: nextBg && hadSectionBgs ? clearSectionBackgroundColors(draft.sections) : draft.sections,
  }
}
