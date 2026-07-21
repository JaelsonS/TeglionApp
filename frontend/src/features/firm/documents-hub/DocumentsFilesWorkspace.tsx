import { useEffect, useMemo, useState } from 'react'
import type { FormChangeEvent } from '@/shared/types/react-events'
import { Search } from 'lucide-react'

import { DocumentPreviewPanel } from '@/features/firm/documents/DocumentPreviewPanel'
import { useDocumentsHub } from '@/features/firm/documents/useDocumentsHub'
import type { FirmDocumentRow } from '@/features/firm/documents/documentTypes'
import {
  displayClientName,
  displayDocumentName,
  formatFileSize,
  mimeIcon,
  validationLabel,
} from '@/features/firm/documents/documentDisplay'
import { formatDateTime } from '@/shared/utils/date'
import { cn } from '@/shared/lib/utils'
import { Input } from '@/shared/components/ui/input'
import { Sheet, SheetContent } from '@/shared/components/ui/sheet'
import { SheetHiddenTitle } from '@/shared/components/ui/sheet-hidden-title'

function statusPillClass(status?: string | null) {
  if (status === 'APPROVED') return 'cb-docs-pill-approved'
  if (status === 'REJECTED') return 'cb-docs-pill-rejected'
  if (status === 'PENDING') return 'cb-docs-pill-pending'
  return 'cb-docs-pill-muted'
}

/** Preview lateral fixo só em ≥1280px; abaixo disso usa Sheet. */
function useDocsPreviewSheet() {
  const query = '(max-width: 1279px)'
  const [useSheet, setUseSheet] = useState(
    () => typeof window !== 'undefined' && window.matchMedia(query).matches,
  )

  useEffect(() => {
    const mq = window.matchMedia(query)
    const onChange = () => setUseSheet(mq.matches)
    onChange()
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])

  return useSheet
}

