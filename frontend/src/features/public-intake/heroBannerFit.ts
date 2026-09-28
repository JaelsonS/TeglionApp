/**
 * Enquadramento do destaque principal (imagem de fundo).
 * Editor e página pública usam os mesmos defaults — o preview não diverge.
 */

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
