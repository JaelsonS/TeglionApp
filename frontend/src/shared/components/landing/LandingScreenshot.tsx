import { cn } from '@/shared/lib/utils'

type LandingScreenshotProps = {
  src: string
  alt: string
  className?: string
  priority?: boolean
}

export function LandingScreenshot({ src, alt, className, priority }: LandingScreenshotProps) {
  return (
    <div
      className={cn(
        'overflow-hidden rounded-[14px] border border-[#E2E8F0] bg-white shadow-[0_1px_2px_rgba(0,0,0,0.04),0_16px_40px_rgba(15,41,66,0.1)]',
        className,
      )}
    >
      <img
        src={src}
        alt={alt}
        className="block h-auto w-full"
        loading={priority ? 'eager' : 'lazy'}
        decoding="async"
        draggable={false}
      />
    </div>
  )
}
