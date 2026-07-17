import { ChevronLeft, ChevronRight, MoreVertical, Plus, Upload } from 'lucide-react'
import { useEffect, useMemo, useState, useSyncExternalStore } from 'react'

import { FirmObligationDetailPanel } from '@/features/firm/components/FirmObligationDetailPanel'
import { ObligationCreatePanel } from '@/features/firm/obligations/ObligationCreatePanel'
import type { useObligationsHub } from '@/features/firm/obligations/useObligationsHub'
import { displayObligationTitle } from '@/features/firm/obligations/obligationOperational'
import {
  currentPeriodYm,
  formatPeriodLabel,
  obligationStatusLabel,
} from '@/features/firm/tasks/tasksOperationsUtils'
import { statusPillClass } from '@/features/firm/tasks/tasksWorkspaceUi'
import { Button } from '@/shared/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/shared/components/ui/dropdown-menu'
import {
  FirmSplitColumn,
  FirmSplitBody,
  FirmSplitHeader,
  FirmSplitHost,
} from '@/features/firm/FirmPageLayout'
import {
  Sheet,
  SheetContent,
} from '@/shared/components/ui/sheet'
import { formatNif } from '@/shared/utils/formatNif'
import { formatPtDate } from '@/shared/utils/contabilLocale'
import { safeDisplayText } from '@/shared/utils/safeDisplayText'
import { cn } from '@/shared/lib/utils'

type Hub = ReturnType<typeof useObligationsHub>

const PAGE_SIZE = 14

function useMinWidthXl() {
  return useSyncExternalStore(
    (onStoreChange) => {
      const mq = window.matchMedia('(min-width: 1280px)')
      mq.addEventListener('change', onStoreChange)
      return () => mq.removeEventListener('change', onStoreChange)
    },
    () => window.matchMedia('(min-width: 1280px)').matches,
    () => false,
  )
}

function periodicityLabel(ob: Hub['items'][0]) {
  const r = String(ob.recurrence || ob.periodicity || '').toLowerCase()
  if (/trimest/i.test(r)) return 'Trimestral'
  if (/mensal|month/i.test(r)) return 'Mensal'
  if (/anual|year/i.test(r)) return 'Anual'
  return 'Mensal'
}

