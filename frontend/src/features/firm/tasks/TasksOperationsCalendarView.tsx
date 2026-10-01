import { ChevronLeft, ChevronRight, Plus } from 'lucide-react'
import { useMemo, useState } from 'react'

import type { WorkspaceTask } from '@/infrastructure/api/contabil/tasks'
import type { ObligationRow } from '@/features/firm/obligations/obligationOperational'
import { displayObligationTitle } from '@/features/firm/obligations/obligationOperational'
import { formatPeriodLabel, mapObligationDisplayStatus } from '@/features/firm/tasks/tasksOperationsUtils'
import { formatTaskTitle } from '@/shared/utils/taskDisplay'
import { MONTH_NAMES_PT } from '@/shared/calendar'
import { Button } from '@/shared/components/ui/button'
import { cn } from '@/shared/lib/utils'

type CalItem = { id: string; label: string; tone: 'red' | 'orange' | 'blue' | 'green'; onClick: () => void }

type Cursor = { year: number; month: number; day: number }

function toDate(c: Cursor) {
  return new Date(c.year, c.month, c.day)
}

function cursorFromDate(d: Date): Cursor {
  return { year: d.getFullYear(), month: d.getMonth(), day: d.getDate() }
}

function dateKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function daysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate()
}

function firstWeekday(year: number, month: number) {
  const d = new Date(year, month, 1).getDay()
  return d === 0 ? 6 : d - 1
}

function startOfWeekMonday(d: Date) {
  const date = new Date(d.getFullYear(), d.getMonth(), d.getDate())
  const dow = date.getDay()
  const diff = dow === 0 ? -6 : 1 - dow
  date.setDate(date.getDate() + diff)
  return date
}

function addDays(d: Date, n: number) {
  const next = new Date(d.getFullYear(), d.getMonth(), d.getDate())
  next.setDate(next.getDate() + n)
  return next
}

function formatDayHeading(d: Date) {
  const month = MONTH_NAMES_PT[d.getMonth()]
  return `${d.getDate()} ${month ?? ''} ${d.getFullYear()}`.trim()
}

function formatWeekHeading(weekStart: Date) {
  const weekEnd = addDays(weekStart, 6)
  const sameMonth = weekStart.getMonth() === weekEnd.getMonth()
  const m0 = MONTH_NAMES_PT[weekStart.getMonth()]
  const m1 = MONTH_NAMES_PT[weekEnd.getMonth()]
  if (sameMonth) {
    return `${weekStart.getDate()}–${weekEnd.getDate()} ${m0 ?? ''} ${weekStart.getFullYear()}`.trim()
  }
  return `${weekStart.getDate()} ${m0 ?? ''} – ${weekEnd.getDate()} ${m1 ?? ''} ${weekEnd.getFullYear()}`.trim()
}

const WEEKDAY_SHORT = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'] as const

