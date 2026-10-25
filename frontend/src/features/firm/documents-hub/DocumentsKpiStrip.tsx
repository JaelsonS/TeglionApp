import type { LucideIcon } from 'lucide-react'

import { cn } from '@/shared/lib/utils'

export type DocumentsKpi = {
  id: string
  label: string
  value: number | string
  tone?: 'brand' | 'amber' | 'emerald' | 'rose' | 'muted'
  icon?: LucideIcon
}

const TONE: Record<NonNullable<DocumentsKpi['tone']>, string> = {
  brand: 'cb-docs-kpi--brand',
  amber: 'cb-docs-kpi--amber',
  emerald: 'cb-docs-kpi--emerald',
  rose: 'cb-docs-kpi--rose',
  muted: 'cb-docs-kpi--muted',
}

/** Faixa de KPIs do hub Documentos — alinhada aos mockups v2. */
export function DocumentsKpiStrip({ items, className }: { items: DocumentsKpi[]; className?: string }) {
  if (items.length === 0) return null
  return (
    <div className={cn('cb-docs-kpi-strip', className)} data-testid="documents-kpi-strip">
      {items.map((item) => {
        const Icon = item.icon
        return (
          <div key={item.id} className={cn('cb-docs-kpi', TONE[item.tone || 'muted'])}>
            {Icon ? (
              <span className="cb-docs-kpi-icon" aria-hidden>
                <Icon className="h-4 w-4" />
              </span>
            ) : null}
            <div className="min-w-0">
              <p className="cb-docs-kpi-value">{item.value}</p>
              <p className="cb-docs-kpi-label">{item.label}</p>
            </div>
          </div>
        )
      })}
    </div>
  )
}
