import { ChevronLeft, ChevronRight, Plus } from 'lucide-react'
import { useMemo, useState } from 'react'

import type { WorkspaceTask } from '@/infrastructure/api/contabil/tasks'
import type { ObligationRow } from '@/features/firm/obligations/obligationOperational'
import { displayObligationTitle } from '@/features/firm/obligations/obligationOperational'
import { formatPeriodLabel, mapObligationDisplayStatus } from '@/features/firm/tasks/tasksOperationsUtils'
import { formatTaskTitle } from '@/shared/utils/taskDisplay'
import { Button } from '@/shared/components/ui/button'
import { cn } from '@/shared/lib/utils'

function daysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate()
}

function firstWeekday(year: number, month: number) {
  const d = new Date(year, month, 1).getDay()
  return d === 0 ? 6 : d - 1
}

type CalItem = { id: string; label: string; tone: 'red' | 'orange' | 'blue' | 'green'; onClick: () => void }

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
  const [cursor, setCursor] = useState({ year: now.getFullYear(), month: now.getMonth() })
  const [view, setView] = useState<'month' | 'week' | 'day'>('month')
  const [showOb, setShowOb] = useState(true)
  const [showManual, setShowManual] = useState(true)
  const [showMeetings, setShowMeetings] = useState(true)

  const ym = `${cursor.year}-${String(cursor.month + 1).padStart(2, '0')}`
  const totalDays = daysInMonth(cursor.year, cursor.month)
  const padStart = firstWeekday(cursor.year, cursor.month)
  const monthLabel = formatPeriodLabel(ym)

  const itemsByDay = useMemo(() => {
    const map = new Map<number, CalItem[]>()

    const add = (day: number, item: CalItem) => {
      if (!map.has(day)) map.set(day, [])
      map.get(day)!.push(item)
    }

    if (showOb) {
      for (const ob of obligations) {
        if (!ob.dueDate) continue
        const d = new Date(ob.dueDate)
        if (d.getFullYear() !== cursor.year || d.getMonth() !== cursor.month) continue
        const st = mapObligationDisplayStatus(ob)
        const tone =
          st === 'overdue' ? 'red' : st === 'completed' ? 'green' : st === 'in_progress' ? 'blue' : 'orange'
        add(d.getDate(), {
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
        if (d.getFullYear() !== cursor.year || d.getMonth() !== cursor.month) continue
        const isMeeting = /reuni/i.test(t.title)
        if (isMeeting && !showMeetings) continue
        const tone = t.status === 'DONE' ? 'green' : t.isOverdue ? 'red' : isMeeting ? 'blue' : 'orange'
        add(d.getDate(), {
          id: t.id,
          label: formatTaskTitle(t.title),
          tone,
          onClick: () => onSelectTask(t),
        })
      }
    }

    return map
  }, [obligations, manualTasks, cursor.year, cursor.month, showOb, showManual, showMeetings, onSelectObligation, onSelectTask])

  const cells: (number | null)[] = [
    ...Array.from({ length: padStart }, () => null),
    ...Array.from({ length: totalDays }, (_, i) => i + 1),
  ]
  while (cells.length % 7 !== 0) cells.push(null)

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="cb-tasks-cal-toolbar">
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="flex h-8 w-8 items-center justify-center rounded-md bg-brand text-primary-foreground"
            onClick={() =>
              setCursor((c) => (c.month === 0 ? { year: c.year - 1, month: 11 } : { year: c.year, month: c.month - 1 }))
            }
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="min-w-[7rem] text-center text-sm font-semibold">{monthLabel}</span>
          <button
            type="button"
            className="flex h-8 w-8 items-center justify-center rounded-md bg-brand text-primary-foreground"
            onClick={() =>
              setCursor((c) => (c.month === 11 ? { year: c.year + 1, month: 0 } : { year: c.year, month: c.month + 1 }))
            }
          >
            <ChevronRight className="h-4 w-4" />
          </button>
          <button
            type="button"
            className="h-8 rounded-md border border-border/80 px-2.5 text-xs font-medium"
            onClick={() => setCursor({ year: now.getFullYear(), month: now.getMonth() })}
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
          <div className="cb-tasks-cal-grid">
            {['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'].map((d) => (
              <div key={d} className="cb-tasks-cal-head">
                {d}
              </div>
            ))}
            {cells.map((day, idx) => {
              if (day == null) {
                return <div key={`empty-${idx}`} className="cb-tasks-cal-cell bg-muted/10" />
              }
              const items = itemsByDay.get(day) || []
              const isToday =
                day === now.getDate() && cursor.month === now.getMonth() && cursor.year === now.getFullYear()
              return (
                <div key={day} className="cb-tasks-cal-cell">
                  <span
                    className={cn(
                      'float-right inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium',
                      isToday && 'ring-2 ring-brand text-brand',
                    )}
                  >
                    {day}
                  </span>
                  <div className="clear-both pt-1">
                    {items.slice(0, 4).map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        className={cn(
                          'cb-tasks-cal-pill',
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
                  </div>
                </div>
              )
            })}
          </div>
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
