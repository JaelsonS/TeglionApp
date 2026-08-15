import { describe, expect, it } from 'vitest'

import { applyPageBackgroundColor, clearSectionBackgroundColors, parsePublicSiteHex } from './publicSitePageBackground'
import type { PublicSiteConfig, PublicSiteSection } from '@/shared/types/firmPublicSite'

function fakeSection(type: PublicSiteSection['type'], bg: string | null): PublicSiteSection {
  return {
    key: `sec_${type}`,
    type,
    enabled: true,
    order: 0,
    content: { backgroundColor: bg },
  } as PublicSiteSection
}

describe('publicSitePageBackground', () => {
  it('parses hex colors', () => {
    expect(parsePublicSiteHex('#d61f1f')).toBe('#d61f1f')
    expect(parsePublicSiteHex('AABBCC')).toBe('#aabbcc')
    expect(parsePublicSiteHex('nope')).toBeNull()
  })

  it('clears section backgrounds', () => {
    const out = clearSectionBackgroundColors([
      fakeSection('hero', '#e8f0ec'),
      fakeSection('header', null),
    ])
    expect((out[0].content as { backgroundColor: string | null }).backgroundColor).toBeNull()
    expect((out[1].content as { backgroundColor: string | null }).backgroundColor).toBeNull()
  })

  it('applyPageBackgroundColor clears covering section backgrounds', () => {
    const draft = {
      theme: { backgroundColor: null },
      sections: [fakeSection('hero', '#f5f5f5'), fakeSection('about', '#ffffff')],
    } as PublicSiteConfig
    const next = applyPageBackgroundColor(draft, '#d61f1f')
    expect(next.theme.backgroundColor).toBe('#d61f1f')
    expect(next.sections.every((s) => !(s.content as { backgroundColor?: string | null }).backgroundColor)).toBe(
      true,
    )
  })
})
