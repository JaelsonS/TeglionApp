import { BarChart3, Calendar, CheckCircle2, ChevronLeft, ChevronRight, Clock } from 'lucide-react'
import { useMemo, useState } from 'react'

import type { WorkspaceTask } from '@/infrastructure/api/contabil/tasks'
import type { ObligationRow } from '@/features/firm/obligations/obligationOperational'
import {
  assigneeDistribution,
  assigneeInitials,
  buildPriorityRows,
  statusPillClass,
  upcomingDeadlines,
} from '@/features/firm/tasks/tasksWorkspaceUi'
import type { OverviewKpis } from '@/features/firm/tasks/tasksOperationsUtils'
import { cn } from '@/shared/lib/utils'

const PAGE_SIZE = 10

export function TasksOverviewPanel({
  kpis,
  obligations,
  manualTasks,
  teamNames,
  onSelectObligation,
  onSelectTask,
  onNavigateCalendar,
}: {
  kpis: OverviewKpis
  obligations: ObligationRow[]
  manualTasks: WorkspaceTask[]
  teamNames: Map<string, string>
  onSelectObligation: (id: string) => void
  onSelectTask: (t: WorkspaceTask) => void
  onNavigateCalendar: () => void
}) {
  const [page, setPage] = useState(1)
  const rows = useMemo(
    () => buildPriorityRows(obligations, manualTasks, teamNames),
    [obligations, manualTasks, teamNames],
  )
  const distribution = useMemo(
    () => assigneeDistribution(obligations, manualTasks, teamNames),
    [obligations, manualTasks, teamNames],
  )
  const deadlines = useMemo(
    () => upcomingDeadlines(obligations, manualTasks),
    [obligations, manualTasks],
  )

  const pageCount = Math.max(1, Math.ceil(rows.length / PAGE_SIZE))
  const pageItems = rows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const pageNumbers = useMemo(() => {
    const max = Math.min(pageCount, 5)
    const start = Math.max(1, Math.min(page, pageCount - max + 1))
    return Array.from({ length: max }, (_, i) => start + i)
  }, [page, pageCount])

  const taskById = useMemo(() => new Map(manualTasks.map((t) => [t.id, t])), [manualTasks])

  return (
    <>
      <div className="cb-tasks-kpi-row">
        <KpiCard label="Em atraso" value={kpis.overdue} tone="red" icon={Clock} />
        <KpiCard label="Para hoje" value={kpis.dueToday} tone="orange" icon={Calendar} />
        <KpiCard label="Esta semana" value={kpis.dueThisWeek} tone="blue" icon={BarChart3} />
        <KpiCard label="Concluídas (mês)" value={kpis.completedMonth} tone="green" icon={CheckCircle2} />
      </div>

      <div className="cb-tasks-overview-grid">
        <section className="min-w-0">
          <h2 className="cb-tasks-section-hd">Tarefas prioritárias</h2>
          <div className="cb-tasks-table-wrap cb-table-scroll">
            <table className="cb-tasks-table cb-table-mobile-cards">
              <thead className="cb-tasks-thead">
                <tr>
                  <th>Tarefa</th>
                  <th>Cliente</th>
                  <th className="w-24">Responsável</th>
                  <th className="w-20">Prazo</th>
                  <th className="w-28">Estado</th>
                </tr>
              </thead>
              <tbody>
                {pageItems.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="cb-dash-empty">
                      Sem tarefas prioritárias neste momento.
                    </td>
                  </tr>
                ) : (
                  pageItems.map((row) => (
                    <tr key={row.id} className="cb-tasks-row">
                      <td data-label="Tarefa">
                        <button
                          type="button"
                          className="text-left text-[13px] font-medium text-foreground hover:text-brand"
                          onClick={() => {
                            if (row.kind === 'obligation') {
                              const id = row.id.replace(/^ob-/, '')
                              onSelectObligation(id)
                            } else {
                              const t = taskById.get(row.id.replace(/^t-/, ''))
                              if (t) onSelectTask(t)
                            }
                          }}
                        >
                          {row.title}
                        </button>
                      </td>
                      <td className="text-xs text-muted-foreground" data-label="Cliente">{row.clientName}</td>
                      <td className="text-xs" data-label="Responsável">{assigneeInitials(row.assigneeName)}</td>
                      <td className="text-xs tabular-nums text-muted-foreground" data-label="Prazo">{row.dueLabel}</td>
                      <td data-label="Estado">
                        <span className={statusPillClass(row.statusTone)}>{row.statusLabel}</span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <div className="cb-tasks-footer mt-0 border-t-0 px-0 pt-2">
            <span>
              {rows.length === 0
                ? '0 tarefas'
                : `${(page - 1) * PAGE_SIZE + 1}-${Math.min(page * PAGE_SIZE, rows.length)} de ${rows.length} tarefas`}
            </span>
            <div className="cb-tasks-pagination">
              <button
                type="button"
                className="cb-tasks-page-btn"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                aria-label="Página anterior"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              {pageNumbers.map((n) => (
                <button
                  key={n}
                  type="button"
                  className={cn('cb-tasks-page-btn', n === page && 'cb-tasks-page-btn-active')}
                  onClick={() => setPage(n)}
                >
                  {n}
                </button>
              ))}
              <button
                type="button"
                className="cb-tasks-page-btn"
                disabled={page >= pageCount}
                onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
                aria-label="Página seguinte"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </section>

        <aside className="min-w-0 space-y-0">
          <div className="cb-tasks-widget">
            <h3 className="cb-tasks-section-hd">Distribuição por responsável</h3>
            <ul className="space-y-2.5">
              {distribution.length === 0 ? (
                <li className="text-xs text-muted-foreground">Sem dados.</li>
              ) : (
                distribution.map((d) => (
                  <li key={d.id} className="flex items-center gap-2 text-xs">
                    <span className="w-20 shrink-0 truncate font-medium">{d.name.split(' ')[0]} {d.name.split(' ')[1]?.[0] ? `${d.name.split(' ')[1][0]}.` : ''}</span>
                    <div className="cb-tasks-bar-track">
                      <div className="cb-tasks-bar-fill" style={{ width: `${d.pct}%` }} />
                    </div>
                    <span className="w-6 shrink-0 text-right tabular-nums text-muted-foreground">{d.count}</span>
                  </li>
                ))
              )}
            </ul>
          </div>

          <div className="cb-tasks-widget">
            <h3 className="cb-tasks-section-hd">Próximos prazos</h3>
            <ul>
              {deadlines.length === 0 ? (
                <li className="text-xs text-muted-foreground">Sem prazos próximos.</li>
              ) : (
                deadlines.map((d) => (
                  <li key={d.id} className="cb-tasks-deadline">
                    <Calendar
                      className={cn(
                        'mt-0.5 h-3.5 w-3.5 shrink-0',
                        d.tone === 'red' && 'text-red-600',
                        d.tone === 'orange' && 'text-orange-600',
                        d.tone === 'grey' && 'text-muted-foreground',
                      )}
                    />
                    <span className="min-w-0 flex-1 truncate">{d.title}</span>
                    <span
                      className={cn(
                        'shrink-0 tabular-nums font-medium',
                        d.tone === 'red' && 'text-red-600',
                        d.tone === 'orange' && 'text-orange-600',
                        d.tone === 'grey' && 'text-muted-foreground',
                      )}
                    >
                      {d.date}
                    </span>
                  </li>
                ))
              )}
            </ul>
            <button
              type="button"
              className="mt-2 text-xs font-medium text-sky-600 hover:underline"
              onClick={onNavigateCalendar}
            >
              Ver todos os prazos →
            </button>
          </div>
        </aside>
      </div>
    </>
  )
}

function KpiCard({
  label,
  value,
  tone,
  icon: Icon,
}: {
  label: string
  value: number
  tone: 'red' | 'orange' | 'blue' | 'green'
  icon: typeof Clock
}) {
  const ico =
    tone === 'red'
      ? 'cb-tasks-kpi-ico-red'
      : tone === 'orange'
        ? 'cb-tasks-kpi-ico-orange'
        : tone === 'blue'
          ? 'cb-tasks-kpi-ico-blue'
          : 'cb-tasks-kpi-ico-green'
  const val =
    tone === 'red'
      ? 'cb-tasks-kpi-val-red'
      : tone === 'orange'
        ? 'cb-tasks-kpi-val-orange'
        : tone === 'blue'
          ? 'cb-tasks-kpi-val-blue'
          : 'cb-tasks-kpi-val-green'

  return (
    <div className="cb-tasks-kpi">
      <span className={cn('cb-tasks-kpi-ico', ico)}>
        <Icon className="h-4 w-4" />
      </span>
      <div>
        <p className="cb-tasks-kpi-label">{label}</p>
        <p className={cn('cb-tasks-kpi-val', val)}>{value}</p>
      </div>
    </div>
  )
}
