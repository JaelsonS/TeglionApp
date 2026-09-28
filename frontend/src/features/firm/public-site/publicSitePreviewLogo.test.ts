import { describe, expect, it } from 'vitest'

import { resolvePublicSitePreviewZoneLogoUrl } from './publicSitePreviewLogo'
import type { PublicSiteConfig } from '@/shared/types/firmPublicSite'

const baseDraft = {
  theme: { logoStorageKey: null, headerLogoSource: 'firm' as const, heroLogoSource: 'firm' as const },
} as PublicSiteConfig

describe('resolvePublicSitePreviewZoneLogoUrl', () => {
  it('usa logótipo das Definições quando source=firm', () => {
    expect(resolvePublicSitePreviewZoneLogoUrl(baseDraft, 'header', 'https://firm.test/logo.png')).toBe(
      'https://firm.test/logo.png',
    )
  })

  it('none não mostra imagem mesmo com firm logo', () => {
    const draft = {
      ...baseDraft,
      theme: { ...baseDraft.theme, headerLogoSource: 'none' as const },
    } as PublicSiteConfig
    expect(resolvePublicSitePreviewZoneLogoUrl(draft, 'header', 'https://firm.test/logo.png')).toBeNull()
  })

  it('custom usa URL resolvida do tema', () => {
    const draft = {
      ...baseDraft,
      theme: {
        ...baseDraft.theme,
        headerLogoSource: 'custom' as const,
        headerLogoStorageKey: 'firm/x/header.webp',
        headerLogoUrl: 'https://signed.test/h',
      },
    } as PublicSiteConfig
    expect(resolvePublicSitePreviewZoneLogoUrl(draft, 'header', 'https://firm.test/logo.png')).toBe(
      'https://signed.test/h',
    )
  })
})
