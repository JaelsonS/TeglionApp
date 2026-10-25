import type { ReactNode } from 'react'

import { cn } from '@/shared/lib/utils'

/**
 * Cabeçalho do portal cliente — alinhado ao PageHeader do firm (título visível + propósito).
 */
export function PageHeader({
  title,
  subtitle,
  breadcrumb,
  actions,
  className,
}: {
  title: string
  subtitle?: string
  breadcrumb?: string
  actions?: ReactNode
  className?: string
}) {
  return (
    <header
      className={cn(
        'mb-4 flex min-w-0 flex-col gap-3 sm:mb-5 sm:flex-row sm:items-end sm:justify-between sm:gap-4',
        className,
      )}
      data-testid="client-page-header"
    >
      <div className="min-w-0 flex-1">
        {breadcrumb ? (
          <p className="cb-text-label mb-1 text-muted-foreground">{breadcrumb}</p>
        ) : null}
        <h1 className="text-balance break-words text-title font-semibold tracking-tight text-foreground sm:text-display">
          {title}
        </h1>
        {subtitle ? (
          <p
            data-testid="client-page-header-subtitle"
            className="mt-1.5 max-w-3xl text-pretty text-body leading-relaxed text-muted-foreground"
          >
            {subtitle}
          </p>
        ) : null}
      </div>
      {actions ? (
        <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto sm:justify-end">{actions}</div>
      ) : null}
    </header>
  )
}
