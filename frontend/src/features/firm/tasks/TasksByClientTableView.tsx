import { ChevronLeft, ChevronRight, Info, Search } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import type { FormChangeEvent } from '@/shared/types/react-events'
import { Link } from 'react-router-dom'

import type { WorkspaceTask } from '@/infrastructure/api/contabil/tasks'
import type { ObligationRow } from '@/features/firm/obligations/obligationOperational'
import { assigneeInitials } from '@/features/firm/tasks/tasksWorkspaceUi'
import { mapObligationDisplayStatus } from '@/features/firm/tasks/tasksOperationsUtils'
import { Input } from '@/shared/components/ui/input'
import { cn } from '@/shared/lib/utils'
import type { Client } from '@/shared/types/clients'

const PAGE_SIZE = 12

type ClientRow = {
  client: Client
  overdue: number
  pending: number
  inProgress: number
  completed: number
  assignee: string
  loadPct: number
}

function loadTone(pct: number) {
  if (pct >= 70) return 'red'
  if (pct >= 40) return 'orange'
  return 'green'
}

export function TasksByClientTableView({
  clients,
  obligations,
  manualTasks,
  teamNames,
  onSelectClient,
}: {
  clients: Client[]
  obligations: ObligationRow[]
  manualTasks: WorkspaceTask[]
  teamNames: Map<string, string>
  onSelectClient: (id: string) => void
}) {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('todos')
  const [sort, setSort] = useState<'overdue' | 'load' | 'name'>('overdue')
  const [page, setPage] = useState(1)

  const rows = useMemo(() => {
    const out: ClientRow[] = []
    for (const client of clients) {
      if (client.status && client.status !== 'ACTIVE') continue
      const obs = obligations.filter((o) => String(o.clientId) === client._id)
      const tasks = manualTasks.filter((t) => t.clientId === client._id)
      const overdue =
        obs.filter((o) => mapObligationDisplayStatus(o) === 'overdue').length +
        tasks.filter((t) => t.isOverdue && !['DONE', 'ARCHIVED'].includes(t.status)).length
      const pending =
        obs.filter((o) => mapObligationDisplayStatus(o) === 'pending').length +
        tasks.filter((t) => t.status === 'TODO' || t.status === 'BACKLOG').length
      const inProgress =
        obs.filter((o) => mapObligationDisplayStatus(o) === 'in_progress').length +
        tasks.filter((t) => ['IN_PROGRESS', 'REVIEW', 'WAITING_CLIENT'].includes(t.status)).length
      const completed =
        obs.filter((o) => mapObligationDisplayStatus(o) === 'completed').length +
        tasks.filter((t) => t.status === 'DONE').length
      const open = overdue + pending + inProgress
      const total = open + completed
      const loadPct = total === 0 ? 0 : Math.min(100, Math.round((open / total) * 100))
      const assigneeIds = [
        ...obs.map((o) => (o as ObligationRow & { assigneeId?: string }).assigneeId),
        ...tasks.map((t) => t.assigneeId),
      ].filter(Boolean) as string[]
      const topAssignee = assigneeIds[0]
      out.push({
        client,
        overdue,
        pending,
        inProgress,
        completed,
        assignee: topAssignee ? teamNames.get(topAssignee) || '—' : '—',
        loadPct,
      })
    }
    return out
  }, [clients, obligations, manualTasks, teamNames])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    let list = rows.filter((r) => {
      if (q) {
        const hay = [r.client.name, r.client.fullName, r.client.taxId].filter(Boolean).join(' ').toLowerCase()
        if (!hay.includes(q)) return false
      }
      if (statusFilter === 'atraso' && r.overdue === 0) return false
      if (statusFilter === 'pendente' && r.pending === 0) return false
      return true
    })
    if (sort === 'overdue') list = [...list].sort((a, b) => b.overdue - a.overdue || b.loadPct - a.loadPct)
    else if (sort === 'load') list = [...list].sort((a, b) => b.loadPct - a.loadPct)
    else list = [...list].sort((a, b) => (a.client.fullName || a.client.name).localeCompare(b.client.fullName || b.client.name, 'pt-PT'))
    return list
  }, [rows, search, statusFilter, sort])

  useEffect(() => setPage(1), [search, statusFilter, sort])

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const pageItems = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const pageNumbers = useMemo(() => {
    const max = Math.min(pageCount, 5)
    const start = Math.max(1, Math.min(page, pageCount - max + 1))
    return Array.from({ length: max }, (_, i) => start + i)
  }, [page, pageCount])

  return (
    <>
      <div className="cb-tasks-toolbar">
        <div className="cb-tasks-search">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="h-8 rounded-md border-border/80 bg-card pl-8 text-xs"
            placeholder="Procurar empresa…"
            value={search}
            onChange={(e: FormChangeEvent) => setSearch(e.target.value)}
          />
        </div>
        <select
          className="cb-tasks-filter"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          aria-label="Estado"
        >
          <option value="todos">Estado: Todos</option>
          <option value="atraso">Com atraso</option>
          <option value="pendente">Com pendentes</option>
        </select>
        <select
          className="cb-tasks-filter"
          value={sort}
          onChange={(e) => setSort(e.target.value as typeof sort)}
          aria-label="Ordenar"
        >
          <option value="overdue">Ordenar: Mais atrasadas</option>
          <option value="load">Ordenar: Maior carga</option>
          <option value="name">Ordenar: Nome</option>
        </select>
      </div>

      <div className="cb-tasks-table-wrap cb-table-scroll flex-1">
        <table className="cb-tasks-table cb-table-mobile-cards">
          <thead className="cb-tasks-thead">
            <tr>
              <th>Empresa</th>
              <th className="w-28">NIF</th>
              <th className="w-20 text-center">Em atraso</th>
              <th className="w-20 text-center">Pendentes</th>
              <th className="w-20 text-center">Em curso</th>
              <th className="w-20 text-center">Concluídas</th>
              <th className="w-24">Responsável</th>
              <th className="w-32">
                <span className="inline-flex items-center gap-1">
                  Carga
                  <Info className="h-3 w-3 opacity-50" />
                </span>
              </th>
            </tr>
          </thead>
          <tbody>
            {pageItems.length === 0 ? (
              <tr>
                <td colSpan={8} className="cb-dash-empty">
                  Nenhuma empresa neste filtro.
                </td>
              </tr>
            ) : (
              pageItems.map((row) => {
                const tone = loadTone(row.loadPct)
                const nif = row.client.taxId
                const nifFmt =
                  nif && String(nif).replace(/\D/g, '').length === 9
                    ? `${String(nif).replace(/\D/g, '').slice(0, 3)} ${String(nif).replace(/\D/g, '').slice(3, 6)} ${String(nif).replace(/\D/g, '').slice(6)}`
                    : nif || '—'
                return (
                  <tr
                    key={row.client._id}
                    className="cb-tasks-row cursor-pointer"
                    onClick={() => onSelectClient(row.client._id)}
                  >
                    <td data-label="Empresa">
                      <Link
                        to={`/app/firm/clients/${encodeURIComponent(row.client._id)}`}
                        className="text-[13px] font-medium text-sky-600 hover:underline"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {row.client.fullName || row.client.name}
                      </Link>
                    </td>
                    <td className="text-xs tabular-nums text-muted-foreground" data-label="NIF">{nifFmt}</td>
                    <td className="text-center" data-label="Em atraso">
                      {row.overdue > 0 ? (
                        <span className="cb-pill cb-pill-red">{row.overdue}</span>
                      ) : (
                        <span className="text-xs text-muted-foreground">0</span>
                      )}
                    </td>
                    <td className="text-center text-xs tabular-nums" data-label="Pendentes">{row.pending}</td>
                    <td className="text-center text-xs tabular-nums" data-label="Em curso">{row.inProgress}</td>
                    <td className="text-center text-xs tabular-nums" data-label="Concluídas">{row.completed}</td>
                    <td className="text-xs" data-label="Responsável">{assigneeInitials(row.assignee)}</td>
                    <td data-label="Carga">
                      <div className="flex items-center gap-2">
                        <div className="cb-tasks-load-bar">
                          <div
                            className={cn(
                              'h-full rounded-full',
                              tone === 'red' && 'cb-tasks-load-fill-red',
                              tone === 'orange' && 'cb-tasks-load-fill-orange',
                              tone === 'green' && 'cb-tasks-load-fill-green',
                            )}
                            style={{ width: `${row.loadPct}%` }}
                          />
                        </div>
                        <span className="text-xs tabular-nums text-muted-foreground">{row.loadPct}%</span>
                      </div>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      <div className="cb-tasks-footer shrink-0">
        <span>
          {filtered.length === 0
            ? '0 empresas'
            : `${(page - 1) * PAGE_SIZE + 1}-${Math.min(page * PAGE_SIZE, filtered.length)} de ${filtered.length}`}
        </span>
        <div className="cb-tasks-pagination">
          <button
            type="button"
            className="cb-tasks-page-btn"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
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
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </>
  )
}
