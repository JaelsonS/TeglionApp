import { ChevronRight } from 'lucide-react'

import { cn } from '@/shared/lib/utils'
import type { Consultation } from '@/shared/types/contabil'
import { formatEventTimeRange } from './agendaCalendarUtils'

type StaffMember = {
  id: string
  fullName?: string
  email?: string
  role?: string | null
}

type Props = {
  anchor: Date
  items: Consultation[]
  staff: StaffMember[]
  clientName: (id: string) => string
  onPickDay: (day: Date) => void
  onSelectEvent?: (c: Consultation) => void
  onViewAllUpcoming?: () => void
  onViewAllTeam?: () => void
}

function monthMatrix(anchor: Date) {
  const y = anchor.getFullYear()
  const m = anchor.getMonth()
  const first = new Date(y, m, 1)
  const start = new Date(first)
  const dow = start.getDay()
  start.setDate(start.getDate() - (dow === 0 ? 6 : dow - 1))
  const weeks: Date[][] = []
  let cursor = new Date(start)
  for (let w = 0; w < 6; w += 1) {
    const row: Date[] = []
    for (let d = 0; d < 7; d += 1) {
      row.push(new Date(cursor))
      cursor.setDate(cursor.getDate() + 1)
    }
    weeks.push(row)
  }
  return { weeks, month: m, year: y }
}

const UPCOMING_DOT = ['bg-sky-500', 'bg-amber-500', 'bg-emerald-500', 'bg-violet-500']

export function AgendaSidebar({
  anchor,
  items,
  staff,
  clientName,
  onPickDay,
  onSelectEvent,
  onViewAllUpcoming,
  onViewAllTeam,
}: Props) {
  const now = new Date()
  const upcoming = [...items]
    .filter((c) => new Date(c.scheduledAt) >= now)
    .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime())
    .slice(0, 5)

  const { weeks, month, year } = monthMatrix(anchor)
  const monthLabel = new Date(year, month, 1).toLocaleDateString('pt-PT', { month: 'long', year: 'numeric' })

  return (
    <aside className="cb-agenda-sidebar">
      <div className="cb-agenda-sidebar-block">
        <p className="cb-agenda-sidebar-title">{monthLabel}</p>
        <div className="cb-agenda-mini-cal">
          {weeks.map((row, wi) => (
            <div key={wi} className="cb-agenda-mini-row">
              {row.map((d) => {
                const inMonth = d.getMonth() === month
                const key = d.toISOString().slice(0, 10)
                const isToday = key === now.toISOString().slice(0, 10)
                const hasEvents = items.some((c) => c.scheduledAt.slice(0, 10) === key)
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => onPickDay(d)}
                    className={cn(
                      'cb-agenda-mini-day',
                      !inMonth && 'cb-agenda-mini-day-out',
                      isToday && 'cb-agenda-mini-day-today',
                      hasEvents && inMonth && 'cb-agenda-mini-day-busy',
                    )}
                  >
                    {d.getDate()}
                  </button>
                )
              })}
            </div>
          ))}
        </div>
      </div>

      <div className="cb-agenda-sidebar-block">
        <h3 className="cb-agenda-sidebar-title">Próximas reuniões</h3>
        <ul className="cb-agenda-upcoming">
          {upcoming.length === 0 ? (
            <li className="text-xs text-muted-foreground">Sem reuniões futuras.</li>
          ) : (
            upcoming.map((ev, i) => (
              <li key={ev._id}>
                <button
                  type="button"
                  className="cb-agenda-upcoming-row"
                  onClick={() => onSelectEvent?.(ev)}
                >
                  <span className={cn('cb-agenda-upcoming-dot', UPCOMING_DOT[i % UPCOMING_DOT.length])} />
                  <span className="min-w-0 flex-1 text-left">
                    <span className="block text-caption font-semibold tabular-nums text-muted-foreground">
                      {formatEventTimeRange(ev.scheduledAt, ev.durationMinutes).split(' - ')[0]}
                    </span>
                    <span className="block truncate text-xs font-medium">{ev.title}</span>
                    <span className="block truncate cb-text-caption">
                      {clientName(ev.clientId)}
                    </span>
                  </span>
                </button>
              </li>
            ))
          )}
        </ul>
        <button type="button" className="cb-agenda-sidebar-link" onClick={onViewAllUpcoming}>
          Ver todas
          <ChevronRight className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="cb-agenda-sidebar-block">
        <h3 className="cb-agenda-sidebar-title">Equipa disponível</h3>
        <ul className="cb-agenda-team">
          {staff.length === 0 ? (
            <li className="text-xs text-muted-foreground">Sem membros registados.</li>
          ) : (
            staff.map((u) => (
              <li key={u.id} className="cb-agenda-team-row">
                <span className="cb-agenda-team-avatar" aria-hidden>
                  {(u.fullName || u.email || '?').slice(0, 2).toUpperCase()}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-xs font-semibold">{u.fullName || u.email}</span>
                  <span className="block truncate cb-text-caption">
                    {u.role || 'Equipa'}
                  </span>
                </span>
                <span className="cb-agenda-team-status">
                  <span className="cb-agenda-team-dot" />
                  Disponível
                </span>
              </li>
            ))
          )}
        </ul>
        <button type="button" className="cb-agenda-sidebar-link" onClick={onViewAllTeam}>
          Ver toda a equipa
          <ChevronRight className="h-3.5 w-3.5" />
        </button>
      </div>
    </aside>
  )
}
