import type { ReactNode } from 'react'

import { cn } from '@/shared/lib/utils'

/** Páginas split (documentos, tarefas, obrigações, alertas, mensagens) — altura fixa; scroll só nas colunas. */
export function FirmWorkspacePage({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return <div className={cn('cb-firm-workspace-page', className)}>{children}</div>
}

/** Páginas com scroll vertical natural (dashboard, agenda, CRM). */
export function FirmScrollPage({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return <div className={cn('cb-firm-scroll-page min-h-0 flex-1', className)}>{children}</div>
}

export function FirmSplitHost({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return <div className={cn('cb-firm-split-host', className)}>{children}</div>
}

export function FirmSplitColumn({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return <div className={cn('cb-firm-split-column', className)}>{children}</div>
}

export function FirmSplitHeader({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return <div className={cn('cb-firm-split-header', className)}>{children}</div>
}

export function FirmSplitBody({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return <div className={cn('cb-firm-split-body', className)}>{children}</div>
}