export function TasksOperationsCalendarView({
  obligations,
  manualTasks,
  onSelectObligation,
  onSelectTask,
  onNewTask,
}: {
  obligations: ObligationRow[]
  manualTasks: WorkspaceTask[]
  onSelectObligation: (id: string) => void
  onSelectTask: (t: WorkspaceTask) => void
  onNewTask?: () => void
}) {
  const now = new Date()
  const [cursor, setCursor] = useState<Cursor>(() => cursorFromDate(now))
  const [view, setView] = useState<'month' | 'week' | 'day'>('month')
  const [showOb, setShowOb] = useState(true)
  const [showManual, setShowManual] = useState(true)
  const [showMeetings, setShowMeetings] = useState(true)

  const ym = `${cursor.year}-${String(cursor.month + 1).padStart(2, '0')}`
  const monthLabel = formatPeriodLabel(ym)
  const focusDate = toDate(cursor)
  const weekStart = startOfWeekMonday(focusDate)

  const itemsByDate = useMemo(() => {
    const map = new Map<string, CalItem[]>()

    const add = (d: Date, item: CalItem) => {
      const k = dateKey(d)
      if (!map.has(k)) map.set(k, [])
      map.get(k)!.push(item)
    }

    if (showOb) {
      for (const ob of obligations) {
        if (!ob.dueDate) continue
        const d = new Date(ob.dueDate)
        if (Number.isNaN(d.getTime())) continue
        const st = mapObligationDisplayStatus(ob)
        const tone =
          st === 'overdue' ? 'red' : st === 'completed' ? 'green' : st === 'in_progress' ? 'blue' : 'orange'
        add(d, {
          id: ob._id,
          label: `${displayObligationTitle(ob)} ${ob.clientName || ''}`.trim(),
          tone,
          onClick: () => onSelectObligation(ob._id),
        })
      }
    }

    if (showManual) {
      for (const t of manualTasks) {
        if (!t.dueDate) continue
        const d = new Date(t.dueDate)
        if (Number.isNaN(d.getTime())) continue
        const isMeeting = /reuni/i.test(t.title)
        if (isMeeting && !showMeetings) continue
        const tone = t.status === 'DONE' ? 'green' : t.isOverdue ? 'red' : isMeeting ? 'blue' : 'orange'
        add(d, {
          id: t.id,
          label: formatTaskTitle(t.title),
          tone,
          onClick: () => onSelectTask(t),
        })
      }
    }

    return map
  }, [obligations, manualTasks, showOb, showManual, showMeetings, onSelectObligation, onSelectTask])

  const periodLabel =
    view === 'month' ? monthLabel : view === 'week' ? formatWeekHeading(weekStart) : formatDayHeading(focusDate)

  const shiftPeriod = (dir: -1 | 1) => {
    setCursor((c) => {
      const d = toDate(c)
      if (view === 'month') {
        d.setDate(1)
        d.setMonth(d.getMonth() + dir)
      } else if (view === 'week') {
        d.setDate(d.getDate() + dir * 7)
      } else {
        d.setDate(d.getDate() + dir)
      }
      return cursorFromDate(d)
    })
  }

  const goToday = () => setCursor(cursorFromDate(now))

  const totalDays = daysInMonth(cursor.year, cursor.month)
  const padStart = firstWeekday(cursor.year, cursor.month)
  const monthCells: (number | null)[] = [
    ...Array.from({ length: padStart }, () => null),
    ...Array.from({ length: totalDays }, (_, i) => i + 1),
  ]
  while (monthCells.length % 7 !== 0) monthCells.push(null)

  const weekDays = useMemo(
    () => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)),
    [weekStart.getTime()],
  )

  const dayItems = itemsByDate.get(dateKey(focusDate)) ?? []

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="cb-tasks-cal-toolbar">
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="flex h-8 w-8 items-center justify-center rounded-md bg-brand text-primary-foreground"
            onClick={() => shiftPeriod(-1)}
            aria-label={view === 'month' ? 'Mês anterior' : view === 'week' ? 'Semana anterior' : 'Dia anterior'}
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="min-w-[9rem] text-center text-sm font-semibold">{periodLabel}</span>
          <button
            type="button"
            className="flex h-8 w-8 items-center justify-center rounded-md bg-brand text-primary-foreground"
            onClick={() => shiftPeriod(1)}
            aria-label={view === 'month' ? 'Mês seguinte' : view === 'week' ? 'Semana seguinte' : 'Dia seguinte'}
          >
            <ChevronRight className="h-4 w-4" />
          </button>
          <button
            type="button"
            className="h-8 rounded-md border border-border/80 px-2.5 text-xs font-medium"
            onClick={goToday}
          >
            Hoje
          </button>
        </div>

        <div className="flex overflow-hidden rounded-md border border-border/80">
          {(['month', 'week', 'day'] as const).map((v) => (
            <button
              key={v}
              type="button"
              className={cn(
                'h-8 px-3 text-xs font-medium capitalize',
                view === v ? 'bg-brand text-primary-foreground' : 'bg-card text-muted-foreground',
              )}
              onClick={() => setView(v)}
            >
              {v === 'month' ? 'Mês' : v === 'week' ? 'Semana' : 'Dia'}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <FilterPill label="Obrigações fiscais" checked={showOb} onChange={setShowOb} />
          <FilterPill label="Manuais" checked={showManual} onChange={setShowManual} />
          <FilterPill label="Reuniões" checked={showMeetings} onChange={setShowMeetings} />
          {onNewTask ? (
            <Button type="button" className="h-8 rounded-md px-3 text-xs" onClick={onNewTask}>
              <Plus className="mr-1 h-3.5 w-3.5" />
              Nova tarefa
            </Button>
          ) : null}
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-auto p-3">
        <div className="overflow-hidden rounded-lg border border-border/60 bg-card">
          {view === 'month' ? (
            <div className="cb-tasks-cal-grid">
              {WEEKDAY_SHORT.map((d) => (
                <div key={d} className="cb-tasks-cal-head">
                  {d}
                </div>
              ))}
              {monthCells.map((day, idx) => {
                if (day == null) {
                  return <div key={`empty-${idx}`} className="cb-tasks-cal-cell bg-muted/10" />
                }
                const cellDate = new Date(cursor.year, cursor.month, day)
                const items = itemsByDate.get(dateKey(cellDate)) || []
                const isToday =
                  day === now.getDate() && cursor.month === now.getMonth() && cursor.year === now.getFullYear()
                return (
                  <CalendarDayCell key={day} day={day} items={items} isToday={isToday} />
                )
              })}
            </div>
          ) : null}

          {view === 'week' ? (
            <div className="cb-tasks-cal-grid">
              {weekDays.map((d) => (
                <div key={dateKey(d)} className="cb-tasks-cal-head">
                  {WEEKDAY_SHORT[(d.getDay() + 6) % 7]} {d.getDate()}
                </div>
              ))}
              {weekDays.map((d) => {
                const items = itemsByDate.get(dateKey(d)) || []
                const isToday = dateKey(d) === dateKey(now)
                return (
                  <div
                    key={dateKey(d)}
                    className={cn(
                      'cb-tasks-cal-cell cb-tasks-cal-cell--week min-h-[10rem]',
                      isToday && 'bg-brand/[0.04]',
                    )}
                  >
                    <CalendarItemList items={items} limit={12} />
                  </div>
                )
              })}
            </div>
          ) : null}

          {view === 'day' ? (
            <div className="p-4">
              <p className="mb-3 text-sm font-semibold text-foreground">{formatDayHeading(focusDate)}</p>
              {dayItems.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nada com prazo neste dia — altere filtros ou escolha outra data.</p>
              ) : (
                <CalendarItemList items={dayItems} limit={50} stacked />
              )}
            </div>
          ) : null}
        </div>

        <div className="mt-3 flex flex-wrap justify-end gap-4 cb-text-caption">
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-red-500" /> Em atraso
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-orange-500" /> Pendente
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-sky-600" /> Reunião
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-emerald-500" /> Concluída
          </span>
        </div>
      </div>
    </div>
  )
}

