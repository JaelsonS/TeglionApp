import { describe, expect, it } from 'vitest'

import {
  heroBackgroundObjectPosition,
  heroBannerObjectPosition,
  normalizeHeroImageFit,
  normalizeHeroImageFocus,
  normalizeHeroImagePosition,
} from './heroBannerFit'

describe('heroBannerFit', () => {
  it('defaults missing fit to cover (páginas existentes)', () => {
    expect(normalizeHeroImageFit(undefined)).toBe('cover')
    expect(normalizeHeroImageFit(null)).toBe('cover')
    expect(normalizeHeroImageFit('cover')).toBe('cover')
    expect(normalizeHeroImageFit('contain')).toBe('contain')
    expect(normalizeHeroImageFit('stretch')).toBe('cover')
  })

  it('defaults missing focus to center', () => {
    expect(normalizeHeroImageFocus(undefined)).toBe('center')
    expect(normalizeHeroImageFocus('top-left')).toBe('top-left')
    expect(normalizeHeroImageFocus('bottom-right')).toBe('bottom-right')
    expect(normalizeHeroImageFocus('left')).toBe('center-left')
    expect(normalizeHeroImagePosition('top')).toBe('top')
    expect(normalizeHeroImagePosition('left')).toBe('center')
  })

  it('maps focus to CSS object-position', () => {
    expect(heroBackgroundObjectPosition('center')).toBe('center')
    expect(heroBackgroundObjectPosition('top')).toBe('center top')
    expect(heroBackgroundObjectPosition('bottom-right')).toBe('right bottom')
    expect(heroBannerObjectPosition('bottom')).toBe('center bottom')
  })
})
