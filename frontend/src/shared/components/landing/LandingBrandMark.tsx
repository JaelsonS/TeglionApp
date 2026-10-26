import { Link } from 'react-router-dom'

import { BRAND } from '@/shared/config/brand'
import { cn } from '@/shared/lib/utils'

type Props = {
  /** Variante para fundo escuro (hero / header transparente). */
  onDark?: boolean
  className?: string
}

/**
 * Marca Teglion em HTML — evita invert no SVG (que destroça o wordmark navy).
 */
export function LandingBrandMark({ onDark = false, className }: Props) {
  return (
    <Link
      to="/"
      className={cn('inline-flex shrink-0 items-center gap-2.5', className)}
      aria-label={BRAND.name}
    >
      <span
        className={cn(
          'flex h-9 w-9 items-center justify-center rounded-[10px] text-[11px] font-bold tracking-tight',
          onDark
            ? 'bg-[var(--landing-gold)] text-[#061428]'
            : 'bg-[var(--landing-navy)] text-[var(--landing-gold)]',
        )}
      >
        {BRAND.initials}
      </span>
      <span
        className={cn(
          'text-[1.15rem] font-bold tracking-tight',
          onDark ? 'text-white' : 'text-[var(--landing-navy)]',
        )}
        style={{ fontFamily: 'var(--landing-font-sans)' }}
      >
        {BRAND.name}
      </span>
    </Link>
  )
}