function CalendarDayCell({
  day,
  items,
  isToday,
}: {
  day: number
  items: CalItem[]
  isToday: boolean
}) {
  return (
    <div className="cb-tasks-cal-cell">
      <span
        className={cn(
          'float-right inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium',
          isToday && 'ring-2 ring-brand text-brand',
        )}
      >
        {day}
      </span>
      <div className="clear-both pt-1">
        <CalendarItemList items={items} limit={4} />
      </div>
    </div>
  )
}

function CalendarItemList({
  items,
  limit,
  stacked,
}: {
  items: CalItem[]
  limit: number
  stacked?: boolean
}) {
  const visible = items.slice(0, limit)
  const extra = items.length - visible.length
  return (
    <div className={cn(stacked ? 'space-y-1.5' : undefined)}>
      {visible.map((item) => (
        <button
          key={item.id}
          type="button"
          className={cn(
            'cb-tasks-cal-pill',
            stacked && 'whitespace-normal text-left leading-snug',
            item.tone === 'red' && 'cb-tasks-cal-pill-red',
            item.tone === 'orange' && 'cb-tasks-cal-pill-orange',
            item.tone === 'blue' && 'cb-tasks-cal-pill-blue',
            item.tone === 'green' && 'cb-tasks-cal-pill-green',
          )}
          onClick={item.onClick}
        >
          {item.label}
        </button>
      ))}
      {extra > 0 ? (
        <p className="text-[10px] font-medium text-muted-foreground">+{extra} mais</p>
      ) : null}
    </div>
  )
}

function FilterPill({
  label,
  checked,
  onChange,
}: {
  label: string
  checked: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <button
      type="button"
      className={cn(
        'flex h-8 items-center gap-1.5 rounded-md border px-2.5 text-xs font-medium',
        checked ? 'border-brand/40 bg-brand/5 text-brand' : 'border-border/80 text-muted-foreground',
      )}
      onClick={() => onChange(!checked)}
    >
      {checked ? '✓' : ''} {label}
    </button>
  )
}
