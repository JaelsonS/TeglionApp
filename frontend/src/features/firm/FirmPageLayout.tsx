import type { ReactNode } from 'react'

import { cn } from '@/shared/lib/utils'

/**
 * Páginas de workspace (tarefas, obrigações, alertas, mensagens).
 * Documentos usa `cb-docs-layout-page` → scroll único no content-wrap.
 */
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
