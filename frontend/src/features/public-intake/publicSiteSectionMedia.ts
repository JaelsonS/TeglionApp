import type { ImagePosition } from '@/shared/components/media/ImagePositionEditor'
import type { PublicSiteSectionMediaFields } from '@/shared/types/firmPublicSite'

export function normalizeSectionImageFit(value: unknown): 'cover' | 'contain' {
  return value === 'contain' ? 'contain' : 'cover'
}

export function sectionContentImagePosition(content: PublicSiteSectionMediaFields): ImagePosition {
  return {
    focusX: content.imageFocusX ?? 50,
    focusY: content.imageFocusY ?? 50,
    zoom: content.imageZoom ?? 1,
  }
}

export function sectionBackgroundImagePosition(content: PublicSiteSectionMediaFields): ImagePosition {
  return {
    focusX: content.backgroundImageFocusX ?? 50,
    focusY: content.backgroundImageFocusY ?? 50,
    zoom: content.backgroundImageZoom ?? 1,
  }
}

export function sectionContentPositionedStyle(content: PublicSiteSectionMediaFields) {
  return {
    imageFocusX: content.imageFocusX,
    imageFocusY: content.imageFocusY,
    imageZoom: content.imageZoom,
    imageFit: normalizeSectionImageFit(content.imageFit),
  }
}

export function sectionBackgroundPositionedStyle(content: PublicSiteSectionMediaFields) {
  return {
    imageFocusX: content.backgroundImageFocusX,
    imageFocusY: content.backgroundImageFocusY,
    imageZoom: content.backgroundImageZoom,
    imageFit: 'cover' as const,
  }
}
