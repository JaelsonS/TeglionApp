import { describe, expect, it } from 'vitest'

import {
  normalizePublicSiteSectionsOrder,
  reindexPublicSiteSectionsOrder,
  reorderPublicSiteSections,
} from './publicSiteSectionOrder'
import type { PublicSiteSection } from '@/shared/types/firmPublicSite'

function fakeSection(type: PublicSiteSection['type'], order: number, key = `sec_${type}`): PublicSiteSection {
  return {
    key,
    type,
    enabled: true,
    order,
    content: {} as PublicSiteSection['content'],
  } as PublicSiteSection
}

describe('publicSiteSectionOrder', () => {
  it('normalize reorders disordered sections to visitor order', () => {
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

  it('reindex keeps user order', () => {
    const input = [fakeSection('contact', 2), fakeSection('hero', 0), fakeSection('faq', 1)]
    const out = reindexPublicSiteSectionsOrder(input)
    expect(out.map((s) => s.type)).toEqual(['hero', 'faq', 'contact'])
  })

  it('reorder moves middle section and pins header/footer', () => {
    const input = [
      fakeSection('header', 0),
      fakeSection('hero', 1),
      fakeSection('faq', 2),
      fakeSection('contact', 3),
      fakeSection('footer', 4),
    ]
    const moved = reorderPublicSiteSections(input, 'sec_faq', 'sec_hero')
    expect(moved.map((s) => s.type)).toEqual(['header', 'faq', 'hero', 'contact', 'footer'])

    const blockedHeader = reorderPublicSiteSections(input, 'sec_header', 'sec_faq')
    expect(blockedHeader.map((s) => s.type)).toEqual(['header', 'hero', 'faq', 'contact', 'footer'])

    const blockedOntoFooter = reorderPublicSiteSections(input, 'sec_hero', 'sec_footer')
    expect(blockedOntoFooter.map((s) => s.type)).toEqual(['header', 'hero', 'faq', 'contact', 'footer'])
  })
})
