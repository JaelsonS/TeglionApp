import { cn } from '@/shared/lib/utils'

type LandingScreenshotProps = {
  src: string
  alt: string
  className?: string
  priority?: boolean
}

/** Moldura fixa 16:10 — evita capturas com alturas desiguais no carrossel. */
export function LandingScreenshot({ src, alt, className, priority }: LandingScreenshotProps) {
  return (
    <div
      className={cn(
        'landing-screenshot-wrap overflow-hidden rounded-[14px] border border-[#E2E8F0] bg-[#F0F4F8] shadow-[0_1px_2px_rgba(0,0,0,0.04),0_16px_40px_rgba(11,58,110,0.1)]',
        className,
      )}
    >
      <div className="landing-screenshot-frame">
        <img
          src={src}
          alt={alt}
          className="landing-screenshot-img"
          loading={priority ? 'eager' : 'lazy'}
          decoding="async"
          draggable={false}
        />
      </div>
    </div>
  )
}
