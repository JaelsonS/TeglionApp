import { describe, expect, it } from 'vitest'

import {
  heroBackgroundObjectPosition,
  heroBannerObjectPosition,
  heroPositionedImageStyle,
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

  it('heroPositionedImageStyle: zoom fino como nos serviços', () => {
    const style = heroPositionedImageStyle({
      imageFit: 'cover',
      imageFocusX: 30,
      imageFocusY: 70,
      imageZoom: 1.5,
    })
    expect(style.objectPosition).toBe('30% 70%')
    expect(String(style.transform)).toContain('scale(1.5)')
  })
})
