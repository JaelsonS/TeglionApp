import { describe, expect, it } from 'vitest'

import { normalizePublicSiteSectionsOrder } from './publicSiteSectionOrder'
import type { PublicSiteSection } from '@/shared/types/firmPublicSite'

function fakeSection(type: PublicSiteSection['type'], order: number): PublicSiteSection {
  return {
    key: `sec_${type}`,
    type,
    enabled: true,
    order,
    content: {} as PublicSiteSection['content'],
  } as PublicSiteSection
}

describe('normalizePublicSiteSectionsOrder', () => {
  it('reorders disordered sections to visitor order', () => {
    const input = [
      fakeSection('footer', 0),
      fakeSection('hero', 1),
      fakeSection('header', 2),
      fakeSection('contact', 3),
    ]
    const out = normalizePublicSiteSectionsOrder(input)
    expect(out.map((s) => s.type)).toEqual(['header', 'hero', 'contact', 'footer'])
    expect(out.map((s) => s.order)).toEqual([0, 1, 2, 3])
  })
})
