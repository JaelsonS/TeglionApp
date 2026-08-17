/**
 * Enquadramento do banner da Página Pública.
 * Editor e página pública usam os mesmos defaults — o preview não pode divergir.
 *
 * `cover` (Preencher) — preenche a faixa 16:9; pode cortar bordas (fotos).
 * `contain` (Mostrar tudo) — imagem inteira; a cor de fundo preenche o resto.
 */

export const PUBLIC_SITE_HERO_ASPECT_RATIO = '16 / 9'

export type PublicSiteHeroImageFit = 'cover' | 'contain'
export type PublicSiteHeroImagePosition = 'center' | 'top' | 'bottom'

export function normalizeHeroImageFit(value: unknown): PublicSiteHeroImageFit {
  return value === 'contain' ? 'contain' : 'cover'
}

export function normalizeHeroImagePosition(value: unknown): PublicSiteHeroImagePosition {
  if (value === 'top' || value === 'bottom' || value === 'center') return value
  return 'center'
}

export function heroBannerObjectPosition(position: PublicSiteHeroImagePosition): string {
  if (position === 'top') return 'center top'
  if (position === 'bottom') return 'center bottom'
  return 'center'
}
