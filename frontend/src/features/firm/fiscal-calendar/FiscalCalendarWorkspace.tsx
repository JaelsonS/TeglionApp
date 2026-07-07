import { useQuery } from '@tanstack/react-query'
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Filter,
  LayoutGrid,
  List,
  Sparkles,
} from 'lucide-react'
import { useMemo, useState } from 'react'

import { FiscalCalendarDetailSheet } from '@/features/firm/fiscal-calendar/FiscalCalendarDetailSheet'
import {
  daysInMonth,
  firstWeekdayMonday,
  formatFiscalDate,
  getFiscalCategoryStyle,
  getFiscalUrgency,
  MONTH_NAMES_PT,
  uniqueCategories,
  URGENCY_RING,
  WEEKDAY_LABELS_PT,
  type FiscalCalendarItem,
} from '@/features/firm/fiscal-calendar/fiscalCalendarUtils'
import { useFiscalCalendarNotes } from '@/features/firm/fiscal-calendar/useFiscalCalendarNotes'
import { FirmWorkspacePage } from '@/features/firm/FirmPageLayout'
import { api } from '@/infrastructure/api'
import { useFirmBranding } from '@/shared/hooks/useFirmBranding'
import { cn } from '@/shared/lib/utils'
import { contabilClientsApi } from '@/infrastructure/api'
import type { Client } from '@/shared/types/clients'

type FiscalResponse = {
  year: number
  country?: string
  source?: 'explicit' | 'generated' | 'unavailable' | 'coming_soon'
  items: FiscalCalendarItem[]
  disclaimer: string
}

