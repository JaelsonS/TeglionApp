import { describe, expect, it } from 'vitest'

import {
  patchHeroContentAlign,
  patchSectionContentAlign,
  resolveHeroContentAlign,
  resolveSectionContentAlign,
} from '@/features/public-intake/publicSiteContentAlign'

describe('publicSiteContentAlign', () => {
  it('secções omitem esquerda; hero omite centro', () => {
    expect(resolveSectionContentAlign({})).toBe('left')
    expect(patchSectionContentAlign({}, 'left').contentAlign).toBeNull()
    expect(patchSectionContentAlign({}, 'center').contentAlign).toBe('center')

    expect(resolveHeroContentAlign({})).toBe('center')
    expect(patchHeroContentAlign({}, 'center').contentAlign).toBeNull()
    expect(patchHeroContentAlign({}, 'left').contentAlign).toBe('left')
  })
})
