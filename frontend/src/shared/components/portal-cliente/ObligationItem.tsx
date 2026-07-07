import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'

import { StatusPill, type StatusPillVariant } from '@/shared/components/portal-cliente/StatusPill'
import { cn } from '@/shared/lib/utils'

export function ObligationItem({
  icon: Icon,
  title,
  dueLabel,
  statusLabel,
  statusVariant,
  responsible,
  actions,
  className,
}: {
  icon: LucideIcon
  title: string
  dueLabel: string
  statusLabel: string
  statusVariant: StatusPillVariant
  responsible: string
  actions?: ReactNode
  className?: string
}) {
  return (
    <li className={cn('pc-card p-4', className)}>
      <div className="flex flex-wrap items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] bg-muted text-primary">
          <Icon className="h-5 w-5" aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-semibold text-foreground">{title}</p>
            <StatusPill variant={statusVariant}>{statusLabel}</StatusPill>
          </div>
          <p className="mt-1 text-lg font-semibold tabular-nums text-foreground">{dueLabel}</p>
          <p className="mt-1 text-xs text-muted-foreground">Responsável: {responsible}</p>
          {actions ? <div className="mt-4 flex flex-wrap gap-2">{actions}</div> : null}
        </div>
      </div>
    </li>
  )
}
