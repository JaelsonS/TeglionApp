import type { ReactNode } from 'react'

import { cn } from '@/shared/lib/utils'

export type StatusPillVariant =
  | 'pending'
  | 'in_review'
  | 'done'
  | 'overdue'
  | 'submitted'
  | 'neutral'

const VARIANTS: Record<StatusPillVariant, string> = {
  pending: 'bg-amber-500/10 text-amber-900 ring-amber-500/20 dark:text-amber-200',
  in_review: 'bg-primary/10 text-primary ring-primary/20',
  done: 'bg-emerald-500/10 text-emerald-800 ring-emerald-500/20 dark:text-emerald-200',
  overdue: 'bg-destructive/10 text-destructive ring-destructive/20',
  submitted: 'bg-primary/10 text-primary ring-primary/20',
  neutral: 'bg-muted text-muted-foreground ring-border',
}

/** Pill de estado alinhada com tokens do design system. */
export function StatusPill({
  variant,
  children,
  className,
}: {
  variant: StatusPillVariant
  children: ReactNode
  className?: string
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-caption font-semibold uppercase tracking-wide ring-1 ring-inset',
        VARIANTS[variant],
        className,
      )}
    >
      {children}
    </span>
  )
}
