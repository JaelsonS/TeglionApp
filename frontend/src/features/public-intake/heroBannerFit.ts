/**
 * Enquadramento do destaque principal (imagem de fundo).
 * Editor e página pública usam os mesmos defaults — o preview não diverge.
 */

import type { CSSProperties } from 'react'

import { servicePositionedImageStyle } from '@/shared/utils/servicePositionedImageStyle'

export type PublicSiteHeroImageFit = 'cover' | 'contain'

/** @deprecated Use PublicSiteHeroImageFocus — mantido para leitura de valores antigos. */
export type PublicSiteHeroImagePosition = 'center' | 'top' | 'bottom'

export type PublicSiteHeroImageFocus =
  | 'top-left'
  | 'top'
  | 'top-right'
  | 'center-left'
  | 'center'
  | 'center-right'
  | 'bottom-left'
  | 'bottom'
  | 'bottom-right'

const FOCUS_SET = new Set<string>([
  'top-left',
  'top',
  'top-right',
  'center-left',
  'center',
  'center-right',
  'bottom-left',
  'bottom',
  'bottom-right',
])

/** Proporção só para mini-previews legados; o hero público usa altura mínima, não 16:9 fixo. */
export const PUBLIC_SITE_HERO_ASPECT_RATIO = '16 / 9'

export function normalizeHeroImageFit(value: unknown): PublicSiteHeroImageFit {
  return value === 'contain' ? 'contain' : 'cover'
}

export function normalizeHeroImageFocus(value: unknown): PublicSiteHeroImageFocus {
  const v = String(value || '').trim()
  if (FOCUS_SET.has(v)) return v as PublicSiteHeroImageFocus
  if (v === 'left') return 'center-left'
  if (v === 'right') return 'center-right'
  if (v === 'top' || v === 'bottom') return v
  return 'center'
}

/** Compat: editor/tests antigos. */
export function normalizeHeroImagePosition(value: unknown): PublicSiteHeroImagePosition {
  const focus = normalizeHeroImageFocus(value)
  if (focus === 'top') return 'top'
  if (focus === 'bottom') return 'bottom'
  return 'center'
}

export function heroBackgroundObjectPosition(focus: PublicSiteHeroImageFocus): string {
  const map: Record<PublicSiteHeroImageFocus, string> = {
    'top-left': 'left top',
    top: 'center top',
    'top-right': 'right top',
    'center-left': 'left center',
    center: 'center',
    'center-right': 'right center',
    'bottom-left': 'left bottom',
    bottom: 'center bottom',
    'bottom-right': 'right bottom',
  }
  return map[focus] ?? 'center'
}

/** @deprecated Preferir heroBackgroundObjectPosition */
export function heroBannerObjectPosition(position: PublicSiteHeroImagePosition): string {
  return heroBackgroundObjectPosition(normalizeHeroImageFocus(position))
}

export const HERO_IMAGE_FOCUS_OPTIONS: { value: PublicSiteHeroImageFocus; label: string }[] = [
  { value: 'top-left', label: '↖' },
  { value: 'top', label: '↑' },
  { value: 'top-right', label: '↗' },
  { value: 'center-left', label: '←' },
  { value: 'center', label: '●' },
  { value: 'center-right', label: '→' },
  { value: 'bottom-left', label: '↙' },
  { value: 'bottom', label: '↓' },
  { value: 'bottom-right', label: '↘' },
]

const FOCUS_PRESET_PERCENT: Record<PublicSiteHeroImageFocus, { x: number; y: number }> = {
  'top-left': { x: 12, y: 12 },
  top: { x: 50, y: 12 },
  'top-right': { x: 88, y: 12 },
  'center-left': { x: 12, y: 50 },
  center: { x: 50, y: 50 },
  'center-right': { x: 88, y: 50 },
  'bottom-left': { x: 12, y: 88 },
  bottom: { x: 50, y: 88 },
  'bottom-right': { x: 88, y: 88 },
}

export function heroFocusPresetToPercents(focus: PublicSiteHeroImageFocus): { x: number; y: number } {
  return FOCUS_PRESET_PERCENT[focus] ?? FOCUS_PRESET_PERCENT.center
}

export function heroEditorImagePosition(content: {
  imageFocusX?: number | null
  imageFocusY?: number | null
  imageZoom?: number | null
  imagePosition?: unknown
}): { focusX: number; focusY: number; zoom: number } {
  const hasFine =
    content.imageFocusX != null ||
    content.imageFocusY != null ||
    (content.imageZoom != null && Number(content.imageZoom) !== 1)
  if (hasFine) {
    return {
      focusX: content.imageFocusX ?? 50,
      focusY: content.imageFocusY ?? 50,
      zoom: content.imageZoom ?? 1,
    }
  }
  const preset = heroFocusPresetToPercents(normalizeHeroImageFocus(content.imagePosition))
  return { focusX: preset.x, focusY: preset.y, zoom: 1 }
}

/** Altura do hero no editor (enquadramento + preview lateral) — mesma proporção visual. */
export const PUBLIC_SITE_HERO_EDITOR_FRAME_CLASS =
  'min-h-[360px] w-full sm:min-h-[400px]'

export function heroPositionedImageStyle(content: {
  imageFit?: unknown
  imagePosition?: unknown
  imageFocusX?: number | null
  imageFocusY?: number | null
  imageZoom?: number | null
}): CSSProperties {
  const fit = normalizeHeroImageFit(content.imageFit)
  const { focusX, focusY, zoom } = heroEditorImagePosition(content)
  return servicePositionedImageStyle({
    imageFocusX: focusX,
    imageFocusY: focusY,
    imageZoom: zoom,
    imageFit: fit,
  })
}
