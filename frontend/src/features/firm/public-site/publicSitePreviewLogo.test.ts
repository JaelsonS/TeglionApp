import { describe, expect, it } from 'vitest'

import { resolvePublicSitePreviewLogoUrl } from './publicSitePreviewLogo'
import type { PublicSiteConfig } from '@/shared/types/firmPublicSite'

const baseDraft = {
  theme: { logoStorageKey: null },
} as PublicSiteConfig

describe('resolvePublicSitePreviewLogoUrl', () => {
  it('usa logótipo das Definições quando não há override', () => {
    expect(resolvePublicSitePreviewLogoUrl(baseDraft, 'https://firm.test/logo.png')).toBe(
      'https://firm.test/logo.png',
    )
  })

  it('usa URL resolvida do tema quando há logoStorageKey', () => {
    const draft = {
      ...baseDraft,
      theme: { logoStorageKey: 'firm/x/logo.webp', logoUrl: 'https://signed.test/x' },
    } as PublicSiteConfig
    expect(resolvePublicSitePreviewLogoUrl(draft, 'https://firm.test/logo.png')).toBe('https://signed.test/x')
  })
})
