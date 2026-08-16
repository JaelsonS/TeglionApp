import type { ButtonHTMLAttributes, ReactNode } from 'react'

import { cn } from '@/shared/lib/utils'

export type ChipProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  selected?: boolean
  children: ReactNode
}

/** Chip / intent pill — Maya e filtros leves */
export function Chip({ selected, className, children, type = 'button', ...props }: ChipProps) {
  return (
    <button
      type={type}
      className={cn(
        'inline-flex min-h-10 items-center rounded-full border px-3.5 py-2 text-sm font-medium transition-colors',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:ring-offset-2',
        selected
          ? 'border-brand bg-brand text-white hover:bg-brand/90 hover:text-white'
          : 'border-border bg-card text-foreground hover:border-brand/25 hover:bg-brand/5',
        className,
      )}
      aria-pressed={selected}
      {...props}
    >
      {children}
    </button>
  )
}
