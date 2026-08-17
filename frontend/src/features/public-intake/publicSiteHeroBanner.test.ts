import { describe, expect, it } from 'vitest'

import {
  PUBLIC_SITE_HERO_ASPECT_RATIO,
  heroBannerObjectPosition,
  normalizeHeroImageFit,
  normalizeHeroImagePosition,
} from './publicSiteHeroBanner'

describe('publicSiteHeroBanner', () => {
  it('defaults missing fit to cover (páginas existentes)', () => {
    expect(normalizeHeroImageFit(undefined)).toBe('cover')
    expect(normalizeHeroImageFit(null)).toBe('cover')
    expect(normalizeHeroImageFit('cover')).toBe('cover')
    expect(normalizeHeroImageFit('contain')).toBe('contain')
    expect(normalizeHeroImageFit('stretch')).toBe('cover')
  })

  it('defaults missing position to center', () => {
    expect(normalizeHeroImagePosition(undefined)).toBe('center')
    expect(normalizeHeroImagePosition('top')).toBe('top')
    expect(normalizeHeroImagePosition('bottom')).toBe('bottom')
    expect(normalizeHeroImagePosition('left')).toBe('center')
  })

  it('maps focus to CSS object-position', () => {
    expect(heroBannerObjectPosition('center')).toBe('center')
    expect(heroBannerObjectPosition('top')).toBe('center top')
    expect(heroBannerObjectPosition('bottom')).toBe('center bottom')
  })

  it('keeps a single 16:9 aspect for editor and public page', () => {
    expect(PUBLIC_SITE_HERO_ASPECT_RATIO).toBe('16 / 9')
  })
})
