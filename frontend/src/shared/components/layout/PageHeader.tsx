/**
 * PageHeader.tsx
 * 
 * Cabeçalho padrão de páginas internas.
 */

import React from 'react'

export function PageHeader({
  title,
  subtitle,
  /** @deprecated use subtitle */
  description,
  right,
  /** @deprecated use right */
  actions,
  testId = 'page-header',
}: {
  title: string
  subtitle?: string
  description?: string
  right?: React.ReactNode
  actions?: React.ReactNode
  testId?: string
}) {
  const subtitleText = subtitle ?? description
  const actionsSlot = right ?? actions

  return (
    <div className="cb-page-header mb-3 flex min-w-0 flex-col gap-2 sm:flex-row sm:items-end sm:justify-between sm:gap-3">
      <div className="min-w-0 flex-1">
        <h1
          data-testid={testId}
          className="text-balance break-words text-xl font-semibold tracking-tight text-foreground sm:text-2xl xl:text-[1.65rem]"
        >
          {title}
        </h1>
        {subtitleText ? (
          <p
            data-testid={`${testId}-subtitle`}
            className="mt-1.5 max-w-3xl text-pretty text-sm leading-relaxed text-muted-foreground"
          >
            {subtitleText}
          </p>
        ) : null}
      </div>
      {actionsSlot ? (
        <div className="flex w-full min-w-0 flex-shrink-0 flex-wrap items-center justify-start gap-2 sm:w-auto sm:max-w-[min(100%,28rem)] sm:justify-end">
          {actionsSlot}
        </div>
      ) : null}
    </div>
  )
}
