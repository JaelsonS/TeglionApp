import {
  PUBLIC_SITE_HERO_ASPECT_RATIO,
  heroBannerObjectPosition,
  normalizeHeroImageFit,
  normalizeHeroImagePosition,
  type PublicSiteHeroImageFit,
  type PublicSiteHeroImagePosition,
} from '@/features/public-intake/publicSiteHeroBanner'

type Props = {
  src: string
  alt: string
  fit?: PublicSiteHeroImageFit | null
  position?: PublicSiteHeroImagePosition | null
  backgroundColor?: string | null
  className?: string
}

/**
 * Única renderização do banner — Página Pública e preview do editor.
 * Proporção fixa 16:9 (não `h-48` + `object-cover`, que cortava de novo).
 */
export function PublicSiteHeroBanner({ src, alt, fit, position, backgroundColor, className }: Props) {
  const resolvedFit = normalizeHeroImageFit(fit)
  const resolvedPosition = normalizeHeroImagePosition(position)
  const bg = /^#[0-9a-f]{6}$/i.test(String(backgroundColor || '').trim())
    ? String(backgroundColor).trim()
    : '#e8f0ec'

  return (
    <div
      className={className}
      data-testid="public-site-hero-banner"
      data-fit={resolvedFit}
      data-position={resolvedPosition}
      style={{
        aspectRatio: PUBLIC_SITE_HERO_ASPECT_RATIO,
        backgroundColor: bg,
        overflow: 'hidden',
        width: '100%',
      }}
    >
      <img
        src={src}
        alt={alt}
        className="h-full w-full"
        style={{
          objectFit: resolvedFit === 'contain' ? 'contain' : 'cover',
          objectPosition: heroBannerObjectPosition(resolvedPosition),
        }}
      />
    </div>
  )
}