export function FiscalCalendarWorkspace() {
  const { firm } = useFirmBranding()
  const firmKey = firm?._id ?? firm?.id ?? 'default'
  const { getNote, saveNote } = useFiscalCalendarNotes(firmKey)

  const now = new Date()
  const [cursor, setCursor] = useState({ year: 2026, month: now.getMonth() })
  const [view, setView] = useState<'grid' | 'list'>('grid')
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null)
  const [selected, setSelected] = useState<FiscalCalendarItem | null>(null)
  const [sheetOpen, setSheetOpen] = useState(false)

  const { data: yearsRes } = useQuery({
    queryKey: ['fiscal-calendar-years'],
    queryFn: async () => {
      const res = await api.get<{ years: number[] }>('/contabil/fiscal-calendar/years')
      return res.data
    },
    staleTime: 60 * 60 * 1000,
  })
  const availableYears = yearsRes?.years?.length ? yearsRes.years : [2026]

  const { data, isLoading } = useQuery({
    queryKey: ['fiscal-calendar', cursor.year],
    queryFn: async () => {
      const res = await api.get<FiscalResponse>(`/contabil/fiscal-calendar?year=${cursor.year}`)
      return res.data
    },
  })

  const { data: clientsRes } = useQuery({
    queryKey: ['fiscal-calendar-clients'],
    queryFn: () => contabilClientsApi.list({ page: 1, limit: 500 }) as Promise<{ items?: Client[] }>,
    staleTime: 60 * 1000,
  })
  const clients = clientsRes?.items || []

  const allItems = data?.items ?? []
  const categories = useMemo(() => uniqueCategories(allItems), [allItems])

  const monthItems = useMemo(() => {
    const m = String(cursor.month + 1).padStart(2, '0')
    return allItems.filter((i) => {
      if (String(i.dueDate || '').slice(5, 7) !== m) return false
      if (categoryFilter && i.category !== categoryFilter) return false
      return true
    })
  }, [allItems, cursor.month, categoryFilter])

  const itemsByDay = useMemo(() => {
    const map = new Map<number, FiscalCalendarItem[]>()
    for (const item of monthItems) {
      const day = Number(item.dueDate?.slice(8, 10))
      if (!day) continue
      if (!map.has(day)) map.set(day, [])
      map.get(day)!.push(item)
    }
    for (const [, list] of map) {
      list.sort((a, b) => a.dueDate.localeCompare(b.dueDate))
    }
    return map
  }, [monthItems])

  const monthStats = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const item of monthItems) {
      counts[item.category] = (counts[item.category] ?? 0) + 1
    }
    return counts
  }, [monthItems])

  const openItem = (item: FiscalCalendarItem) => {
    setSelected(item)
    setSheetOpen(true)
  }

  const totalDays = daysInMonth(cursor.year, cursor.month)
  const padStart = firstWeekdayMonday(cursor.year, cursor.month)
  const cells: (number | null)[] = [
    ...Array.from({ length: padStart }, () => null),
    ...Array.from({ length: totalDays }, (_, i) => i + 1),
  ]
  while (cells.length % 7 !== 0) cells.push(null)

  const monthLabel = `${MONTH_NAMES_PT[cursor.month]}`
  const today = new Date()
  const isToday = (day: number) =>
    today.getFullYear() === cursor.year && today.getMonth() === cursor.month && today.getDate() === day

  return (
    <FirmWorkspacePage className="cb-fiscal-cal-page min-h-0 flex-1">
      <header className="cb-fiscal-cal-header shrink-0">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand/10 text-brand">
                <CalendarDays className="h-5 w-5" />
              </div>
              <div>
                <h1 className="cb-operational-page-title font-display sm:text-2xl">Calendário fiscal</h1>
                <p className="cb-operational-page-sub text-sm">
                  Prazos nacionais AT e Segurança Social · {cursor.year}
                  {data?.source === 'generated' ? (
                    <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2 py-0.5 text-xs font-medium text-amber-800">
                      <Sparkles className="h-3 w-3" aria-hidden />
                      Ano gerado automaticamente
                    </span>
                  ) : null}
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1 rounded-lg border border-border/60 bg-card p-1">
            <button
              type="button"
              className={cn(
                'flex h-8 w-8 items-center justify-center rounded-md transition-colors',
                view === 'grid' ? 'bg-brand text-primary-foreground' : 'text-muted-foreground hover:bg-muted',
              )}
              onClick={() => setView('grid')}
              aria-label="Vista em grelha"
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
            <button
              type="button"
              className={cn(
                'flex h-8 w-8 items-center justify-center rounded-md transition-colors',
                view === 'list' ? 'bg-brand text-primary-foreground' : 'text-muted-foreground hover:bg-muted',
              )}
              onClick={() => setView('list')}
              aria-label="Vista em lista"
            >
              <List className="h-4 w-4" />
            </button>
          </div>
        </div>

        {Object.keys(monthStats).length > 0 ? (
          <div className="mt-3 flex flex-wrap gap-2">
            {categories
              .filter((c) => monthStats[c])
              .map((cat) => {
                const style = getFiscalCategoryStyle(cat)
                return (
                  <span
                    key={cat}
                    className={cn('inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium', style.pill)}
                  >
                    <span className={cn('h-1.5 w-1.5 rounded-full', style.dot)} />
                    {style.label}
                    <span className="opacity-70">· {monthStats[cat]}</span>
                  </span>
                )
              })}
          </div>
        ) : null}
      </header>

      <div className="cb-fiscal-cal-toolbar shrink-0">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            className="flex h-8 w-8 items-center justify-center rounded-md bg-brand text-primary-foreground"
            onClick={() =>
              setCursor((c) => (c.month === 0 ? { year: c.year - 1, month: 11 } : { year: c.year, month: c.month - 1 }))
            }
            aria-label="Mês anterior"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="min-w-[6rem] text-center text-sm font-semibold">{monthLabel}</span>
          <select
            className="h-8 rounded-md border border-border/60 bg-card px-2 text-sm font-semibold text-foreground"
            value={cursor.year}
            onChange={(e) => setCursor((c) => ({ ...c, year: Number(e.target.value) }))}
            aria-label="Ano"
          >
            {availableYears.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
          <button
            type="button"
            className="flex h-8 w-8 items-center justify-center rounded-md bg-brand text-primary-foreground"
            onClick={() =>
              setCursor((c) => (c.month === 11 ? { year: c.year + 1, month: 0 } : { year: c.year, month: c.month + 1 }))
            }
            aria-label="Mês seguinte"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
          <button
            type="button"
            className="ml-1 rounded-md border border-border/60 px-2.5 py-1 text-xs font-medium text-muted-foreground hover:bg-muted"
            onClick={() => setCursor((c) => ({ ...c, month: now.getMonth() }))}
          >
            Hoje
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          <Filter className="mr-1 h-3.5 w-3.5 text-muted-foreground" aria-hidden />
          <button
            type="button"
            className={cn(
              'rounded-full px-2.5 py-1 text-xs font-medium transition-colors',
              !categoryFilter ? 'bg-brand text-primary-foreground' : 'bg-muted text-muted-foreground hover:text-foreground',
            )}
            onClick={() => setCategoryFilter(null)}
          >
            Todas
          </button>
          {categories.map((cat) => {
            const style = getFiscalCategoryStyle(cat)
            const active = categoryFilter === cat
            return (
              <button
                key={cat}
                type="button"
                className={cn(
                  'rounded-full px-2.5 py-1 text-xs font-medium transition-colors',
                  active ? style.pill : 'bg-muted/60 text-muted-foreground hover:text-foreground',
                )}
                onClick={() => setCategoryFilter(active ? null : cat)}
              >
                {style.label}
              </button>
            )
          })}
        </div>
      </div>

      {data?.disclaimer ? (
        <p className="shrink-0 text-xs text-muted-foreground">{data.disclaimer}</p>
      ) : null}

      <div className="cb-fiscal-cal-body min-h-0 flex-1">
        {isLoading ? (
          <div className="h-full min-h-[20rem] animate-pulse rounded-xl bg-muted/40" />
        ) : view === 'grid' ? (
          <div className="cb-fiscal-cal-grid-wrap">
            <div className="cb-fiscal-cal-grid">
              {WEEKDAY_LABELS_PT.map((wd) => (
                <div key={wd} className="cb-fiscal-cal-weekday">
                  {wd}
                </div>
              ))}
              {cells.map((day, idx) => {
                if (day === null) {
                  return <div key={`empty-${idx}`} className="cb-fiscal-cal-cell cb-fiscal-cal-cell-empty" />
                }
                const dayItems = itemsByDay.get(day) ?? []
                const todayCell = isToday(day)
                return (
                  <div
                    key={day}
                    className={cn(
                      'cb-fiscal-cal-cell',
                      todayCell && 'cb-fiscal-cal-cell-today',
                      dayItems.length > 0 && 'cb-fiscal-cal-cell-has-events',
                    )}
                  >
                    <span
                      className={cn(
                        'cb-fiscal-cal-day-num',
                        todayCell && 'bg-brand text-primary-foreground',
                      )}
                    >
                      {day}
                    </span>
                    <div className="cb-fiscal-cal-pills">
                      {dayItems.slice(0, 3).map((item) => {
                        const style = getFiscalCategoryStyle(item.category)
                        const urgency = getFiscalUrgency(item.dueDate)
                        const hasNote = Boolean(getNote(item.id))
                        return (
                          <button
                            key={item.id}
                            type="button"
                            className={cn(
                              'cb-fiscal-cal-pill relative w-full text-left ring-1 ring-inset',
                              style.pill,
                              URGENCY_RING[urgency],
                              hasNote && 'pr-5',
                            )}
                            onClick={() => openItem(item)}
                            title={item.title}
                          >
                            <span className={cn('mr-1 inline-block h-1.5 w-1.5 shrink-0 rounded-full', style.dot)} />
                            <span className="truncate">{item.title}</span>
                            {hasNote ? (
                              <Sparkles className="absolute right-1 top-1/2 h-3 w-3 -translate-y-1/2 text-brand" />
                            ) : null}
                          </button>
                        )
                      })}
                      {dayItems.length > 3 ? (
                        <button
                          type="button"
                          className="text-caption font-medium text-brand hover:underline"
                          onClick={() => openItem(dayItems[3])}
                        >
                          +{dayItems.length - 3} mais
                        </button>
                      ) : null}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        ) : (
          <div className="cb-fiscal-cal-list">
            {monthItems.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                Sem prazos neste mês{categoryFilter ? ` para ${getFiscalCategoryStyle(categoryFilter).label}` : ''}.
              </p>
            ) : (
              monthItems.map((item) => {
                const style = getFiscalCategoryStyle(item.category)
                const urgency = getFiscalUrgency(item.dueDate)
                const hasNote = Boolean(getNote(item.id))
                return (
                  <button
                    key={item.id}
                    type="button"
                    className={cn(
                      'cb-fiscal-cal-list-row',
                      style.bg,
                      style.border,
                    )}
                    onClick={() => openItem(item)}
                  >
                    <div className="flex min-w-0 flex-1 flex-col gap-0.5 text-left">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={cn('rounded-full px-2 py-0.5 text-caption font-semibold uppercase', style.pill)}>
                          {style.label}
                        </span>
                        <span className="text-xs text-muted-foreground">{item.authority}</span>
                        {hasNote ? <Sparkles className="h-3.5 w-3.5 text-brand" /> : null}
                      </div>
                      <span className="font-medium text-foreground">{item.title}</span>
                      {item.notes ? (
                        <span className="line-clamp-1 text-xs text-muted-foreground">{item.notes}</span>
                      ) : null}
                    </div>
                    <div className="shrink-0 text-right">
                      <div className="text-sm font-semibold tabular-nums text-foreground">
                        {formatFiscalDate(item.dueDate).split(' ').slice(0, 2).join(' ')}
                      </div>
                      <div
                        className={cn(
                          'mt-0.5 text-caption font-medium',
                          urgency === 'overdue' && 'text-rose-600',
                          urgency === 'soon' && 'text-amber-700',
                          urgency === 'upcoming' && 'text-sky-700',
                          urgency === 'future' && 'text-muted-foreground',
                        )}
                      >
                        {formatFiscalDate(item.dueDate).split(' ').slice(2).join(' ')}
                      </div>
                    </div>
                  </button>
                )
              })
            )}
          </div>
        )}
      </div>

      <p className="shrink-0 flex items-center gap-2 text-xs text-muted-foreground">
        <CalendarDays className="h-3.5 w-3.5" />
        Toque num prazo para ver detalhes e adicionar notas internas. Compare com as obrigações dos clientes em Tarefas.
      </p>

      <FiscalCalendarDetailSheet
        item={selected}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        accountantNote={selected ? getNote(selected.id) : ''}
        onSaveNote={saveNote}
        clients={clients}
      />
    </FirmWorkspacePage>
  )
}
