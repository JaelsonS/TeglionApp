import { AlertTriangle, Building2, ShieldOff, Users } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

import { cn } from '@/shared/lib/utils'

export type ClientsKpiId = 'active' | 'attention' | 'portal' | 'total'

export type ClientsKpi = {
  id: ClientsKpiId
  label: string
  value: number
  tone?: 'brand' | 'amber' | 'emerald' | 'rose' | 'muted'
  icon?: LucideIcon
}

const TONE: Record<NonNullable<ClientsKpi['tone']>, string> = {
  brand: 'cb-clients-kpi--brand',
  amber: 'cb-clients-kpi--amber',
  emerald: 'cb-clients-kpi--emerald',
  rose: 'cb-clients-kpi--rose',
  muted: 'cb-clients-kpi--muted',
}

export function ClientsKpiStrip({
  items,
  activeId,
  onSelect,
  className,
}: {
  items: ClientsKpi[]
  activeId?: ClientsKpiId | null
  onSelect?: (id: ClientsKpiId) => void
  className?: string
}) {
  if (items.length === 0) return null
  return (
    <div className={cn('cb-clients-kpi-strip', className)} data-testid="clients-kpi-strip">
      {items.map((item) => {
        const Icon = item.icon
        const selected = activeId === item.id
        const clickable = Boolean(onSelect)
        const classNames = cn(
          'cb-clients-kpi',
          TONE[item.tone || 'muted'],
          clickable && 'cb-clients-kpi--clickable',
          selected && 'cb-clients-kpi--selected',
        )
        if (clickable) {
          return (
            <button
              key={item.id}
              type="button"
              className={classNames}
              aria-pressed={selected}
              data-testid={`clients-kpi-${item.id}`}
              onClick={() => onSelect?.(item.id)}
            >
              {Icon ? (
                <span className="cb-clients-kpi-icon" aria-hidden>
                  <Icon className="h-4 w-4" />
                </span>
              ) : null}
              <div className="min-w-0 text-left">
                <p className="cb-clients-kpi-value">{item.value}</p>
                <p className="cb-clients-kpi-label">{item.label}</p>
              </div>
            </button>
          )
        }
        return (
          <div key={item.id} className={classNames}>
            {Icon ? (
              <span className="cb-clients-kpi-icon" aria-hidden>
                <Icon className="h-4 w-4" />
              </span>
            ) : null}
            <div className="min-w-0">
              <p className="cb-clients-kpi-value">{item.value}</p>
              <p className="cb-clients-kpi-label">{item.label}</p>
            </div>
          </div>
        )
      })}
    </div>
  )
}

export const CLIENTS_KPI_ICONS = {
  active: Users,
  attention: AlertTriangle,
  noPortal: ShieldOff,
  total: Building2,
} as const