export function DocumentsFilesWorkspace() {
  const hub = useDocumentsHub()
  const previewAsSheet = useDocsPreviewSheet()
  const sheetOpen = Boolean(hub.selectedId) && previewAsSheet
  const hasDesktopPreview = Boolean(hub.selectedId) && !previewAsSheet
  const [previewFocus, setPreviewFocus] = useState(false)

  const selectedDoc = useMemo(
    () => hub.items.find((d) => d._id === hub.selectedId) || hub.detail?.document || null,
    [hub.items, hub.selectedId, hub.detail?.document],
  )

  return (
    <div className="cb-docs-workspace">
      <div className="cb-docs-toolbar">
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
          value={hub.filters.status || ''}
          onChange={(e) => hub.updateParams({ status: e.target.value || null })}
          aria-label="Filtrar estado"
        >
          <option value="">Estado: Todos</option>
          <option value="PENDING">Por validar</option>
          <option value="APPROVED">Aprovado</option>
          <option value="REJECTED">Rejeitado</option>
        </select>
        <div className="cb-docs-search">
          <Search className="cb-docs-search-icon" aria-hidden />
          <Input
            value={hub.filters.q}
            onChange={(e: FormChangeEvent) => hub.updateParams({ q: e.target.value || null })}
            placeholder="Pesquisar ficheiros…"
            className="cb-docs-search-input"
          />
        </div>
      </div>

      <div
        className={cn(
          'cb-docs-split',
          hasDesktopPreview && 'cb-docs-split-selected',
          hasDesktopPreview && previewFocus && 'cb-docs-split-focus',
        )}
      >
        <div className="cb-docs-table-wrap">
          <table className="cb-docs-table cb-table-mobile-cards">
            <thead>
              <tr>
                <th>Nome ficheiro</th>
                <th>Cliente</th>
                <th>Tipo</th>
                <th>Tamanho</th>
                <th>Data</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {hub.loading ? (
                <tr>
                  <td colSpan={6} className="cb-docs-empty">
                    A carregar…
                  </td>
                </tr>
              ) : hub.items.length === 0 ? (
                <tr>
                  <td colSpan={6} className="cb-docs-empty">
                    Nenhum ficheiro neste filtro.
                  </td>
                </tr>
              ) : (
                hub.items.map((doc) => (
                  <FileRow
                    key={doc._id}
                    doc={doc}
                    selected={hub.selectedId === doc._id}
                    onSelect={() => {
                      setPreviewFocus(true)
                      hub.selectDocument(doc._id)
                    }}
                  />
                ))
              )}
            </tbody>
          </table>
          {hub.hasMore ? (
            <div className="border-t border-border/60 p-2 text-center">
              <button
                type="button"
                className="text-xs font-medium text-brand hover:underline"
                onClick={() => void hub.loadMore()}
                disabled={hub.loadingMore}
              >
                {hub.loadingMore ? 'A carregar…' : 'Carregar mais'}
              </button>
            </div>
          ) : null}
        </div>

        <aside
          className="cb-docs-preview hidden xl:flex"
          onClick={() => hasDesktopPreview && setPreviewFocus(true)}
          onKeyDown={() => {}}
          role={hasDesktopPreview ? 'region' : undefined}
          aria-label={hasDesktopPreview ? 'Pré-visualização do documento' : undefined}
        >
          {hasDesktopPreview ? (
            <button
              type="button"
              className="cb-docs-preview-focus-toggle"
              onClick={(e) => {
                e.stopPropagation()
                setPreviewFocus((v) => !v)
              }}
            >
              {previewFocus ? 'Mostrar lista' : 'Expandir pré-visualização'}
            </button>
          ) : null}
          <DocumentPreviewPanel
            doc={selectedDoc}
            detail={hub.detail}
            detailLoading={hub.detailLoading}
            getPreviewUrl={hub.getPreviewUrl}
            onRefresh={hub.refresh}
            onClose={() => {
              setPreviewFocus(false)
              hub.selectDocument(null)
            }}
            layout={hasDesktopPreview ? 'expanded' : 'default'}
          />
        </aside>
      </div>

      {previewAsSheet ? (
      <Sheet open={sheetOpen} onOpenChange={(o: { id?: string; value?: string; label?: string; [key: string]: unknown }) => !o && hub.selectDocument(null)}>
        <SheetContent side="right" className="flex w-full flex-col p-0 sm:max-w-lg">
          <SheetHiddenTitle>
            {selectedDoc
              ? displayDocumentName(selectedDoc)
              : 'Pré-visualização do documento'}
          </SheetHiddenTitle>
          <DocumentPreviewPanel
            doc={selectedDoc}
            detail={hub.detail}
            detailLoading={hub.detailLoading}
            getPreviewUrl={hub.getPreviewUrl}
            onRefresh={hub.refresh}
            onClose={() => hub.selectDocument(null)}
          />
        </SheetContent>
      </Sheet>
      ) : null}

      <p className="cb-docs-foot">Teglion — Documentos / Ficheiros</p>
    </div>
  )
}

function FileRow({
  doc,
  selected,
  onSelect,
}: {
  doc: FirmDocumentRow
  selected: boolean
  onSelect: () => void
}) {
  const Icon = mimeIcon(doc.mimeType, displayDocumentName(doc))
  const name = displayDocumentName(doc)
  const typeLabel = doc.obligationTitle || doc.documentType || 'Ficheiro'

  return (
    <tr
      className={cn('cb-docs-row', selected && 'cb-docs-row-selected')}
      onClick={() => {
        if (document.activeElement instanceof HTMLElement) document.activeElement.blur()
        onSelect()
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onSelect()
        }
      }}
    >
      <td data-label="Nome ficheiro">
        <span className="cb-docs-file-cell">
          <span className="cb-docs-file-icon">
            <Icon className="h-4 w-4" />
          </span>
          <span className="truncate font-medium">{name}</span>
        </span>
      </td>
      <td className="truncate text-muted-foreground" data-label="Cliente">{displayClientName(doc)}</td>
      <td className="truncate text-muted-foreground" data-label="Tipo">{typeLabel}</td>
      <td className="tabular-nums text-muted-foreground" data-label="Tamanho">{formatFileSize(doc.sizeBytes)}</td>
      <td className="tabular-nums text-muted-foreground whitespace-nowrap" data-label="Data">
        {doc.createdAt ? formatDateTime(doc.createdAt) : '—'}
      </td>
      <td data-label="Estado">
        <span className={cn('cb-docs-pill', statusPillClass(doc.validationStatus))}>
          {validationLabel(doc.validationStatus)}
        </span>
      </td>
    </tr>
  )
}
