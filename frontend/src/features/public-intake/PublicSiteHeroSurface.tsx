import type { CSSProperties, ReactNode } from 'react'

import {
  heroPositionedImageStyle,
  normalizeHeroImageFit,
  PUBLIC_SITE_HERO_EDITOR_FRAME_CLASS,
  type PublicSiteHeroImageFit,
  type PublicSiteHeroImageFocus,
} from '@/features/public-intake/heroBannerFit'

type Props = {
  imageUrl?: string | null
  imageAlt?: string
  fit?: PublicSiteHeroImageFit | null
  focus?: PublicSiteHeroImageFocus | null
  imageFocusX?: number | null
  imageFocusY?: number | null
  imageZoom?: number | null
  /** Cor sólida quando não há foto, ou por baixo da foto em modo contain. */
  backgroundColor?: string | null
  /** 0–80: escurece o fundo para o texto destacar. */
  backgroundOverlay?: number | null
  children: ReactNode
  /** Editor: preview compacto. Página pública: altura generosa. */
  variant?: 'public' | 'preview'
  className?: string
}

function resolveBgHex(color?: string | null): string | undefined {
  const v = String(color || '').trim()
  return /^#[0-9a-f]{6}$/i.test(v) ? v : undefined
}

function normalizeOverlay(value: unknown): number {
  const n = Number(value)
  if (!Number.isFinite(n)) return 42
  return Math.min(80, Math.max(0, Math.round(n)))
}

/**
 * Destaque principal: imagem de fundo atrás do texto (não faixa gigante acima).
 * Partilhado entre editor e página pública.
 */
export function PublicSiteHeroSurface({
  imageUrl,
  imageAlt = '',
  fit,
  focus,
  imageFocusX,
  imageFocusY,
  imageZoom,
  backgroundColor,
  backgroundOverlay,
  children,
  variant = 'public',
  className = '',
}: Props) {
  const resolvedFit = normalizeHeroImageFit(fit)
  const bgHex = resolveBgHex(backgroundColor) ?? '#e8f0ec'
  const overlay = normalizeOverlay(backgroundOverlay)
  const hasImage = Boolean(imageUrl)

  const minHeight =
    variant === 'preview'
      ? PUBLIC_SITE_HERO_EDITOR_FRAME_CLASS
      : 'min-h-[min(52vh,520px)] sm:min-h-[min(58vh,560px)]'

  const imageStyle: CSSProperties = heroPositionedImageStyle({
    imageFit: fit,
    imagePosition: focus,
    imageFocusX,
    imageFocusY,
    imageZoom,
  })

  return (
    <section
      className={`relative overflow-hidden border-b border-black/5 ${minHeight} ${className}`}
      style={{ backgroundColor: bgHex }}
      data-testid="public-site-hero-surface"
      data-fit={resolvedFit}
    >
      {hasImage ? (
        <>
          <img
            src={imageUrl!}
            alt={imageAlt}
            className="absolute inset-0 h-full w-full"
            style={imageStyle}
          />
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0"
            style={{ backgroundColor: `rgba(15, 23, 42, ${overlay / 100})` }}
          />
        </>
      ) : null}
      <div className="relative z-10 flex h-full flex-col items-center justify-center px-4 py-12 text-center sm:py-16 lg:max-w-none">
        <div className="mx-auto w-full max-w-2xl lg:max-w-4xl">{children}</div>
      </div>
    </section>
  )
}

export { normalizeOverlay as normalizeHeroBackgroundOverlay }
