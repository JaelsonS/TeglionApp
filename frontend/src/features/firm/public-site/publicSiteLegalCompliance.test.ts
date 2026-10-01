import { describe, expect, it } from 'vitest'

import type { PublicSiteConfig } from '@/shared/types/firmPublicSite'
import { DEFAULT_COMPLAINTS_BOOK_URL } from './publicSiteLegalDefaults'
import { DEFAULT_PRIVACY_TEMPLATE, DEFAULT_TERMS_TEMPLATE } from './publicSiteLegalTemplates'
import { evaluatePublicSiteLegalGaps, isPublicSitePolicyTextConfigured } from './publicSiteLegalCompliance'

function legalConfig(partial: Partial<PublicSiteConfig>): PublicSiteConfig {
  return {
    schemaVersion: 1,
    seo: { title: null, description: null, ogImage: null },
    theme: {
      primaryColor: null,
      secondaryColor: null,
      textColor: null,
      backgroundColor: null,
      surfaceColor: null,
      mutedTextColor: null,
      headerLogoSource: 'firm',
      heroLogoSource: 'firm',
      logoStorageKey: null,
      headerLogoStorageKey: null,
      heroLogoStorageKey: null,
    },
    images: { hero: [], institutional: [], bySection: {} },
    socialLinks: { instagram: null, facebook: null, linkedin: null, whatsapp: null, website: null },
    sections: [],
    showPrices: true,
    termsText: null,
    privacyText: null,
    complaintsBookUrl: null,
    complaintsBookLabel: null,
    praiseUrl: null,
    praiseLabel: null,
    praiseContact: null,
    ...partial,
  }
}

describe('isPublicSitePolicyTextConfigured', () => {
  it('rejeita vazio e modelo por referência', () => {
    expect(isPublicSitePolicyTextConfigured('')).toBe(false)
    expect(isPublicSitePolicyTextConfigured(DEFAULT_TERMS_TEMPLATE)).toBe(false)
  })

  it('aceita texto adaptado', () => {
    expect(isPublicSitePolicyTextConfigured(`${DEFAULT_TERMS_TEMPLATE}\nContacto: nif@firma.pt`)).toBe(true)
  })
})

describe('evaluatePublicSiteLegalGaps', () => {
  it('sem gaps quando livro e políticas estão configurados', () => {
    const gaps = evaluatePublicSiteLegalGaps(
      legalConfig({
        complaintsBookUrl: DEFAULT_COMPLAINTS_BOOK_URL,
        termsText: 'Termos do escritório Silva.',
        privacyText: 'Privacidade do escritório Silva.',
      }),
    )
    expect(gaps).toHaveLength(0)
  })

  it('lista três gaps típicos', () => {
    const gaps = evaluatePublicSiteLegalGaps(legalConfig({}))
    expect(gaps.map((g) => g.id)).toEqual(['complaintsBook', 'terms', 'privacy'])
  })

  it('modelo padrão sem adaptar conta como gap', () => {
    const gaps = evaluatePublicSiteLegalGaps(
      legalConfig({
        complaintsBookUrl: DEFAULT_COMPLAINTS_BOOK_URL,
        termsText: DEFAULT_TERMS_TEMPLATE,
        privacyText: DEFAULT_PRIVACY_TEMPLATE,
      }),
    )
    expect(gaps.map((g) => g.id)).toEqual(['terms', 'privacy'])
  })
})
