import { PublicSiteHeroSurface } from '@/features/public-intake/PublicSiteHeroSurface'
import type {
  PublicSiteHeroImageFit,
  PublicSiteHeroImageFocus,
} from '@/features/public-intake/heroBannerFit'
import { normalizeHeroImageFocus } from '@/features/public-intake/heroBannerFit'

type Props = {
  src: string
  alt: string
  fit?: PublicSiteHeroImageFit | null
  /** Foco da imagem (9 posições). Aceita valores antigos top/center/bottom. */
  position?: PublicSiteHeroImageFocus | string | null
  backgroundColor?: string | null
  backgroundOverlay?: number | null
  className?: string
}

/**
 * Preview do destaque no editor — mesma superfície que a página pública, altura compacta.
 */
export function PublicSiteHeroBanner({
  src,
  alt,
  fit,
  position,
  backgroundColor,
  backgroundOverlay,
  className,
}: Props) {
  return (
    <PublicSiteHeroSurface
      variant="preview"
      imageUrl={src}
      imageAlt={alt}
      fit={fit}
      focus={normalizeHeroImageFocus(position)}
      backgroundColor={backgroundColor}
      backgroundOverlay={backgroundOverlay}
      className={className}
    >
      <p className="text-xs font-medium text-white/90 drop-shadow-sm">Pré-visualização do destaque</p>
      <p className="mt-1 text-[11px] text-white/75 drop-shadow-sm">
        O título e a frase aparecem por cima desta imagem na página publicada.
      </p>
    </PublicSiteHeroSurface>
  )
}
