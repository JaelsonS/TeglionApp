import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'

import { cn } from '@/shared/lib/utils'

export type EmptyStateProps = {
  title: string
  /** Explica o quê / porquê / próximo passo */
  description?: string
  /** CTA principal */
  action?: ReactNode
  /** CTA secundário */
  secondaryAction?: ReactNode
  testId?: string
  icon?: LucideIcon
  className?: string
  children?: ReactNode
}

/**
 * Empty state oficial — título + contexto + CTA.
 * Evitar "Nenhum resultado" sem explicação.
 */
export function EmptyState({
  title,
  description,
  action,
  secondaryAction,
  testId = 'empty-state',
  icon: Icon,
  className,
  children,
}: EmptyStateProps) {
  return (
    <div
      data-testid={testId}
      className={cn(
        'flex flex-col items-center justify-center rounded-xl border border-dashed border-border/70 bg-muted/20 px-6 py-12 text-center',
        className,
      )}
    >
      {Icon ? (
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-brand/5 text-muted-foreground">
          <Icon className="h-5 w-5" aria-hidden />
        </div>
      ) : null}
      <h3 className={cn('text-base font-semibold text-foreground', Icon && 'mt-4')}>{title}</h3>
      {description ? (
        <p className="mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">{description}</p>
      ) : null}
      {children ? <div className="mt-4 w-full max-w-md">{children}</div> : null}
      {action || secondaryAction ? (
        <div className="mt-6 flex w-full max-w-sm flex-col items-stretch gap-2 sm:max-w-none sm:flex-row sm:items-center sm:justify-center">
          {action}
          {secondaryAction}
        </div>
      ) : null}
    </div>
  )
}
