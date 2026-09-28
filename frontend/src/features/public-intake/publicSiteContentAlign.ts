import type { PublicSiteSectionMediaFields } from '@/shared/types/firmPublicSite'

export type PublicSiteContentAlign = 'left' | 'center' | 'right'

export function normalizePublicSiteContentAlign(value: unknown): PublicSiteContentAlign | null {
  if (value === 'center' || value === 'right') return value
  if (value === 'left') return 'left'
  return null
}

/** Secções (Sobre, FAQ, …): omissão = esquerda — layout clássico. */
export function resolveSectionContentAlign(media?: PublicSiteSectionMediaFields | null): PublicSiteContentAlign {
  const v = media?.contentAlign
  return v === 'center' || v === 'right' ? v : 'left'
}

/** Destaque: omissão = centro — páginas já publicadas mantêm-se. */
export function resolveHeroContentAlign(content?: { contentAlign?: PublicSiteContentAlign | null } | null): PublicSiteContentAlign {
  const v = content?.contentAlign
  if (v === 'left' || v === 'center' || v === 'right') return v
  return 'center'
}

export function contentAlignBlockClass(align: PublicSiteContentAlign): string {
  switch (align) {
    case 'center':
      return 'items-center text-center'
    case 'right':
      return 'items-end text-right'
    default:
      return 'items-start text-left'
  }
}

export function contentAlignFlexClass(align: PublicSiteContentAlign): string {
  switch (align) {
    case 'center':
      return 'justify-center'
    case 'right':
      return 'justify-end'
    default:
      return 'justify-start'
  }
}

export function contentAlignSelfClass(align: PublicSiteContentAlign): string {
  switch (align) {
    case 'center':
      return 'self-center'
    case 'right':
      return 'self-end'
    default:
      return 'self-start'
  }
}

export function contentAlignProseWidthClass(align: PublicSiteContentAlign): string {
  switch (align) {
    case 'center':
      return 'mx-auto max-w-xl'
    case 'right':
      return 'ml-auto max-w-xl'
    default:
      return 'max-w-xl'
  }
}

/** Valor para `<select>` quando omissão = esquerda (secções). */
export function sectionContentAlignUiValue(media?: PublicSiteSectionMediaFields | null): PublicSiteContentAlign {
  return resolveSectionContentAlign(media)
}

/** Valor para `<select>` quando omissão = centro (destaque). */
export function heroContentAlignUiValue(content?: { contentAlign?: PublicSiteContentAlign | null } | null): PublicSiteContentAlign {
  return resolveHeroContentAlign(content)
}

export function patchSectionContentAlign(
  content: PublicSiteSectionMediaFields,
  ui: PublicSiteContentAlign,
): PublicSiteSectionMediaFields {
  return {
    ...content,
    contentAlign: ui === 'left' ? null : ui,
  }
}

export function patchHeroContentAlign(
  content: { contentAlign?: PublicSiteContentAlign | null },
  ui: PublicSiteContentAlign,
): { contentAlign?: PublicSiteContentAlign | null } {
  return {
    ...content,
    contentAlign: ui === 'center' ? null : ui,
  }
}
