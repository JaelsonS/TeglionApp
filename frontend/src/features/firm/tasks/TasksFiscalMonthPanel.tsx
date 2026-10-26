import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { CheckCircle2, ChevronDown, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

import { contabilObligationsApi } from '@/infrastructure/api'
import type { ObligationMonthMatrixGroup } from '@/infrastructure/api/contabil/obligations'
import { MONTH_NAMES_PT } from '@/shared/calendar'
import { Button } from '@/shared/components/ui/button'
import { EmptyState } from '@/shared/design-system'
import { formatPtDate } from '@/shared/utils/contabilLocale'
import { getErrorMessage } from '@/shared/utils/errors'
import { cn } from '@/shared/lib/utils'
import { statusPillClass } from '@/features/firm/tasks/tasksWorkspaceUi'

function currentYearMonth() {
  const n = new Date()
  return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, '0')}`
}

function shiftYearMonth(ym: string, delta: number) {
  const [y, m] = ym.split('-').map(Number)
  const d = new Date(y, m - 1 + delta, 1)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

function yearMonthLabel(ym: string) {
  const [y, m] = ym.split('-').map(Number)
  return `${MONTH_NAMES_PT[m - 1] || m} ${y}`
}

function itemStatusMeta(status: string): { label: string; tone: 'red' | 'orange' | 'blue' | 'green' } {
  const s = String(status || '').toUpperCase()
  if (s === 'DELIVERED') return { label: 'Tratado', tone: 'green' }
  if (s === 'OVERDUE') return { label: 'Em atraso', tone: 'red' }
  if (s === 'IN_PROGRESS') return { label: 'Em curso', tone: 'blue' }
  if (s === 'WAITING_CLIENT') return { label: 'À espera do cliente', tone: 'orange' }
  return { label: 'Pendente', tone: 'orange' }
}

export function TasksFiscalMonthPanel({
  onSelectObligation,
  onMutate,
}: {
  onSelectObligation: (id: string) => void
  onMutate?: () => void
}) {
  const qc = useQueryClient()
  const [yearMonth, setYearMonth] = useState(currentYearMonth)
  const [expanded, setExpanded] = useState<string | null>(null)

  const query = useQuery({
    queryKey: ['obligations-month-matrix', yearMonth],
    queryFn: () => contabilObligationsApi.getMonthMatrix(yearMonth),
  })

  const markTreated = useMutation({
    mutationFn: (id: string) => contabilObligationsApi.update(id, { status: 'DELIVERED' }),
    onSuccess: () => {
      toast.success('Obrigação marcada como tratada')
      void qc.invalidateQueries({ queryKey: ['obligations-month-matrix', yearMonth] })
      onMutate?.()
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  })

  const data = query.data
  const summary = data?.summary

  const groups = useMemo(() => data?.groups || [], [data])

  return (
    <div className="flex w-full min-w-0 flex-col gap-4 px-1 pb-2 pt-1 sm:px-0">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            aria-label="Mês anterior"
            onClick={() => setYearMonth((ym) => shiftYearMonth(ym, -1))}
          >
            <ChevronLeft className="h-4 w-4" aria-hidden />
          </Button>
          <span className="min-w-[9rem] text-center text-sm font-semibold tabular-nums">
            {yearMonthLabel(yearMonth)}
          </span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            aria-label="Mês seguinte"
            onClick={() => setYearMonth((ym) => shiftYearMonth(ym, 1))}
          >
            <ChevronRight className="h-4 w-4" aria-hidden />
          </Button>
        </div>
        {query.isFetching ? (
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" aria-hidden />
        ) : null}
      </div>

      {summary ? (
        <div className="cb-tasks-kpi-row">
          <Kpi label="Prazos" value={summary.groups} />
          <Kpi label="Clientes no mês" value={summary.total} />
          <Kpi label="Tratados" value={summary.treated} tone="green" />
          <Kpi label="Por tratar" value={summary.pending} tone={summary.pending ? 'orange' : 'green'} />
        </div>
      ) : null}

      {query.isLoading ? (
        <div className="flex flex-1 items-center justify-center py-16 text-sm text-muted-foreground">
          <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />A carregar mês fiscal…
        </div>
      ) : null}

      {query.isError ? (
        <EmptyState
          title="Não foi possível carregar o mês fiscal"
          description={getErrorMessage(query.error)}
        />
      ) : null}

      {!query.isLoading && !query.isError && groups.length === 0 ? (
        <EmptyState
          title="Sem obrigações com vencimento neste mês"
          description="Crie obrigações fiscais ou avance o mês para ver o progresso N/M por prazo."
        />
      ) : null}

      <ul className="flex flex-col gap-2">
        {groups.map((g) => (
          <MonthGroupRow
            key={g.key}
            group={g}
            open={expanded === g.key}
            onToggle={() => setExpanded((cur) => (cur === g.key ? null : g.key))}
            onSelectObligation={onSelectObligation}
            onMarkTreated={(id) => markTreated.mutate(id)}
            markingId={markTreated.isPending ? String(markTreated.variables || '') : null}
          />
        ))}
      </ul>

      {data?.note ? (
        <p className="max-w-3xl text-[12px] leading-relaxed text-muted-foreground">{data.note}</p>
      ) : null}
    </div>
  )
}

function Kpi({
  label,
  value,
  tone,
}: {
  label: string
  value: number
  tone?: 'green' | 'orange'
}) {
  return (
    <div className="cb-tasks-kpi">
      <p className="cb-tasks-kpi-label">{label}</p>
      <p
        className={cn(
          'cb-tasks-kpi-val tabular-nums',
          tone === 'green' && 'cb-tasks-kpi-val-green',
          tone === 'orange' && 'cb-tasks-kpi-val-orange',
        )}
      >
        {value}
      </p>
    </div>
  )
}

function MonthGroupRow({
  group,
  open,
  onToggle,
  onSelectObligation,
  onMarkTreated,
  markingId,
}: {
  group: ObligationMonthMatrixGroup
  open: boolean
  onToggle: () => void
  onSelectObligation: (id: string) => void
  onMarkTreated: (id: string) => void
  markingId: string | null
}) {
  const pct = group.total > 0 ? Math.round((group.treated / group.total) * 100) : 0

  return (
    <li className="overflow-hidden rounded-lg border border-border/80 bg-background">
      <button
        type="button"
        className="flex w-full items-center gap-3 px-3 py-3 text-left hover:bg-muted/40 sm:px-4"
        onClick={onToggle}
        aria-expanded={open}
      >
        <ChevronDown
          className={cn('h-4 w-4 shrink-0 text-muted-foreground transition', open && 'rotate-180')}
          aria-hidden
        />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
            <span className="text-[13px] font-semibold text-foreground">{group.typeLabel}</span>
            <span className="text-[12px] text-muted-foreground">
              vence {formatPtDate(group.dueDate, 'date')}
            </span>
            {group.complete ? (
              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700">
                <CheckCircle2 className="h-3.5 w-3.5" aria-hidden />
                Completo
              </span>
            ) : null}
          </div>
          <p className="mt-0.5 truncate text-[12px] text-muted-foreground">{group.title}</p>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
            <div
              className={cn('h-full rounded-full transition-all', group.complete ? 'bg-emerald-500' : 'bg-brand')}
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
        <div className="shrink-0 text-right">
          <p className="text-lg font-semibold tabular-nums tracking-tight text-foreground">
            {group.ratioLabel}
          </p>
          <p className="text-[11px] text-muted-foreground">tratados</p>
        </div>
      </button>

      {open ? (
        <div className="border-t border-border/70 bg-muted/20 px-3 py-2 sm:px-4">
          <ul className="divide-y divide-border/60">
            {group.items.map((item) => {
              const meta = itemStatusMeta(item.status)
              const treated = item.status === 'DELIVERED'
              return (
                <li
                  key={item.id}
                  className="flex flex-wrap items-center justify-between gap-2 py-2.5"
                >
                  <button
                    type="button"
                    className="min-w-0 flex-1 text-left"
                    onClick={() => onSelectObligation(item.id)}
                  >
                    <p className="truncate text-[13px] font-medium text-foreground hover:text-brand">
                      {item.clientName || 'Cliente'}
                    </p>
                    <p className="truncate text-[11px] text-muted-foreground">
                      {item.period ? `Período ${item.period}` : item.title || '—'}
                    </p>
                  </button>
                  <span className={statusPillClass(meta.tone)}>{meta.label}</span>
                  {!treated ? (
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="h-7 text-[11px]"
                      disabled={markingId === item.id}
                      onClick={() => onMarkTreated(item.id)}
                    >
                      {markingId === item.id ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
                      ) : (
                        'Marcar tratado'
                      )}
                    </Button>
                  ) : null}
                </li>
              )
            })}
          </ul>
        </div>
      ) : null}
    </li>
  )
}
