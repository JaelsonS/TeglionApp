import type { ReactNode } from 'react'

import { cn } from '@/shared/lib/utils'

const variants = {
  default: 'bg-primary/10 text-primary ring-1 ring-primary/20',
  success: 'bg-emerald-50 text-emerald-800 ring-1 ring-emerald-200/80',
  warning: 'bg-amber-50 text-amber-900 ring-1 ring-amber-200/80',
  danger: 'bg-red-50 text-red-800 ring-1 ring-red-200/80',
  muted: 'bg-muted text-muted-foreground ring-1 ring-border',
} as const

export function Badge({
  children,
  variant = 'default',
  className,
}: {
  children: ReactNode
  variant?: keyof typeof variants
  className?: string
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-caption font-semibold uppercase tracking-wide',
        variants[variant],
        className,
      )}
    >
      {children}
    </span>
  )
}
