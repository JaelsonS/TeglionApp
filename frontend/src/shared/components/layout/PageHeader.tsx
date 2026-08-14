/**
 * PageHeader — cabeçalho oficial Teglion (firm + portal).
 * Título + subtítulo explicativo + acções. Responsivo.
 */
import type { ReactNode } from 'react'

import { cn } from '@/shared/lib/utils'

export type PageHeaderProps = {
  title: string
  subtitle?: string
  /** @deprecated use subtitle */
  description?: string
  /** Acção principal / grupo de acções */
  right?: ReactNode
  /** @deprecated use right */
  actions?: ReactNode
  /** Acções secundárias (Guia, filtros) — à esquerda das primárias em desktop */
  secondary?: ReactNode
  className?: string
  testId?: string
}

export function PageHeader({
  title,
  subtitle,
  description,
  right,
  actions,
  secondary,
  className,
  testId = 'page-header',
}: PageHeaderProps) {
  const subtitleText = subtitle ?? description
  const actionsSlot = right ?? actions

  return (
    <header
      className={cn(
        'mb-4 flex min-w-0 flex-col gap-3 sm:mb-5 sm:flex-row sm:items-end sm:justify-between sm:gap-4',
        className,
      )}
    >
      <div className="min-w-0 flex-1">
        <h1
          data-testid={testId}
          className="text-balance break-words text-title font-semibold tracking-tight text-foreground sm:text-display"
        >
          {title}
        </h1>
        {subtitleText ? (
          <p
            data-testid={`${testId}-subtitle`}
            className="mt-1.5 max-w-3xl text-pretty text-body leading-relaxed text-muted-foreground"
          >
            {subtitleText}
          </p>
        ) : null}
      </div>
      {secondary || actionsSlot ? (
        <div className="flex w-full min-w-0 flex-col gap-2 sm:w-auto sm:max-w-[min(100%,32rem)] sm:flex-row sm:flex-wrap sm:items-center sm:justify-end">
          {secondary ? (
            <div className="flex flex-wrap items-center gap-2">{secondary}</div>
          ) : null}
          {actionsSlot ? (
            <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto sm:justify-end [&_button]:min-h-10 sm:[&_button]:min-h-0">
              {actionsSlot}
            </div>
          ) : null}
        </div>
      ) : null}
    </header>
  )
}
