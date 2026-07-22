import { useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

import { displayDocumentRequestTitle } from '@/features/firm/documents/documentRequestDisplay'
import { normalizeRequestStatus } from '@/features/firm/documents/documentRequestStatus'
import type { ClientTask, Consultation, DocumentRequest, Obligation } from '@/shared/types/contabil'
import { cn } from '@/shared/lib/utils'
import { Button } from '@/shared/components/ui/button'

export type AgendaDayKind =
  | 'overdue'
  | 'dueSoon'
  | 'open'
  | 'paid'
  | 'meeting'
  | 'task'
  | 'request'

type DayEvent = {
  id: string
  title: string
  kind: AgendaDayKind
  dateKey: string
}

export function toAgendaDateKey(iso: string) {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function kindForObligation(o: Obligation): AgendaDayKind {
  if (o.paymentStatus === 'PAID') return 'paid'
  const due = new Date(o.dueDate).getTime()
  const now = Date.now()
  if (!Number.isNaN(due) && due < now && o.status !== 'DELIVERED' && o.status !== 'CANCELLED') {
    return 'overdue'
  }
  if (!Number.isNaN(due) && due >= now && due <= now + 7 * 24 * 60 * 60 * 1000) return 'dueSoon'
  return 'open'
}

function requestDateKey(r: DocumentRequest) {
  if (r.periodMonth && /^\d{4}-\d{2}$/.test(r.periodMonth)) {
    const [y, m] = r.periodMonth.split('-').map(Number)
    const last = new Date(y, m, 0).getDate()
    return `${r.periodMonth}-${String(last).padStart(2, '0')}`
  }
  return toAgendaDateKey(r.createdAt)
}

function kindForTask(t: ClientTask): AgendaDayKind {
  if (t.isOverdue) return 'overdue'
  if (t.dueDate) {
    const due = new Date(t.dueDate).getTime()
    if (!Number.isNaN(due) && due < Date.now()) return 'overdue'
    if (!Number.isNaN(due) && due <= Date.now() + 7 * 24 * 60 * 60 * 1000) return 'dueSoon'
  }
  return 'task'
}

const KIND_DOT: Record<AgendaDayKind, string> = {
  overdue: 'bg-red-500',
  dueSoon: 'bg-amber-500',
  open: 'bg-sky-500',
  paid: 'bg-emerald-500',
  meeting: 'bg-violet-500',
  task: 'bg-indigo-500',
  request: 'bg-teal-500',
}

const KIND_LABEL: Record<AgendaDayKind, string> = {
  overdue: 'Em atraso',
  dueSoon: 'Prazo próximo',
  open: 'Obrigação',
  paid: 'Pago',
  meeting: 'Reunião',
  task: 'Tarefa',
  request: 'Pedido docs',
}

const WEEKDAYS = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom']

type Props = {
  obligations: Obligation[]
  consultations?: Consultation[]
  tasks?: ClientTask[]
  requests?: DocumentRequest[]
  selectedDateKey: string | null
  onSelectDate: (dateKey: string | null) => void
  onOpenEvent?: (id: string, kind: AgendaDayKind) => void
}

export function ClientAgendaCalendar({
  obligations,
  consultations = [],
  tasks = [],
  requests = [],
  selectedDateKey,
  onSelectDate,
  onOpenEvent,
}: Props) {
  const [cursor, setCursor] = useState(() => {
    const n = new Date()
    return new Date(n.getFullYear(), n.getMonth(), 1)
  })

  const events = useMemo(() => {
    const list: DayEvent[] = []

    for (const o of obligations) {
      const dateKey = toAgendaDateKey(o.dueDate)
      if (!dateKey) continue
      list.push({
        id: String(o._id || o.id || dateKey),
        title: o.title || o.type || 'Obrigação',
        kind: kindForObligation(o),
        dateKey,
      })
    }

    for (const c of consultations) {
      const dateKey = toAgendaDateKey(c.scheduledAt || '')
      if (!dateKey) continue
      list.push({
        id: `m-${c._id || dateKey}`,
        title: c.title || 'Reunião',
        kind: 'meeting',
        dateKey,
      })
    }

    for (const t of tasks) {
      const s = String(t.status || '').toUpperCase()
      if (['DONE', 'COMPLETED', 'ARCHIVED', 'CANCELLED'].includes(s)) continue
      const dateKey = t.dueDate ? toAgendaDateKey(t.dueDate) : ''
      if (!dateKey) continue
      list.push({
        id: `task-${t._id}`,
        title: t.title,
        kind: kindForTask(t),
        dateKey,
      })
    }

    for (const r of requests) {
      const st = normalizeRequestStatus(r.status)
      if (st === 'completed') continue
      const dateKey = requestDateKey(r)
      if (!dateKey) continue
      list.push({
        id: `req-${r.id}`,
        title: displayDocumentRequestTitle(r),
        kind: st === 'pending' ? 'request' : 'request',
        dateKey,
      })
    }

    return list
  }, [consultations, obligations, requests, tasks])

  const byDay = useMemo(() => {
    const map = new Map<string, DayEvent[]>()
    for (const e of events) {
      if (!map.has(e.dateKey)) map.set(e.dateKey, [])
      map.get(e.dateKey)!.push(e)
    }
    return map
  }, [events])

  const year = cursor.getFullYear()
  const month = cursor.getMonth()
  const monthLabel = new Intl.DateTimeFormat('pt-PT', { month: 'long', year: 'numeric' }).format(cursor)

  const cells = useMemo(() => {
    const first = new Date(year, month, 1)
    const startPad = (first.getDay() + 6) % 7
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    const total = Math.ceil((startPad + daysInMonth) / 7) * 7
    const out: Array<{ day: number | null; dateKey: string | null }> = []
    for (let i = 0; i < total; i += 1) {
      const dayNum = i - startPad + 1
      if (dayNum < 1 || dayNum > daysInMonth) {
        out.push({ day: null, dateKey: null })
        continue
      }
      const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`
      out.push({ day: dayNum, dateKey })
    }
    return out
  }, [month, year])

  const todayKey = toAgendaDateKey(new Date().toISOString())
  const selectedEvents = selectedDateKey ? byDay.get(selectedDateKey) || [] : []

  return (
    <div className="cb-card-padded overflow-hidden">
      <div className="mb-4 flex items-center justify-between gap-2">
        <div>
          <p className="cb-text-label text-brand">Calendário</p>
          <h3 className="font-display text-lg font-semibold capitalize text-foreground">{monthLabel}</h3>
        </div>
        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="h-9 w-9 rounded-xl"
            aria-label="Mês anterior"
            onClick={() => setCursor(new Date(year, month - 1, 1))}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="rounded-xl px-3"
            onClick={() => {
              const n = new Date()
              setCursor(new Date(n.getFullYear(), n.getMonth(), 1))
              onSelectDate(todayKey)
            }}
          >
            Hoje
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="h-9 w-9 rounded-xl"
            aria-label="Mês seguinte"
            onClick={() => setCursor(new Date(year, month + 1, 1))}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="mb-3 flex flex-wrap gap-x-3 gap-y-1.5 text-[11px] text-muted-foreground">
        {(
          [
            'request',
            'task',
            'meeting',
            'overdue',
            'dueSoon',
            'open',
            'paid',
          ] as AgendaDayKind[]
        ).map((k) => (
          <span key={k} className="inline-flex items-center gap-1.5">
            <span className={cn('h-2 w-2 rounded-full', KIND_DOT[k])} />
            {KIND_LABEL[k]}
          </span>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-medium text-muted-foreground sm:gap-1.5">
        {WEEKDAYS.map((d) => (
          <div key={d} className="py-1">
            {d}
          </div>
        ))}
      </div>

      <div className="mt-1 grid grid-cols-7 gap-1 sm:gap-1.5">
        {cells.map((cell, idx) => {
          if (!cell.day || !cell.dateKey) {
            return <div key={`e-${idx}`} className="aspect-square rounded-xl bg-transparent" />
          }
          const dayEvents = byDay.get(cell.dateKey) || []
          const isToday = cell.dateKey === todayKey
          const isSelected = cell.dateKey === selectedDateKey
          const kinds = [...new Set(dayEvents.map((e) => e.kind))].slice(0, 4)

          return (
            <button
              key={cell.dateKey}
              type="button"
              onClick={() => onSelectDate(isSelected ? null : cell.dateKey)}
              className={cn(
                'relative flex aspect-square flex-col items-center justify-start rounded-xl border p-1 text-xs transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:p-1.5',
                dayEvents.length
                  ? 'border-border/80 bg-card hover:border-brand/30 hover:shadow-sm'
                  : 'border-transparent bg-muted/20 hover:bg-muted/40',
                isToday && 'ring-1 ring-brand/40',
                isSelected && 'border-brand bg-brand/[0.08] shadow-sm',
              )}
              aria-label={`${cell.day}${dayEvents.length ? `, ${dayEvents.length} eventos` : ''}`}
              aria-pressed={isSelected}
            >
              <span className={cn('font-semibold tabular-nums', isToday ? 'text-brand' : 'text-foreground')}>
                {cell.day}
              </span>
              {kinds.length > 0 ? (
                <span className="mt-auto flex flex-wrap justify-center gap-0.5 pb-0.5">
                  {kinds.map((k) => (
                    <span key={k} className={cn('h-1.5 w-1.5 rounded-full sm:h-2 sm:w-2', KIND_DOT[k])} />
                  ))}
                </span>
              ) : null}
              {dayEvents.length > 4 ? (
                <span className="absolute right-0.5 top-0.5 text-[9px] font-bold text-muted-foreground">
                  +{dayEvents.length - 4}
                </span>
              ) : null}
            </button>
          )
        })}
      </div>

      {selectedDateKey ? (
        <div className="mt-4 border-t border-border pt-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {new Intl.DateTimeFormat('pt-PT', { dateStyle: 'full' }).format(
              new Date(`${selectedDateKey}T12:00:00`),
            )}
          </p>
          {selectedEvents.length === 0 ? (
            <p className="mt-2 text-sm text-muted-foreground">Sem compromissos neste dia.</p>
          ) : (
            <ul className="mt-2 max-h-56 space-y-2 overflow-y-auto">
              {selectedEvents.map((e) => (
                <li key={e.id}>
                  <button
                    type="button"
                    className="flex w-full items-center gap-2 rounded-xl bg-muted/30 px-3 py-2.5 text-left text-sm transition hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    onClick={() => onOpenEvent?.(e.id, e.kind)}
                  >
                    <span className={cn('h-2.5 w-2.5 shrink-0 rounded-full', KIND_DOT[e.kind])} />
                    <span className="min-w-0 flex-1">
                      <span className="block font-medium text-foreground">{e.title}</span>
                      <span className="text-xs text-muted-foreground">{KIND_LABEL[e.kind]}</span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : null}
    </div>
  )
}
