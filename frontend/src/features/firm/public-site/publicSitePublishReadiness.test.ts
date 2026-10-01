import { describe, expect, it } from 'vitest'

import type { PublicSiteConfig } from '@/shared/types/firmPublicSite'
import {
  evaluatePublicSitePublishReadiness,
  isPublicSiteContactVisible,
  isPublicSiteSlugReady,
} from './publicSitePublishReadiness'

function minimalConfig(overrides: Partial<PublicSiteConfig> = {}): PublicSiteConfig {
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
    socialLinks: {
      instagram: null,
      facebook: null,
      linkedin: null,
      whatsapp: null,
      website: null,
    },
    sections: [
      { key: 'hero-1', type: 'hero', enabled: true, order: 0, content: { title: 'Olá', tagline: '', bio: '', imageIds: [], ctas: [] } },
      { key: 'contact-1', type: 'contact', enabled: true, order: 1, content: { showEmail: true, showPhone: true, showAddress: true, ctas: [] } },
      { key: 'footer-1', type: 'footer', enabled: true, order: 2, content: {} },
    ],
    showPrices: true,
    termsText: null,
    privacyText: null,
    complaintsBookUrl: null,
    complaintsBookLabel: null,
    praiseUrl: null,
    praiseLabel: null,
    praiseContact: null,
    ...overrides,
  }
}

describe('publicSitePublishReadiness', () => {
  it('isPublicSiteSlugReady valida slug mínimo', () => {
    expect(isPublicSiteSlugReady('')).toBe(false)
    expect(isPublicSiteSlugReady('a')).toBe(false)
    expect(isPublicSiteSlugReady('silva-santos')).toBe(true)
  })

  it('evaluatePublicSitePublishReadiness exige serviço publicado', () => {
    const items = evaluatePublicSitePublishReadiness({
      firmSlug: 'escritorio',
      config: minimalConfig(),
      services: [],
      firmContact: { email: 'a@b.pt', phone: null, address: null },
    })
    const servicesItem = items.find((i) => i.id === 'publicServices')
    expect(servicesItem?.ok).toBe(false)
  })

  it('isPublicSiteContactVisible com Contactos activos e email do escritório', () => {
    const config = minimalConfig()
    expect(
      isPublicSiteContactVisible(config, { email: 'contacto@firma.pt', phone: null, address: null }),
    ).toBe(true)
  })

  it('isPublicSiteContactVisible no rodapé quando Contactos está off', () => {
    const config = minimalConfig({
      sections: [
        { key: 'hero-1', type: 'hero', enabled: true, order: 0, content: { title: 'X', tagline: '', bio: '', imageIds: [], ctas: [] } },
        { key: 'contact-1', type: 'contact', enabled: false, order: 1, content: { showEmail: true, showPhone: true, showAddress: true, ctas: [] } },
        { key: 'footer-1', type: 'footer', enabled: true, order: 2, content: {} },
      ],
    })
    expect(
      isPublicSiteContactVisible(config, { email: 'rodape@firma.pt', phone: null, address: null }),
    ).toBe(true)
  })
})
