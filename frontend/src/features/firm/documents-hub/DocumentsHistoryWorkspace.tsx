import { useMemo, useState } from 'react'
import type { FormChangeEvent } from '@/shared/types/react-events'
import { CheckCircle2, Download, FileStack, Search, ShieldX, Trash2 } from 'lucide-react'
import { toast } from 'sonner'

import { ConfirmDialog } from '@/shared/components/modals/ConfirmDialog'
import { DocumentsKpiStrip } from '@/features/firm/documents-hub/DocumentsKpiStrip'
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
import { Input } from '@/shared/components/ui/input'
import { contabilDocumentsApi } from '@/infrastructure/api'
import { emitAppDataChanged } from '@/shared/utils/appEvents'
import { formatDateTime } from '@/shared/utils/date'
import { getErrorMessage } from '@/shared/utils/errors'
import { cn } from '@/shared/lib/utils'

const PAGE_SIZES = [10, 25, 50] as const

function initials(name: string) {
  const parts = String(name || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return `${parts[0][0] || ''}${parts[1][0] || ''}`.toUpperCase()
}

export function DocumentsHistoryWorkspace() {
  const hub = useDocumentsHub()
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState<(typeof PAGE_SIZES)[number]>(10)

  const sourceItems = useMemo(() => {
    let list = hub.items
    if (hub.filters.clientId) {
      list = list.filter((d) => d.clientId === hub.filters.clientId)
    }
    if (hub.filters.period) {
      list = list.filter(
        (d) => d.period === hub.filters.period || d.obligationPeriod === hub.filters.period,
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

  const kpis = useMemo(() => {
    const approved = filteredRows.filter((r) => r.status === 'entregue').length
    const rejected = filteredRows.filter((r) => r.status === 'rejeitado').length
    return [
      { id: 'all', value: filteredRows.length, label: 'submissões', tone: 'muted' as const, icon: FileStack },
      { id: 'ok', value: approved, label: 'aprovadas', tone: 'emerald' as const, icon: CheckCircle2 },
      { id: 'rej', value: rejected, label: 'rejeitadas', tone: 'rose' as const, icon: ShieldX },
    ]
  }, [filteredRows])

  const pageCount = Math.max(1, Math.ceil(filteredRows.length / pageSize))
  const safePage = Math.min(page, pageCount)
  const pageRows = useMemo(() => {
    const start = (safePage - 1) * pageSize
    return filteredRows.slice(start, start + pageSize)
  }, [filteredRows, safePage, pageSize])

  const selectedRows = useMemo(
    () => filteredRows.filter((r) => selectedIds.has(r.id)),
    [filteredRows, selectedIds],
  )

  const allSelected =
    pageRows.length > 0 && pageRows.every((r) => selectedIds.has(r.id))

  const toggleRow = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const toggleAll = () => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (allSelected) {
        for (const r of pageRows) next.delete(r.id)
      } else {
        for (const r of pageRows) next.add(r.id)
      }
      return next
    })
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

  const rangeStart = filteredRows.length === 0 ? 0 : (safePage - 1) * pageSize + 1
  const rangeEnd = Math.min(safePage * pageSize, filteredRows.length)

  return (
    <div className="cb-docs-workspace">
      <DocumentsKpiStrip items={kpis} />
      <p className="cb-docs-section-lead">
        <span className="cb-docs-section-lead-title">Histórico com exportação</span>
        Auditoria das submissões: o que foi enviado, por quem e com que resultado.
      </p>

      <div className="cb-docs-toolbar">
        <select
          className="cb-docs-filter"
          value={hub.filters.period || ''}
          onChange={(e) => {
            setPage(1)
            hub.updateParams({ period: e.target.value || null })
          }}
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
          onChange={(e) => {
            setPage(1)
            hub.updateParams({ clientId: e.target.value || null })
          }}
          aria-label="Filtrar cliente"
        >
          <option value="">Cliente: Todos</option>
          {hub.clients.map((c) => (
            <option key={c._id} value={c._id}>
              {c.fullName || c.name || c.displayName}
            </option>
          ))}
        </select>
        <div className="cb-docs-search">
          <Search className="cb-docs-search-icon" aria-hidden />
          <Input
            value={hub.filters.q}
            onChange={(e: FormChangeEvent) => {
              setPage(1)
              hub.updateParams({ q: e.target.value || null })
            }}
            placeholder="Pesquisar no histórico…"
            className="cb-docs-search-input"
          />
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-9 rounded-lg border-brand/40 text-brand hover:bg-brand/[0.06]"
          disabled={filteredRows.length === 0}
          onClick={() => exportHistoryCsv(selectedRows.length > 0 ? selectedRows : filteredRows)}
        >
          <Download className="mr-1.5 h-3.5 w-3.5" />
          Exportar CSV
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-9 rounded-lg border-red-200/80 text-red-700 hover:bg-red-50"
          disabled={selectedRows.length === 0}
          onClick={() => setDeleteOpen(true)}
        >
          <Trash2 className="mr-1.5 h-3.5 w-3.5" />
          Eliminar seleccionados
        </Button>
      </div>

      {selectedRows.length > 0 ? (
        <p className="cb-docs-history-hint">
          {selectedRows.length} linha{selectedRows.length === 1 ? '' : 's'} seleccionada
          {selectedRows.length === 1 ? '' : 's'} · {documentIdsToDelete.length} ficheiro
          {documentIdsToDelete.length === 1 ? '' : 's'}
        </p>
      ) : null}

      <div className="cb-docs-table-wrap cb-docs-history-table-wrap">
        <table className="cb-docs-table cb-table-mobile-cards">
          <thead>
            <tr>
              <th className="w-10">
                <Checkbox
                  checked={allSelected}
                  onCheckedChange={() => toggleAll()}
                  aria-label="Seleccionar todas as linhas da página"
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
            ) : pageRows.length === 0 ? (
              <tr>
                <td colSpan={8} className="cb-docs-empty">
                  Sem submissões no filtro seleccionado.
                </td>
              </tr>
            ) : (
              pageRows.map((r) => (
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

      <div className="cb-docs-pagination">
        <p className="cb-docs-pagination-range">
          {filteredRows.length === 0
            ? '0 resultados'
            : `${rangeStart}–${rangeEnd} de ${filteredRows.length}`}
        </p>
        <div className="cb-docs-pagination-controls">
          <label className="cb-docs-pagination-size">
            Linhas por página
            <select
              className="cb-docs-filter ml-2"
              value={pageSize}
              onChange={(e) => {
                setPage(1)
                setPageSize(Number(e.target.value) as (typeof PAGE_SIZES)[number])
              }}
            >
              {PAGE_SIZES.map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </label>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8"
            disabled={safePage <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            Anterior
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8"
            disabled={safePage >= pageCount}
            onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
          >
            Seguinte
          </Button>
        </div>
      </div>

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        testId="docs-history-delete"
        title="Apagar submissões seleccionadas?"
        description={`Serão removidos ${documentIdsToDelete.length} ficheiro(s) de ${selectedRows.length} linha(s) seleccionada(s). Esta acção não pode ser desfeita.`}
        confirmLabel={deleting ? 'A apagar…' : 'Sim, apagar'}
        variant="destructive"
        onConfirm={handleDelete}
      />
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
      <td className="font-medium" data-label="Período">
        {row.period}
      </td>
      <td data-label="Tipo">{row.typeLabel}</td>
      <td data-label="Cliente">{row.clientName}</td>
      <td className="tabular-nums" data-label="Documentos">
        <span className="cb-docs-count-badge">{row.docCount}</span>
      </td>
      <td data-label="Estado">
        <span className={historyStatusPill(row.status)}>{historyStatusLabel(row.status)}</span>
      </td>
      <td className="whitespace-nowrap text-muted-foreground" data-label="Submetido em">
        {row.submittedAt ? formatDateTime(row.submittedAt) : '—'}
      </td>
      <td data-label="Por">
        <span className="cb-docs-avatar" title={row.submittedBy}>
          {initials(row.submittedBy)}
        </span>
      </td>
    </tr>
  )
}
