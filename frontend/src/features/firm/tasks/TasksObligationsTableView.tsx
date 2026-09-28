import { ChevronLeft, ChevronRight, MoreVertical, Pencil, Plus, Trash2, Upload } from 'lucide-react'
import { toast } from 'sonner'
import { useEffect, useMemo, useState } from 'react'

import { FirmObligationDetailPanel } from '@/features/firm/components/FirmObligationDetailPanel'
import { ObligationCreatePanel } from '@/features/firm/obligations/ObligationCreatePanel'
import { ObligationEditDialog } from '@/features/firm/obligations/ObligationEditDialog'
import {
  obligationHasRecurrenceSeries,
  obligationPeriodYm,
} from '@/features/firm/obligations/obligationRemoveHelpers'
import type { useObligationsHub } from '@/features/firm/obligations/useObligationsHub'
import { displayObligationTitle, type ObligationRow } from '@/features/firm/obligations/obligationOperational'
import {
  RecurrenceRemoveDialog,
  type RecurrenceRemoveScope,
} from '@/features/firm/tasks/RecurrenceRemoveDialog'
import { contabilObligationsApi } from '@/infrastructure/api'
import { getErrorMessage } from '@/shared/utils/errors'
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
import { ConfirmRemoveDialog } from '@/features/firm/components/ConfirmRemoveDialog'
import { FirmWorkspaceFocusDialog } from '@/features/firm/FirmWorkspaceFocusDialog'
import { formatNif } from '@/shared/utils/formatNif'
import { formatPtDate } from '@/shared/utils/contabilLocale'
import { safeDisplayText } from '@/shared/utils/safeDisplayText'
import { cn } from '@/shared/lib/utils'

type Hub = ReturnType<typeof useObligationsHub>

const PAGE_SIZE = 14

function periodicityLabel(ob: Hub['items'][0]) {
  const r = String(ob.recurrence || ob.periodicity || '').toLowerCase()
  if (/trimest/i.test(r)) return 'Trimestral'
  if (/mensal|month/i.test(r)) return 'Mensal'
  if (/anual|year/i.test(r)) return 'Anual'
  return 'Mensal'
}

