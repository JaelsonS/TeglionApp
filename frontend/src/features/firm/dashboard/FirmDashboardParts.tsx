import { Link } from 'react-router-dom'
import { FileText, type LucideIcon } from 'lucide-react'

import { firmTasksPath } from '@/features/firm/tasks/firmTasksPaths'
import { cn } from '@/shared/lib/utils'
import type { Obligation } from '@/shared/types/contabil'
import { obligationRowMeta, obligationRowTitle } from './firmDashboardUtils'

export function DashKpi({
  label,
  sub,
  value,
  tone,
  icon: Icon,
  onClick,
}: {
  label: string
  sub: string
  value: number
  tone: 'red' | 'orange' | 'blue' | 'neutral'
  icon: LucideIcon
  onClick?: () => void
}) {
  const iconColor =
    tone === 'red'
      ? 'text-red-600'
      : tone === 'orange'
        ? 'text-orange-600'
        : tone === 'blue'
          ? 'text-sky-600'
          : 'text-muted-foreground'

  const body = (
    <>
      <div className="cb-dash-kpi-label">
        <Icon className={cn('h-3 w-3', iconColor)} />
        {label}
      </div>
      <div className="cb-dash-kpi-val">{value}</div>
      <div className="cb-dash-kpi-sub">{sub}</div>
    </>
  )

  if (onClick) {
    return (
      <button
        type="button"
        className={cn(
          'cb-dash-kpi',
          tone === 'red' && 'cb-dash-kpi-red',
          tone === 'orange' && 'cb-dash-kpi-orange',
          tone === 'blue' && 'cb-dash-kpi-blue',
        )}
        onClick={onClick}
      >
        {body}
      </button>
    )
  }

  return (
    <div
      className={cn(
        'cb-dash-kpi',
        tone === 'red' && 'cb-dash-kpi-red',
        tone === 'orange' && 'cb-dash-kpi-orange',
        tone === 'blue' && 'cb-dash-kpi-blue',
      )}
    >
      {body}
    </div>
  )
}

export function DashPanel({
  title,
  titleIcon,
  linkLabel,
  linkTo,
  headerAction,
  children,
}: {
  title: string
  titleIcon?: React.ReactNode
  linkLabel?: string
  linkTo?: string
  headerAction?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <section className="cb-dash-panel">
      <div className="cb-dash-panel-hd">
        <span className="cb-dash-panel-title">
          {titleIcon}
          {title}
        </span>
        <div className="flex items-center gap-2">
          {headerAction}
          {linkLabel && linkTo ? (
            <Link to={linkTo} className="cb-dash-panel-link">
              {linkLabel}
            </Link>
          ) : null}
        </div>
      </div>
      {children}
    </section>
  )
}

export function PortfolioBar({
  label,
  count,
  pct,
  color,
  labelClass,
}: {
  label: string
  count: number
  pct: number
  color: string
  labelClass: string
}) {
  return (
    <div>
      <div className="cb-dash-bar-label">
        <span className={labelClass}>{label}</span>
        <span className="text-muted-foreground">
          {count} {count === 1 ? 'empresa' : 'empresas'}
        </span>
      </div>
      <div className="cb-dash-bar-track">
        <div className={cn('cb-dash-bar-fill', color)} style={{ width: `${Math.max(pct, count > 0 ? 8 : 0)}%` }} />
      </div>
    </div>
  )
}

export function ObligationDashRows({
  items,
  mode,
  empty,
  pill,
}: {
  items: Obligation[]
  mode: 'critical' | 'overdue'
  empty: string
  pill: (o: Obligation) => { label: string; className: string }
}) {
  if (items.length === 0) return <p className="cb-dash-empty">{empty}</p>

  return (
    <ul>
      {items.slice(0, 6).map((o) => {
        const p = pill(o)
        return (
          <li key={o._id}>
            <Link to={firmTasksPath('obligations')} className="cb-dash-row">
              <span
                className={cn(
                  'cb-dash-row-ico',
                  mode === 'overdue' || p.label === 'Crítico' ? 'cb-dash-row-ico-red' : 'cb-dash-row-ico-orange',
                )}
              >
                <FileText className="h-3.5 w-3.5" />
              </span>
              <span className="cb-dash-row-body">
                <span className="cb-dash-row-name">{obligationRowTitle(o)}</span>
                <span className="cb-dash-row-meta">{obligationRowMeta(o, mode)}</span>
              </span>
              <span className="cb-dash-row-end">
                <span className={cn('cb-pill', p.className)}>{p.label}</span>
              </span>
            </Link>
          </li>
        )
      })}
    </ul>
  )
}
