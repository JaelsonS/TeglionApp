import { describe, expect, it } from 'vitest'

import {
  applyHeroHighlightTextColors,
  resolveHeroHighlightTextColor,
  setThemePrimaryColor,
} from './publicSiteBrandColors'
import type { PublicSiteConfig } from '@/shared/types/firmPublicSite'

function minimalDraft(): PublicSiteConfig {
  return {
    schemaVersion: 1,
    seo: { title: null, description: null, ogImage: null },
    theme: {
      primaryColor: '#2a9d8f',
      secondaryColor: null,
      textColor: null,
      backgroundColor: null,
      surfaceColor: null,
      mutedTextColor: null,
      headerLogoSource: 'firm',
      heroLogoSource: 'firm',
      logoStorageKey: null,
    },
    images: { hero: [], institutional: [], bySection: {} },
    socialLinks: {
      instagram: null,
      facebook: null,
      linkedin: null,
      whatsapp: null,
      website: null,
    },
    sections: [
      {
        key: 'hero',
        type: 'hero',
        enabled: true,
        order: 0,
        content: {
          tagline: 'Olá',
          title: 'Título',
          bio: 'Bio',
          imageIds: [],
          ctas: [],
          taglineColor: null,
          titleColor: '#071b36',
          bioColor: null,
        },
      },
    ],
    showPrices: true,
    complaintsBookUrl: null,
    complaintsBookLabel: null,
    praiseUrl: null,
    praiseLabel: null,
    praiseContact: null,
  }
}

describe('publicSiteBrandColors', () => {
  it('resolveHeroHighlightTextColor prefers title', () => {
    expect(resolveHeroHighlightTextColor(minimalDraft())).toBe('#071b36')
  })

  it('applyHeroHighlightTextColors sets all hero text fields', () => {
    const next = applyHeroHighlightTextColors(minimalDraft(), '#112233')
    const hero = next.sections.find((s) => s.type === 'hero')
    expect(hero?.type).toBe('hero')
    if (hero?.type !== 'hero') return
    expect(hero.content.titleColor).toBe('#112233')
    expect(hero.content.taglineColor).toBe('#112233')
    expect(hero.content.bioColor).toBe('#112233')
  })

  it('setThemePrimaryColor updates theme', () => {
    const next = setThemePrimaryColor(minimalDraft(), '#071b36')
    expect(next.theme.primaryColor).toBe('#071b36')
  })
})
