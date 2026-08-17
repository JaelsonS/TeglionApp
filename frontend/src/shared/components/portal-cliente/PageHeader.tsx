import type { ReactNode } from 'react'

import { cn } from '@/shared/lib/utils'

/**
 * Cabeçalho de conteúdo do portal cliente.
 * O título visível fica só na barra de cima do shell — aqui o H1 é para leitores
 * de ecrã; no conteúdo ficam o subtítulo e as acções (Maya, etc.).
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
  const hasBody = Boolean(subtitle || actions || breadcrumb)

  return (
    <div className={cn(hasBody ? 'mb-4 md:mb-6' : undefined, className)}>
      <h1 className="sr-only" data-testid="client-page-header">
        {title}
      </h1>
      {hasBody ? (
        <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            {breadcrumb ? (
              <p className="cb-text-label mb-1 text-muted-foreground">{breadcrumb}</p>
            ) : null}
            {subtitle ? (
              <p
                data-testid="client-page-header-subtitle"
                className="max-w-3xl text-pretty text-sm leading-relaxed text-muted-foreground"
              >
                {subtitle}
              </p>
            ) : null}
          </div>
          {actions ? (
            <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto sm:justify-end">
              {actions}
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}
