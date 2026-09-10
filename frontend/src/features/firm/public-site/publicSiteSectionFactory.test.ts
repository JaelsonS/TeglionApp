import { describe, expect, it } from 'vitest'

import { ADDABLE_SECTION_TYPES, addOrEnablePublicSiteSection, moveItemInArray } from './publicSiteSectionFactory'
import type { PublicSiteSection } from '@/shared/types/firmPublicSite'

describe('publicSiteSectionFactory', () => {
  const base = (): PublicSiteSection[] => [
    { key: 'h', type: 'header', enabled: true, order: 0, content: {} },
    { key: 's', type: 'services', enabled: false, order: 1, content: { heading: '', mode: 'auto' } },
    { key: 'f', type: 'footer', enabled: true, order: 2, content: {} },
  ]

  it('exposes addable section types including consultorias', () => {
    expect(ADDABLE_SECTION_TYPES).toContain('services')
    expect(ADDABLE_SECTION_TYPES).toContain('faq')
  })

  it('re-enables a disabled services section', () => {
    const result = addOrEnablePublicSiteSection(base(), 'services')
    expect('error' in result).toBe(false)
    if ('error' in result) return
    expect(result.created).toBe(false)
    expect(result.sections.find((s) => s.key === 's')?.enabled).toBe(true)
  })

  it('duplicates features when already enabled', () => {
    const sections: PublicSiteSection[] = [
      { key: 'feat', type: 'features', enabled: true, order: 0, content: { items: [] } },
    ]
    const result = addOrEnablePublicSiteSection(sections, 'features')
    expect('error' in result).toBe(false)
    if ('error' in result) return
    expect(result.created).toBe(true)
    expect(result.sections.filter((s) => s.type === 'features')).toHaveLength(2)
  })

  it('moveItemInArray reorders', () => {
    expect(moveItemInArray(['a', 'b', 'c'], 2, 0)).toEqual(['c', 'a', 'b'])
  })
})
