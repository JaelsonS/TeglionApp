import type { PublicSiteConfig, PublicSiteHeroContent } from '@/shared/types/firmPublicSite'

export function findHeroSection(draft: PublicSiteConfig) {
  return draft.sections.find((s) => s.type === 'hero') ?? null
}

export function getHeroContent(draft: PublicSiteConfig): PublicSiteHeroContent | null {
  const hero = findHeroSection(draft)
  if (!hero || hero.type !== 'hero') return null
  return hero.content
}

/** Cor efectiva dos textos do destaque (título → frase → parágrafo, ou vazio = usa cor de destaque do site). */
export function resolveHeroHighlightTextColor(draft: PublicSiteConfig): string | null {
  const content = getHeroContent(draft)
  if (!content) return null
  return content.titleColor || content.taglineColor || content.bioColor || null
}

export function applyHeroHighlightTextColors(draft: PublicSiteConfig, color: string | null): PublicSiteConfig {
  const hero = findHeroSection(draft)
  if (!hero || hero.type !== 'hero') return draft
  const content = hero.content
  const nextContent: PublicSiteHeroContent = {
    ...content,
    taglineColor: color,
    titleColor: color,
    bioColor: color,
  }
  return {
    ...draft,
    sections: draft.sections.map((s) =>
      s.key === hero.key && s.type === 'hero' ? ({ ...s, content: nextContent } as typeof s) : s,
    ),
  }
}

export function setThemePrimaryColor(draft: PublicSiteConfig, primaryColor: string | null): PublicSiteConfig {
  return {
    ...draft,
    theme: { ...draft.theme, primaryColor },
  }
}
