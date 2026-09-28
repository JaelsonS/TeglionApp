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

/** Mesmas dimensões no editor e na página publicada (PublicSiteSectionLayout). */
export function sectionContentFramingFrameClass(content: PublicSiteSectionMediaFields): string {
  const placement =
    content.imagePlacement === 'left' || content.imagePlacement === 'right' ? content.imagePlacement : 'above'
  const size = content.imageSize === 'sm' || content.imageSize === 'md' || content.imageSize === 'lg' ? content.imageSize : 'full'
  const sizeClass = {
    sm: 'max-w-[8rem] min-h-[8rem]',
    md: 'max-w-[12rem] min-h-[12rem]',
    lg: 'max-w-[18rem] min-h-[16rem]',
    full: 'w-full min-h-[12rem]',
  }[size]
  const widthClass = placement === 'above' ? 'w-full' : 'w-full max-w-[18rem]'
  return `${sizeClass} ${widthClass}`
}

export function sectionBackgroundFramingFrameClass(): string {
  return 'aspect-[16/9] w-full min-h-[160px]'
}
