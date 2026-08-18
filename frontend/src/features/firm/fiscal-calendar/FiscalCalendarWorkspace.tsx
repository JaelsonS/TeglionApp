import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Filter,
  LayoutGrid,
  List,
  Plus,
  Search,
  Settings2,
  Sparkles,
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import type { FormChangeEvent } from '@/shared/types/react-events'

import { FiscalCalendarConfigDialog } from '@/features/firm/fiscal-calendar/FiscalCalendarConfigDialog'
import { FiscalCalendarDetailSheet } from '@/features/firm/fiscal-calendar/FiscalCalendarDetailSheet'
import { AskMayaButton } from '@/features/maya'
import {
  buildEventPayload,
  FiscalEventFormDialog,
  type EventFormValues,
} from '@/features/firm/fiscal-calendar/FiscalEventFormDialog'
import {
  formatFiscalDate,
  getCategoryStyleByToken,
  getFiscalUrgency,
  KIND_LABELS,
  MONTH_NAMES_PT,
  STATUS_LABELS,
  URGENCY_RING,
} from '@/features/firm/fiscal-calendar/fiscalCalendarUtils'
import { FirmWorkspacePage } from '@/features/firm/FirmPageLayout'
import { contabilFiscalCalendarApi } from '@/infrastructure/api'
import { useFirmClientsDirectory } from '@/shared/hooks/queries/useFirmClientsDirectory'
import { useDebouncedValue } from '@/shared/hooks/useDebouncedValue'
import type { FirmFiscalEvent } from '@/infrastructure/api/contabil/fiscalCalendar'
import { CalendarMonthGrid, todayCivil } from '@/shared/calendar'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { useFirmBranding } from '@/shared/hooks/useFirmBranding'
import { cn } from '@/shared/lib/utils'
import { getErrorMessage } from '@/shared/utils/errors'

type ViewMode = 'month' | 'list' | 'year'

