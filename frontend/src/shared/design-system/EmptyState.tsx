import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'

import { cn } from '@/shared/lib/utils'

type EmptyStateProps = {
  title: string
  description?: string
  action?: ReactNode
  testId?: string
  icon?: LucideIcon
  className?: string
  children?: ReactNode
}

export function EmptyState({
  title,
  description,
  action,
  testId = 'empty-state',
  icon: Icon,
  className,
  children,
}: EmptyStateProps) {
  if (Icon) {
    return (
      <div
        data-testid={testId}
        className={cn(
          'flex flex-col items-center justify-center rounded-2xl border border-dashed border-border/60 bg-gradient-to-b from-muted/15 to-card px-6 py-12 text-center',
          className,
        )}
      >
        <Icon className="h-10 w-10 text-muted-foreground/60" />
        <h3 className="mt-4 text-base font-semibold text-foreground">{title}</h3>
        {description ? <p className="mt-2 max-w-sm text-sm text-muted-foreground">{description}</p> : null}
        {children ? <div className="mt-6">{children}</div> : null}
        {action ? <div className="mt-6">{action}</div> : null}
      </div>
    )
  }

  return (
    <div
      data-testid={testId}
      className={cn(
        'rounded-2xl border border-dashed border-border/70 bg-muted/30 p-8 text-center',
        className,
      )}
    >
      <div className="text-sm font-semibold text-foreground">{title}</div>
      {description ? <div className="mt-2 text-sm text-muted-foreground">{description}</div> : null}
      {action ? <div className="mt-5 flex justify-center">{action}</div> : null}
      {children ? <div className="mt-5">{children}</div> : null}
    </div>
  )
}