export function TasksObligationsTableView({ hub }: { hub: Hub }) {
  const isDesktopSplit = useMinWidthXl()
  const period = currentPeriodYm()
  const [typeFilter, setTypeFilter] = useState('todos')
  const [monthFilter, setMonthFilter] = useState(period)
  const [statusFilter, setStatusFilter] = useState('todos')
  const [clientFilter, setClientFilter] = useState('todos')
  const [page, setPage] = useState(1)

  const clientById = hub.clientById

  const rows = useMemo(() => {
    return hub.items.filter((o) => {
      if (monthFilter !== 'todos' && String(o.period || '').slice(0, 7) !== monthFilter) return false
      if (clientFilter !== 'todos' && String(o.clientId) !== clientFilter) return false
      if (typeFilter !== 'todos' && String(o.type || '').toUpperCase() !== typeFilter.toUpperCase()) return false
      if (statusFilter !== 'todos') {
        const st = obligationStatusLabel(o)
        const map: Record<string, string> = {
          atraso: 'Em atraso',
          pendente: 'Pendente',
          curso: 'Em curso',
          concluida: 'Concluída',
        }
        if (st.label !== map[statusFilter]) return false
      }
      return !o.monthExcluded
    })
  }, [hub.items, typeFilter, monthFilter, statusFilter, clientFilter])

  useEffect(() => setPage(1), [typeFilter, monthFilter, statusFilter, clientFilter])

  const pageCount = Math.max(1, Math.ceil(rows.length / PAGE_SIZE))
  const pageItems = rows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const typeOptions = useMemo(() => {
    const s = new Set<string>()
    for (const o of hub.items) if (o.type) s.add(String(o.type).toUpperCase())
    return [...s].sort()
  }, [hub.items])

  const selected = hub.selected
  const clientName = selected
    ? safeDisplayText(
      selected.clientName ||
      clientById.get(String(selected.clientId))?.fullName ||
      clientById.get(String(selected.clientId))?.name,
      'Cliente',
    )
    : ''

  const pageNumbers = useMemo(() => {
    const max = Math.min(pageCount, 5)
    const start = Math.max(1, Math.min(page, pageCount - max + 1))
    return Array.from({ length: max }, (_, i) => start + i)
  }, [page, pageCount])

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-hidden">
      {hub.filters.showCreate ? (
        <ObligationCreatePanel
          open
          clients={hub.clients}
          templates={hub.templates}
          staff={hub.staff}
          initialType={hub.filters.createType ? (hub.filters.createType as any) : undefined}
          initialPeriod={hub.filters.createPeriod || undefined}
          initialDueDate={hub.filters.createDueDate || undefined}
          onClose={() =>
            hub.updateParams({
              create: null,
              createType: null,
              createPeriod: null,
              createDueDate: null,
            })
          }
          onCreated={() => void hub.refresh()}
        />
      ) : null}

      <div className="cb-tasks-toolbar shrink-0">
        <select
          className="cb-tasks-filter"
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          aria-label="Tipo"
        >
          <option value="todos">Tipo: Todas</option>
          {typeOptions.map((t) => (
            <option key={t} value={t}>
              Tipo: {t}
            </option>
          ))}
        </select>
        <select
          className="cb-tasks-filter"
          value={monthFilter}
          onChange={(e) => setMonthFilter(e.target.value)}
          aria-label="Mês"
        >
          <option value={period}>Mês: {formatPeriodLabel(period)}</option>
          <option value="todos">Mês: Todos</option>
        </select>
        <select
          className="cb-tasks-filter"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          aria-label="Estado"
        >
          <option value="todos">Estado: Todas</option>
          <option value="atraso">Em atraso</option>
          <option value="pendente">Pendente</option>
          <option value="curso">Em curso</option>
          <option value="concluida">Concluída</option>
        </select>
        <select
          className="cb-tasks-filter"
          value={clientFilter}
          onChange={(e) => setClientFilter(e.target.value)}
          aria-label="Empresa"
        >
          <option value="todos">Empresa: Todas</option>
          {hub.clients.map((c) => (
            <option key={c._id} value={c._id}>
              {c.fullName || c.name}
            </option>
          ))}
        </select>
        <div className="ml-auto">
          <Button
            type="button"
            className="mr-2 h-8 rounded-md px-3 text-xs"
            onClick={() => hub.updateParams({ create: '1', createType: null, createPeriod: null, createDueDate: null })}
          >
            <Plus className="mr-1.5 h-3.5 w-3.5" />
            Nova obrigação fiscal
          </Button>
          <Button type="button" className="h-8 rounded-md px-3 text-xs" variant="default">
            <Upload className="mr-1.5 h-3.5 w-3.5" />
            Exportar
          </Button>
        </div>
      </div>

      <FirmSplitHost className="cb-obligations-split-host min-h-0 flex-1">
        <FirmSplitColumn
          className={cn(
            'min-h-0 w-full flex-1 border-border/60 xl:min-w-0',
            hub.selectedId ? 'xl:w-[min(52%,720px)] xl:border-r' : 'xl:flex-1',
          )}
        >
          <div className="cb-tasks-table-wrap cb-table-scroll min-h-0 flex-1">
            <table className="cb-tasks-table cb-table-mobile-cards">
              <thead className="cb-tasks-thead">
                <tr>
                  <th>Obrigação</th>
                  <th>Empresa</th>
                  <th className="w-28">NIF</th>
                  <th className="w-24">Periodicidade</th>
                  <th className="w-24">Vencimento</th>
                  <th className="w-28">Estado</th>
                  <th className="w-10" />
                </tr>
              </thead>
              <tbody>
                {hub.loading ? (
                  <tr>
                    <td colSpan={7} className="cb-dash-empty">
                      A carregar obrigações…
                    </td>
                  </tr>
                ) : pageItems.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="cb-dash-empty">
                      Nenhuma obrigação neste filtro.
                    </td>
                  </tr>
                ) : (
                  pageItems.map((ob) => {
                    const st = obligationStatusLabel(ob)
                    const client = clientById.get(String(ob.clientId))
                    const nif = ob.clientTaxId || client?.taxId
                    return (
                      <tr
                        key={ob._id}
                        className={cn('cb-tasks-row cursor-pointer', hub.selectedId === ob._id && 'bg-brand/[0.06]')}
                        onClick={() => hub.selectObligation(ob._id)}
                      >
                        <td className="text-[13px] font-medium" data-label="Obrigação">{displayObligationTitle(ob)}</td>
                        <td className="text-xs" data-label="Empresa">{safeDisplayText(ob.clientName, '—')}</td>
                        <td className="text-xs tabular-nums text-muted-foreground" data-label="NIF">{formatNif(nif)}</td>
                        <td className="text-xs" data-label="Periodicidade">{periodicityLabel(ob)}</td>
                        <td className="text-xs tabular-nums" data-label="Vencimento">
                          {ob.dueDate ? formatPtDate(ob.dueDate, 'date') : '—'}
                        </td>
                        <td data-label="Estado">
                          <span className={statusPillClass(st.tone)}>{st.label}</span>
                        </td>
                        <td className="cb-table-mobile-actions" onClick={(e) => e.stopPropagation()}>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-7 w-7">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => hub.selectObligation(ob._id)}>
                                Abrir detalhe
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
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
              {rows.length === 0
                ? '0 obrigações'
                : `${(page - 1) * PAGE_SIZE + 1}-${Math.min(page * PAGE_SIZE, rows.length)} de ${rows.length}`}
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
              {pageCount > 5 ? <span className="px-1">…</span> : null}
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
        </FirmSplitColumn>

        <FirmSplitColumn
          className={cn(
            'hidden min-h-0 min-w-0 flex-1 xl:flex',
            !hub.selectedId && 'xl:hidden',
          )}
        >
          {selected ? (
            <>
              <FirmSplitHeader className="justify-between">
                <span className="truncate text-sm font-semibold">{displayObligationTitle(selected)}</span>
                <button
                  type="button"
                  className="rounded-md p-1.5 text-muted-foreground hover:bg-muted/60"
                  onClick={() => hub.selectObligation(null)}
                  aria-label="Fechar detalhe"
                >
                  ×
                </button>
              </FirmSplitHeader>
              <FirmSplitBody className="flex min-h-0 flex-1 flex-col overflow-hidden p-0">
                <FirmObligationDetailPanel
                  embedded
                  obligation={selected}
                  clientName={clientName}
                  onClose={() => hub.selectObligation(null)}
                  onUpdated={() => void hub.refresh()}
                />
              </FirmSplitBody>
            </>
          ) : null}
        </FirmSplitColumn>
      </FirmSplitHost>

      {hub.selectedId && !isDesktopSplit ? (
        <Sheet open onOpenChange={(open: boolean) => !open && hub.selectObligation(null)}>
          <SheetContent side="right" className="flex h-full max-h-dvh w-full flex-col overflow-hidden p-0 sm:max-w-lg">
            <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
              {selected ? (
                <FirmObligationDetailPanel
                  embedded
                  obligation={selected}
                  clientName={clientName}
                  onClose={() => hub.selectObligation(null)}
                  onUpdated={() => void hub.refresh()}
                />
              ) : null}
            </div>
          </SheetContent>
        </Sheet>
      ) : null}
    </div>
  )
}
