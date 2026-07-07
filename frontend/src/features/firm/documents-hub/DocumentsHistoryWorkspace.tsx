import { useMemo, useState } from 'react'
import { Download, Trash2 } from 'lucide-react'
import { toast } from 'sonner'

import { ConfirmDialog } from '@/shared/components/modals/ConfirmDialog'
import { useDocumentsHub } from '@/features/firm/documents/useDocumentsHub'
import {
  buildDocumentsHistoryRows,
  exportHistoryCsv,
  historyStatusLabel,
  historyStatusPill,
  type DocumentsHistoryRow,
} from '@/features/firm/documents-hub/documentsHistoryUtils'
import { Button } from '@/shared/components/ui/button'
import { Checkbox } from '@/shared/components/ui/checkbox'
import { contabilDocumentsApi } from '@/infrastructure/api'
import { emitAppDataChanged } from '@/shared/utils/appEvents'
import { formatDateTime } from '@/shared/utils/date'
import { getErrorMessage } from '@/shared/utils/errors'
import { cn } from '@/shared/lib/utils'

export function DocumentsHistoryWorkspace() {
  const hub = useDocumentsHub()
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const sourceItems = useMemo(() => {
    let list = hub.items
    if (hub.filters.clientId) {
      list = list.filter((d) => d.clientId === hub.filters.clientId)
    }
    if (hub.filters.period) {
      list = list.filter(
        (d) =>
          d.period === hub.filters.period || d.obligationPeriod === hub.filters.period,
      )
    }
    const q = hub.filters.q.trim().toLowerCase()
    if (q) {
      list = list.filter(
        (d) =>
          (d.title || d.originalName || '').toLowerCase().includes(q) ||
          (d.clientName || '').toLowerCase().includes(q),
      )
    }
    return list
  }, [hub.items, hub.filters])

  const filteredRows = useMemo(() => buildDocumentsHistoryRows(sourceItems), [sourceItems])

  const selectedRows = useMemo(
    () => filteredRows.filter((r) => selectedIds.has(r.id)),
    [filteredRows, selectedIds],
  )

  const allSelected =
    filteredRows.length > 0 && filteredRows.every((r) => selectedIds.has(r.id))

  const toggleRow = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const toggleAll = () => {
    if (allSelected) setSelectedIds(new Set())
    else setSelectedIds(new Set(filteredRows.map((r) => r.id)))
  }

  const documentIdsToDelete = useMemo(
    () => [...new Set(selectedRows.flatMap((r) => r.documentIds))],
    [selectedRows],
  )

  const handleDelete = async () => {
    if (documentIdsToDelete.length === 0) return
    setDeleting(true)
    try {
      for (const id of documentIdsToDelete) {
        await contabilDocumentsApi.remove(id)
      }
      toast.success(
        documentIdsToDelete.length === 1
          ? 'Registo removido'
          : `${documentIdsToDelete.length} documentos removidos`,
      )
      setSelectedIds(new Set())
      setDeleteOpen(false)
      emitAppDataChanged({ scope: 'documents' })
      await hub.refresh()
    } catch (err) {
      toast.error('Não foi possível apagar', { description: getErrorMessage(err) })
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="cb-docs-workspace">
      <div className="cb-docs-toolbar">
        <select
          className="cb-docs-filter"
          value={hub.filters.period || ''}
          onChange={(e) => hub.updateParams({ period: e.target.value || null })}
          aria-label="Filtrar período"
        >
          <option value="">Período: Todos</option>
          {hub.periodOptions.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>
        <select
          className="cb-docs-filter"
          value={hub.filters.clientId || ''}
          onChange={(e) =>
            hub.updateParams({ clientId: e.target.value || null })
          }
          aria-label="Filtrar cliente"
        >
          <option value="">Cliente: Todos</option>
          {hub.clients.map((c) => (
            <option key={c._id} value={c._id}>
              {c.fullName || c.name || c.displayName}
            </option>
          ))}
        </select>
      </div>

      {selectedRows.length > 0 ? (
        <div className="cb-docs-history-actions">
          <p className="text-xs text-muted-foreground">
            {selectedRows.length} linha{selectedRows.length === 1 ? '' : 's'} seleccionada
            {selectedRows.length === 1 ? '' : 's'} · {documentIdsToDelete.length} ficheiro
            {documentIdsToDelete.length === 1 ? '' : 's'}
          </p>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-8 rounded-lg text-xs"
              onClick={() => exportHistoryCsv(selectedRows)}
            >
              <Download className="mr-1.5 h-3.5 w-3.5" />
              Exportar CSV
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-8 rounded-lg border-red-200/80 text-xs text-red-700 hover:bg-red-50"
              onClick={() => setDeleteOpen(true)}
            >
              <Trash2 className="mr-1.5 h-3.5 w-3.5" />
              Apagar
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-8 text-xs"
              onClick={() => setSelectedIds(new Set())}
            >
              Limpar selecção
            </Button>
          </div>
        </div>
      ) : (
        <p className="cb-docs-history-hint">
          Seleccione as linhas com a caixa à esquerda para exportar CSV ou apagar submissões.
        </p>
      )}

      <div className="cb-docs-table-wrap">
        <table className="cb-docs-table cb-table-mobile-cards">
          <thead>
            <tr>
              <th className="w-10">
                <Checkbox
                  checked={allSelected}
                  onCheckedChange={() => toggleAll()}
                  aria-label="Seleccionar todas as linhas"
                />
              </th>
              <th>Período</th>
              <th>Tipo</th>
              <th>Cliente</th>
              <th>Documentos</th>
              <th>Estado</th>
              <th>Submetido em</th>
              <th>Por</th>
            </tr>
          </thead>
          <tbody>
            {hub.loading ? (
              <tr>
                <td colSpan={8} className="cb-docs-empty">
                  A carregar…
                </td>
              </tr>
            ) : filteredRows.length === 0 ? (
              <tr>
                <td colSpan={8} className="cb-docs-empty">
                  Sem submissões no filtro seleccionado.
                </td>
              </tr>
            ) : (
              filteredRows.map((r) => (
                <HistoryRow
                  key={r.id}
                  row={r}
                  selected={selectedIds.has(r.id)}
                  onToggle={() => toggleRow(r.id)}
                />
              ))
            )}
          </tbody>
        </table>
      </div>

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        testId="docs-history-delete"
        title="Apagar submissões seleccionadas?"
        description={`Serão removidos ${documentIdsToDelete.length} ficheiro(s) de ${selectedRows.length} linha(s) seleccionada(s). Esta acção não pode ser desfeita.`}
        confirmLabel={deleting ? 'A apagar…' : 'Sim, apagar'}
        onConfirm={handleDelete}
      />

      <p className="cb-docs-foot">TegLion — Documentos / Histórico</p>
    </div>
  )
}

function HistoryRow({
  row,
  selected,
  onToggle,
}: {
  row: DocumentsHistoryRow
  selected: boolean
  onToggle: () => void
}) {
  return (
    <tr className={cn('cb-docs-row', selected && 'cb-docs-row-selected')}>
      <td className="cb-table-mobile-actions" onClick={(e) => e.stopPropagation()}>
        <Checkbox checked={selected} onCheckedChange={onToggle} aria-label={`Seleccionar ${row.clientName}`} />
      </td>
      <td className="font-medium" data-label="Período">{row.period}</td>
      <td data-label="Tipo">{row.typeLabel}</td>
      <td data-label="Cliente">{row.clientName}</td>
      <td className="tabular-nums" data-label="Documentos">{row.docCount} docs</td>
      <td data-label="Estado">
        <span className={historyStatusPill(row.status)}>{historyStatusLabel(row.status)}</span>
      </td>
      <td className="whitespace-nowrap text-muted-foreground" data-label="Submetido em">
        {row.submittedAt ? formatDateTime(row.submittedAt) : '—'}
      </td>
      <td className="text-muted-foreground" data-label="Por">{row.submittedBy}</td>
    </tr>
  )
}