export function FiscalCalendarWorkspace() {
  const { firm } = useFirmBranding()
  const firmKey = firm?._id ?? firm?.id ?? 'default'
  const queryClient = useQueryClient()

  const now = new Date()
  const [cursor, setCursor] = useState({ year: now.getFullYear(), month: now.getMonth() })
  const [view, setView] = useState<ViewMode>('month')
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null)
  const [kindFilter, setKindFilter] = useState<'FISCAL' | 'INTERNAL' | null>(null)
  const [statusFilter, setStatusFilter] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebouncedValue(search, 400)
  const [showInactive, setShowInactive] = useState(false)
  const [selected, setSelected] = useState<FirmFiscalEvent | null>(null)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<FirmFiscalEvent | null>(null)
  const [editScope, setEditScope] = useState<'series' | 'occurrence'>('series')
  const [configOpen, setConfigOpen] = useState(false)
  const [onboardingDismissed, setOnboardingDismissed] = useState(false)

  // Fetch full year so month navigation and recurrence stay consistent.
  const fetchRange = useMemo(
    () => ({ from: `${cursor.year}-01-01`, to: `${cursor.year}-12-31` }),
    [cursor.year],
  )

  const workspaceQuery = useQuery({
    queryKey: [
      'fiscal-calendar-workspace',
      firmKey,
      fetchRange.from,
      fetchRange.to,
      categoryFilter,
      kindFilter,
      statusFilter,
      debouncedSearch,
      showInactive,
    ],
    queryFn: () =>
      contabilFiscalCalendarApi.getWorkspace({
        from: fetchRange.from,
        to: fetchRange.to,
        categoryId: categoryFilter,
        eventKind: kindFilter,
        status: statusFilter,
        search: debouncedSearch.trim() || null,
        includeInactive: showInactive,
      }),
    staleTime: 30_000,
  })

  const { data: clientsRes } = useFirmClientsDirectory({ limit: 500 })
  const clients = clientsRes?.items || []

  const calendar = workspaceQuery.data?.calendar ?? null
  const categories = workspaceQuery.data?.categories ?? []
  const allEvents = workspaceQuery.data?.events ?? []
  const summary = workspaceQuery.data?.summary
  const [prefApplied, setPrefApplied] = useState(false)

  useEffect(() => {
    if (prefApplied || !calendar?.preferences?.defaultView) return
    setView(calendar.preferences.defaultView)
    setPrefApplied(true)
  }, [calendar?.preferences?.defaultView, prefApplied])

  const monthItems = useMemo(() => {
    const m = String(cursor.month + 1).padStart(2, '0')
    return allEvents.filter((i) => String(i.startDate || '').slice(5, 7) === m)
  }, [allEvents, cursor.month])

  const itemsByDay = useMemo(() => {
    const map = new Map<number, FirmFiscalEvent[]>()
    for (const item of monthItems) {
      const day = Number(item.startDate?.slice(8, 10))
      if (!day) continue
      if (!map.has(day)) map.set(day, [])
      map.get(day)!.push(item)
    }
    return map
  }, [monthItems])

  const yearByMonth = useMemo(() => {
    const buckets: FirmFiscalEvent[][] = Array.from({ length: 12 }, () => [])
    for (const item of allEvents) {
      const m = Number(item.startDate?.slice(5, 7))
      if (m >= 1 && m <= 12) buckets[m - 1].push(item)
    }
    return buckets
  }, [allEvents])

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: ['fiscal-calendar-workspace'] })
  }

  const saveMutation = useMutation({
    mutationFn: async (values: EventFormValues) => {
      const payload = buildEventPayload(values)
      if (editing?.id) {
        return contabilFiscalCalendarApi.updateEvent(editing.id, payload)
      }
      return contabilFiscalCalendarApi.createEvent(payload)
    },
    onSuccess: () => {
      toast.success(editing ? 'Evento atualizado' : 'Evento criado')
      setFormOpen(false)
      setEditing(null)
      invalidate()
    },
    onError: (err) => toast.error('Não foi possível guardar', { description: getErrorMessage(err) }),
  })

  const importMutation = useMutation({
    mutationFn: () => contabilFiscalCalendarApi.importTemplate(cursor.year),
    onSuccess: (res) => {
      toast.success('Modelo importado', {
        description: `${res.createdCount || 0} eventos adicionados${res.skippedCount ? ` · ${res.skippedCount} já existiam` : ''}`,
      })
      invalidate()
    },
    onError: (err) => toast.error('Importação falhou', { description: getErrorMessage(err) }),
  })

  const openItem = (item: FirmFiscalEvent) => {
    setSelected(item)
    setSheetOpen(true)
  }

  const openCreate = () => {
    setEditing(null)
    setEditScope('series')
    setFormOpen(true)
  }

  const openEdit = (event: FirmFiscalEvent, scope: 'series' | 'occurrence') => {
    setEditing(event)
    setEditScope(scope)
    setSheetOpen(false)
    setFormOpen(true)
  }

  const goToday = () => setCursor({ year: now.getFullYear(), month: now.getMonth() })
  const goPrev = () => {
    if (view === 'year') {
      setCursor((c) => ({ ...c, year: c.year - 1 }))
      return
    }
    setCursor((c) => (c.month === 0 ? { year: c.year - 1, month: 11 } : { year: c.year, month: c.month - 1 }))
  }
  const goNext = () => {
    if (view === 'year') {
      setCursor((c) => ({ ...c, year: c.year + 1 }))
      return
    }
    setCursor((c) => (c.month === 11 ? { year: c.year + 1, month: 0 } : { year: c.year, month: c.month + 1 }))
  }

  const isEmpty = !workspaceQuery.isLoading && allEvents.length === 0 && !search && !categoryFilter && !kindFilter && !statusFilter
  const showOnboarding = isEmpty && !onboardingDismissed && !workspaceQuery.isError

  const activeCategories = categories.filter((c) => c.isActive || showInactive)

  function resolveStyle(event: FirmFiscalEvent) {
    const cat = categories.find((c) => c.id === event.categoryId)
    return getCategoryStyleByToken(event.colorToken || cat?.colorToken, cat?.name || 'Evento')
  }

  return (
    <FirmWorkspacePage className="cb-fiscal-cal-page min-h-0 flex-1">
      <header className="cb-fiscal-cal-header shrink-0">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand/10 text-brand">
                <CalendarDays className="h-5 w-5" aria-hidden />
              </div>
              <div className="min-w-0">
                <h1 className="cb-operational-page-title font-display sm:text-2xl">
                  {calendar?.name || 'Calendário Fiscal'}
                </h1>
                <p className="cb-operational-page-sub text-sm">
                  {calendar?.description ||
                    'Organize e acompanhe os principais prazos e obrigações fiscais do seu escritório.'}
                </p>
              </div>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <AskMayaButton intentId="fiscal-calendar" />
            <Button type="button" variant="outline" size="sm" className="gap-1.5" onClick={() => setConfigOpen(true)}>
              <Settings2 className="h-4 w-4" />
              Configurar
            </Button>
            <Button type="button" size="sm" className="gap-1.5" onClick={openCreate}>
              <Plus className="h-4 w-4" />
              Novo evento
            </Button>
          </div>
        </div>

        {summary && (summary.upcoming7 > 0 || summary.upcoming30 > 0) ? (
          <div className="mt-3 flex flex-wrap gap-3 text-xs text-muted-foreground">
            <span>
              <strong className="font-semibold text-foreground">Próximos prazos</strong>
              {' · '}
              {summary.upcoming7} nos próximos 7 dias
              {' · '}
              {summary.upcoming30} nos próximos 30 dias
            </span>
          </div>
        ) : null}
      </header>

      {showOnboarding ? (
        <div className="shrink-0 rounded-2xl border border-dashed border-brand/30 bg-brand/5 px-4 py-5 sm:px-6">
          <div className="flex items-start gap-3">
            <Sparkles className="mt-0.5 h-5 w-5 text-brand" aria-hidden />
            <div className="min-w-0 flex-1">
              <h2 className="font-semibold text-foreground">Configure o seu calendário fiscal</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                O calendário ainda está vazio. Adicione categorias e eventos, ou importe o modelo Portugal para começar
                rapidamente.
              </p>
              <ol className="mt-3 list-decimal space-y-1 pl-4 text-sm text-muted-foreground">
                <li>Adicione as suas categorias</li>
                <li>Crie os seus eventos</li>
                <li>Defina recorrências</li>
                <li>Comece a acompanhar os prazos</li>
              </ol>
              <div className="mt-4 flex flex-wrap gap-2">
                <Button type="button" size="sm" onClick={openCreate}>
                  + Criar evento
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={importMutation.isPending}
                  onClick={() => importMutation.mutate()}
                >
                  {importMutation.isPending ? 'A importar…' : 'Importar modelo Portugal'}
                </Button>
                <Button type="button" size="sm" variant="ghost" onClick={() => setConfigOpen(true)}>
                  Categorias
                </Button>
                <Button type="button" size="sm" variant="ghost" onClick={() => setOnboardingDismissed(true)}>
                  Dispensar
                </Button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      <div className="cb-fiscal-cal-toolbar shrink-0">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            className="flex h-8 w-8 items-center justify-center rounded-md bg-brand text-primary-foreground"
            onClick={goPrev}
            aria-label={view === 'year' ? 'Ano anterior' : 'Mês anterior'}
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          {view !== 'year' ? (
            <span className="min-w-[7rem] text-center text-sm font-semibold">
              {MONTH_NAMES_PT[cursor.month]} {cursor.year}
            </span>
          ) : (
            <span className="min-w-[4rem] text-center text-sm font-semibold">{cursor.year}</span>
          )}
          <button
            type="button"
            className="flex h-8 w-8 items-center justify-center rounded-md bg-brand text-primary-foreground"
            onClick={goNext}
            aria-label={view === 'year' ? 'Ano seguinte' : 'Mês seguinte'}
          >
            <ChevronRight className="h-4 w-4" />
          </button>
          <button
            type="button"
            className="rounded-md border border-border/60 px-2.5 py-1 text-xs font-medium text-muted-foreground hover:bg-muted"
            onClick={goToday}
          >
            Hoje
          </button>
          <select
            className="h-8 rounded-md border border-border/60 bg-card px-2 text-sm font-semibold"
            value={cursor.year}
            onChange={(e: FormChangeEvent) => setCursor((c) => ({ ...c, year: Number(e.target.value) }))}
            aria-label="Ano"
          >
            {Array.from({ length: 11 }, (_, i) => now.getFullYear() - 2 + i).map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="h-8 w-40 pl-8 text-sm sm:w-52"
              placeholder="Pesquisar…"
              value={search}
              onChange={(e: FormChangeEvent) => setSearch(e.target.value)}
              aria-label="Pesquisar eventos"
            />
          </div>
          <div className="flex items-center gap-1 rounded-lg border border-border/60 bg-card p-1">
            {(
              [
                ['month', LayoutGrid, 'Mês'],
                ['list', List, 'Lista'],
                ['year', CalendarDays, 'Ano'],
              ] as const
            ).map(([id, Icon, label]) => (
              <button
                key={id}
                type="button"
                className={cn(
                  'flex h-7 items-center gap-1 rounded-md px-2 text-xs font-medium transition-colors',
                  view === id ? 'bg-brand text-primary-foreground' : 'text-muted-foreground hover:bg-muted',
                )}
                onClick={() => setView(id)}
                aria-label={`Vista ${label}`}
                aria-pressed={view === id}
              >
                <Icon className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">{label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex shrink-0 flex-wrap items-center gap-1.5">
        <Filter className="mr-1 h-3.5 w-3.5 text-muted-foreground" aria-hidden />
        <button
          type="button"
          className={cn(
            'rounded-full px-2.5 py-1 text-xs font-medium',
            !categoryFilter ? 'bg-brand text-primary-foreground' : 'bg-muted text-muted-foreground',
          )}
          onClick={() => setCategoryFilter(null)}
        >
          Todas
        </button>
        {activeCategories.map((cat) => {
          const style = getCategoryStyleByToken(cat.colorToken, cat.name)
          const active = categoryFilter === cat.id
          return (
            <button
              key={cat.id}
              type="button"
              className={cn(
                'rounded-full px-2.5 py-1 text-xs font-medium',
                active ? style.pill : 'bg-muted/60 text-muted-foreground hover:text-foreground',
              )}
              onClick={() => setCategoryFilter(active ? null : cat.id)}
            >
              {cat.name}
            </button>
          )
        })}
        <span className="mx-1 h-4 w-px bg-border" />
        {(['FISCAL', 'INTERNAL'] as const).map((kind) => (
          <button
            key={kind}
            type="button"
            className={cn(
              'rounded-full px-2.5 py-1 text-xs font-medium',
              kindFilter === kind ? 'bg-brand text-primary-foreground' : 'bg-muted/60 text-muted-foreground',
            )}
            onClick={() => setKindFilter(kindFilter === kind ? null : kind)}
          >
            {KIND_LABELS[kind]}
          </button>
        ))}
        <button
          type="button"
          className={cn(
            'rounded-full px-2.5 py-1 text-xs font-medium',
            showInactive ? 'bg-brand text-primary-foreground' : 'bg-muted/60 text-muted-foreground',
          )}
          onClick={() => setShowInactive((v) => !v)}
        >
          Incluir inativos
        </button>
        <select
          className="h-7 rounded-full border-0 bg-muted/60 px-2 text-xs text-muted-foreground"
          value={statusFilter || ''}
          onChange={(e: FormChangeEvent) => setStatusFilter(e.target.value || null)}
          aria-label="Filtrar por estado"
        >
          <option value="">Todos os estados</option>
          {Object.entries(STATUS_LABELS).map(([k, label]) => (
            <option key={k} value={k}>
              {label}
            </option>
          ))}
        </select>
      </div>

      <div className={cn('cb-fiscal-cal-body min-h-0 flex-1', view === 'month' && 'hidden md:block')}>
        {workspaceQuery.isError ? (
          <div className="flex h-full min-h-[16rem] flex-col items-center justify-center gap-2 px-4 text-center">
            <p className="font-medium text-foreground">Não foi possível carregar o calendário.</p>
            <p className="text-sm text-muted-foreground">
              {getErrorMessage(workspaceQuery.error) || 'Verifique a ligação ou se a migration foi aplicada.'}
            </p>
            <Button type="button" size="sm" variant="outline" onClick={() => void workspaceQuery.refetch()}>
              Tentar novamente
            </Button>
          </div>
        ) : workspaceQuery.isLoading ? (
          <div className="h-full min-h-[20rem] animate-pulse rounded-xl bg-muted/40" />
        ) : isEmpty ? (
          <div className="flex h-full min-h-[16rem] flex-col items-center justify-center gap-3 px-4 text-center">
            <CalendarDays className="h-10 w-10 text-muted-foreground/50" />
            <div>
              <p className="font-medium text-foreground">O seu calendário fiscal ainda está vazio.</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Comece adicionando um evento ou utilize um modelo para configurar rapidamente.
              </p>
            </div>
            <div className="flex flex-wrap justify-center gap-2">
              <Button type="button" size="sm" onClick={openCreate}>
                + Criar evento
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={importMutation.isPending}
                onClick={() => importMutation.mutate()}
              >
                Importar modelo Portugal
              </Button>
            </div>
          </div>
        ) : view === 'month' ? (
          <div className="cb-fiscal-cal-grid-wrap">
            <CalendarMonthGrid
              year={cursor.year}
              monthIndex={cursor.month}
              renderDay={(day, todayCell) => {
                const dayItems = itemsByDay.get(day) ?? []
                return (
                  <>
                    <span className={cn('cb-fiscal-cal-day-num', todayCell && 'bg-brand text-primary-foreground')}>
                      {day}
                    </span>
                    <div className="cb-fiscal-cal-pills">
                      {dayItems.slice(0, 3).map((item) => {
                        const style = resolveStyle(item)
                        const urgency = getFiscalUrgency(item.startDate)
                        return (
                          <button
                            key={item.occurrenceId || item.id}
                            type="button"
                            className={cn(
                              'cb-fiscal-cal-pill relative w-full text-left ring-1 ring-inset',
                              style.pill,
                              URGENCY_RING[urgency],
                              item.eventKind === 'INTERNAL' && 'border-dashed',
                            )}
                            onClick={() => openItem(item)}
                            title={item.title}
                          >
                            <span className={cn('mr-1 inline-block h-1.5 w-1.5 shrink-0 rounded-full', style.dot)} />
                            <span className="truncate">{item.title}</span>
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
                  </>
                )
              }}
            />
          </div>
        ) : view === 'year' ? (
          <div className="grid h-full min-h-0 grid-cols-1 gap-3 overflow-y-auto p-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {MONTH_NAMES_PT.map((name, mi) => (
              <button
                key={name}
                type="button"
                className="rounded-xl border border-border/60 bg-card p-3 text-left transition-colors hover:bg-muted/30"
                onClick={() => {
                  setCursor((c) => ({ ...c, month: mi }))
                  setView('month')
                }}
              >
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-sm font-semibold">{name}</span>
                  <span className="text-xs text-muted-foreground">{yearByMonth[mi].length}</span>
                </div>
                <ul className="space-y-1">
                  {yearByMonth[mi].slice(0, 4).map((ev) => {
                    const style = resolveStyle(ev)
                    return (
                      <li key={ev.occurrenceId || ev.id} className="flex items-center gap-1.5 truncate text-xs">
                        <span className={cn('h-1.5 w-1.5 shrink-0 rounded-full', style.dot)} />
                        <span className="truncate text-muted-foreground">
                          {ev.startDate.slice(8, 10)} · {ev.title}
                        </span>
                      </li>
                    )
                  })}
                  {yearByMonth[mi].length === 0 ? (
                    <li className="text-xs text-muted-foreground/70">Sem eventos</li>
                  ) : null}
                </ul>
              </button>
            ))}
          </div>
        ) : (
          <div className="cb-fiscal-cal-list">
            {monthItems.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                Sem eventos neste mês{categoryFilter ? ' para a categoria selecionada' : ''}.
              </p>
            ) : (
              monthItems.map((item) => {
                const style = resolveStyle(item)
                const urgency = getFiscalUrgency(item.startDate)
                return (
                  <button
                    key={item.occurrenceId || item.id}
                    type="button"
                    className={cn('cb-fiscal-cal-list-row', style.bg, style.border)}
                    onClick={() => openItem(item)}
                  >
                    <div className="flex min-w-0 flex-1 flex-col gap-0.5 text-left">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={cn('rounded-full px-2 py-0.5 text-caption font-semibold uppercase', style.pill)}>
                          {style.label}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {KIND_LABELS[item.eventKind]} · {STATUS_LABELS[item.status]}
                        </span>
                      </div>
                      <span className="font-medium text-foreground">{item.title}</span>
                      {item.description ? (
                        <span className="line-clamp-1 text-xs text-muted-foreground">{item.description}</span>
                      ) : null}
                    </div>
                    <div className="shrink-0 text-right">
                      <div className="text-sm font-semibold tabular-nums">{formatFiscalDate(item.startDate)}</div>
                      <div
                        className={cn(
                          'mt-0.5 text-caption font-medium',
                          urgency === 'overdue' && 'text-rose-600',
                          urgency === 'soon' && 'text-amber-700',
                          urgency === 'upcoming' && 'text-sky-700',
                          urgency === 'future' && 'text-muted-foreground',
                        )}
                      >
                        {item.isRecurring ? 'Recorrente' : todayCivil() === item.startDate ? 'Hoje' : ''}
                      </div>
                    </div>
                  </button>
                )
              })
            )}
          </div>
        )}
      </div>

      {/* Mobile: always prioritize list */}
      <div className="cb-fiscal-cal-body min-h-0 flex-1 md:hidden">
        {workspaceQuery.isLoading ? (
          <div className="h-40 animate-pulse rounded-xl bg-muted/40" />
        ) : (
          <div className="cb-fiscal-cal-list">
            {(view === 'year' ? allEvents : monthItems).length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">Sem eventos neste período.</p>
            ) : (
              (view === 'year' ? allEvents : monthItems).map((item) => {
                const style = resolveStyle(item)
                return (
                  <button
                    key={`m-${item.occurrenceId || item.id}`}
                    type="button"
                    className={cn('cb-fiscal-cal-list-row', style.bg, style.border)}
                    onClick={() => openItem(item)}
                  >
                    <div className="min-w-0 flex-1 text-left">
                      <div className="text-xs text-muted-foreground">{formatFiscalDate(item.startDate)}</div>
                      <div className="font-medium">{item.title}</div>
                    </div>
                  </button>
                )
              })
            )}
          </div>
        )}
      </div>

      <FiscalCalendarDetailSheet
        item={selected}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        categories={categories}
        clients={clients}
        onEdit={openEdit}
        onDuplicate={async (event) => {
          try {
            await contabilFiscalCalendarApi.duplicateEvent(event.id)
            toast.success('Evento duplicado')
            invalidate()
          } catch (err) {
            toast.error('Não foi possível duplicar', { description: getErrorMessage(err) })
          }
        }}
        onArchive={async (event) => {
          try {
            await contabilFiscalCalendarApi.archiveEvent(event.id)
            toast.success('Evento arquivado')
            setSheetOpen(false)
            invalidate()
          } catch (err) {
            toast.error('Não foi possível arquivar', { description: getErrorMessage(err) })
          }
        }}
        onToggleActive={async (event) => {
          try {
            await contabilFiscalCalendarApi.setEventActive(event.id, !event.isActive)
            toast.success(event.isActive ? 'Evento desativado' : 'Evento ativado')
            invalidate()
          } catch (err) {
            toast.error('Não foi possível atualizar', { description: getErrorMessage(err) })
          }
        }}
        onMarkCompleted={async (event) => {
          try {
            await contabilFiscalCalendarApi.updateEvent(event.id, {
              status: 'COMPLETED',
              scope: event.isRecurring ? 'occurrence' : 'series',
              occurrenceDate: event.occurrenceDate || event.startDate,
            })
            toast.success('Marcado como concluído')
            invalidate()
          } catch (err) {
            toast.error('Não foi possível atualizar', { description: getErrorMessage(err) })
          }
        }}
      />

      <FiscalEventFormDialog
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open)
          if (!open) setEditing(null)
        }}
        categories={categories}
        initialEvent={editing}
        editScope={editScope}
        saving={saveMutation.isPending}
        onSubmit={(values) => saveMutation.mutateAsync(values)}
      />

      <FiscalCalendarConfigDialog
        open={configOpen}
        onOpenChange={setConfigOpen}
        calendar={calendar}
        categories={categories}
        onSaved={invalidate}
      />
    </FirmWorkspacePage>
  )
}