export function TasksObligationsTableView({ hub }: { hub: Hub }) {
  const period = currentPeriodYm()
  const [typeFilter, setTypeFilter] = useState('todos')
  const [monthFilter, setMonthFilter] = useState('todos')
  const [statusFilter, setStatusFilter] = useState('todos')
  const [clientFilter, setClientFilter] = useState('todos')
  const [page, setPage] = useState(1)
  const [editObligation, setEditObligation] = useState<ObligationRow | null>(null)
  const [removeObligation, setRemoveObligation] = useState<ObligationRow | null>(null)
  const [removeScope, setRemoveScope] = useState<RecurrenceRemoveScope>('occurrence')
  const [removePending, setRemovePending] = useState(false)
  const [quickRemove, setQuickRemove] = useState<ObligationRow | null>(null)
  const [quickRemovePending, setQuickRemovePending] = useState(false)

  const clientById = hub.clientById

  const rows = useMemo(() => {
    const filtered = hub.items.filter((o) => {
      if (monthFilter !== 'todos') {
        const periodYm = String(o.period || '').slice(0, 7)
        const dueYm = String(o.dueDate || '').slice(0, 7)
        if (periodYm !== monthFilter && dueYm !== monthFilter) return false
      }
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
    return filtered.sort((a, b) => {
      const ar = obligationStatusLabel(a).label === 'Em atraso' ? 0 : 1
      const br = obligationStatusLabel(b).label === 'Em atraso' ? 0 : 1
      if (ar !== br) return ar - br
      return String(a.dueDate || '').localeCompare(String(b.dueDate || ''))
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
      ) : (
        <>
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
          <option value="todos">Mês: Todos</option>
          <option value={period}>Mês: {formatPeriodLabel(period)}</option>
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
          aria-label="Cliente"
        >
          <option value="todos">Cliente: Todos</option>
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

      <div className="flex min-h-0 flex-1 flex-col">
          <div className="cb-tasks-table-wrap cb-table-scroll min-h-0 flex-1">
            <table className="cb-tasks-table cb-table-mobile-cards">
              <thead className="cb-tasks-thead">
                <tr>
                  <th>Obrigação</th>
                  <th>Cliente</th>
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
                    const clientLabel =
                      ob.clientName ||
                      client?.fullName ||
                      client?.name ||
                      client?.displayName ||
                      '—'
                    const overdue = st.tone === 'red'
                    return (
                      <tr
                        key={ob._id}
                        className={cn(
                          'cb-tasks-row cursor-pointer',
                          hub.selectedId === ob._id && 'bg-brand/[0.06]',
                          overdue && 'border-l-2 border-l-red-500 bg-red-50/80',
                        )}
                        onClick={() => hub.selectObligation(ob._id)}
                      >
                        <td className="text-[13px] font-medium" data-label="Obrigação">{displayObligationTitle(ob)}</td>
                        <td className={cn('text-xs', overdue && 'font-semibold text-red-800')} data-label="Cliente">
                          {safeDisplayText(clientLabel, '—')}
                          {overdue ? <span className="ml-1 text-[10px] uppercase tracking-wide text-red-600">Atraso</span> : null}
                        </td>
                        <td className="text-xs tabular-nums text-muted-foreground" data-label="NIF">{formatNif(nif)}</td>
                        <td className="text-xs" data-label="Periodicidade">{periodicityLabel(ob)}</td>
                        <td className={cn('text-xs tabular-nums', overdue && 'font-semibold text-red-700')} data-label="Vencimento">
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
                              <DropdownMenuItem onClick={() => setEditObligation(ob)}>
                                <Pencil className="mr-2 h-4 w-4" />
                                Editar
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="text-destructive focus:text-destructive"
                                onClick={() => {
                                  if (obligationHasRecurrenceSeries(ob)) {
                                    setRemoveScope('occurrence')
                                    setRemoveObligation(ob)
                                    return
                                  }
                                  setQuickRemove(ob)
                                }}
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Remover
                              </DropdownMenuItem>
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
      </div>

      <FirmWorkspaceFocusDialog
        open={Boolean(hub.selectedId && selected)}
        onOpenChange={(open) => !open && hub.selectObligation(null)}
        title={selected ? displayObligationTitle(selected) : 'Obrigação'}
      >
        {selected ? (
          <FirmObligationDetailPanel
            embedded
            obligation={selected}
            clientName={clientName}
            staff={hub.staff}
            onClose={() => hub.selectObligation(null)}
            onUpdated={() => void hub.refresh()}
          />
        ) : null}
      </FirmWorkspaceFocusDialog>
        </>
      )}

      <ObligationEditDialog
        open={Boolean(editObligation)}
        onOpenChange={(open) => !open && setEditObligation(null)}
        obligation={editObligation}
        staff={hub.staff}
        clientName={
          editObligation
            ? editObligation.clientName ||
              clientById.get(String(editObligation.clientId))?.fullName ||
              clientById.get(String(editObligation.clientId))?.name
            : undefined
        }
        onSaved={() => void hub.refresh()}
      />

      {removeObligation ? (
        <RecurrenceRemoveDialog
          open
          onOpenChange={(open) => !open && setRemoveObligation(null)}
          entityLabel="obrigação"
          periodLabel={obligationPeriodYm(removeObligation) || undefined}
          scope={removeScope}
          onScopeChange={setRemoveScope}
          pending={removePending}
          onConfirm={async () => {
            setRemovePending(true)
            try {
              await contabilObligationsApi.remove(removeObligation._id, {
                scope: removeScope,
                month: obligationPeriodYm(removeObligation) || undefined,
              })
              toast.success(removeScope === 'series' ? 'Série desactivada' : 'Obrigação removida')
              setRemoveObligation(null)
              if (hub.selectedId === removeObligation._id) hub.selectObligation(null)
              void hub.refresh()
            } catch (err) {
              toast.error(getErrorMessage(err))
            } finally {
              setRemovePending(false)
            }
          }}
        />
      ) : null}

      <ConfirmRemoveDialog
        open={Boolean(quickRemove)}
        onOpenChange={(open) => !open && setQuickRemove(null)}
        title="Remover obrigação?"
        description="Esta obrigação deixa de aparecer na lista deste período. Pode voltar a criá-la manualmente se precisar."
        confirmLabel="Remover obrigação"
        pending={quickRemovePending}
        onConfirm={async () => {
          if (!quickRemove) return
          setQuickRemovePending(true)
          try {
            await contabilObligationsApi.remove(quickRemove._id, {
              scope: 'occurrence',
              month: obligationPeriodYm(quickRemove) || undefined,
            })
            toast.success('Obrigação removida')
            setQuickRemove(null)
            if (hub.selectedId === quickRemove._id) hub.selectObligation(null)
            void hub.refresh()
          } catch (err) {
            toast.error(getErrorMessage(err))
          } finally {
            setQuickRemovePending(false)
          }
        }}
      />
    </div>
  )
}
