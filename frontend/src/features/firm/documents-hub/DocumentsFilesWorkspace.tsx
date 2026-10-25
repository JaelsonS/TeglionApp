import { useEffect, useMemo, useState } from 'react'
import type { FormChangeEvent } from '@/shared/types/react-events'
import { CheckCircle2, FileText, Search, ShieldAlert, ShieldX } from 'lucide-react'
import { Link } from 'react-router-dom'

import { DocumentsKpiStrip } from '@/features/firm/documents-hub/DocumentsKpiStrip'
import { DocumentPreviewPanel } from '@/features/firm/documents/DocumentPreviewPanel'
import { useDocumentsHub } from '@/features/firm/documents/useDocumentsHub'
import type { FirmDocumentRow } from '@/features/firm/documents/documentTypes'
import {
  displayClientName,
  displayDocumentName,
  mimeIcon,
  validationLabel,
} from '@/features/firm/documents/documentDisplay'
import { cn } from '@/shared/lib/utils'
import { Input } from '@/shared/components/ui/input'
import { Button } from '@/shared/components/ui/button'
import { FirmWorkspaceFocusDialog } from '@/features/firm/FirmWorkspaceFocusDialog'
import { EmptyState } from '@/shared/design-system'

function statusPillClass(status?: string | null) {
  if (status === 'APPROVED') return 'cb-docs-pill-approved'
  if (status === 'REJECTED') return 'cb-docs-pill-rejected'
  if (status === 'PENDING') return 'cb-docs-pill-pending'
  return 'cb-docs-pill-muted'
}

/** Preview fixo só em ≥1280px; abaixo disso usa o diálogo centrado. */
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

  const kpis = useMemo(() => {
    const pending = hub.items.filter((d) => d.validationStatus === 'PENDING').length
    const approved = hub.items.filter((d) => d.validationStatus === 'APPROVED').length
    const rejected = hub.items.filter((d) => d.validationStatus === 'REJECTED').length
    return [
      { id: 'pending', value: pending, label: 'por validar', tone: 'amber' as const, icon: ShieldAlert },
      { id: 'ok', value: approved, label: 'aprovados', tone: 'emerald' as const, icon: CheckCircle2 },
      { id: 'rej', value: rejected, label: 'rejeitados', tone: 'rose' as const, icon: ShieldX },
    ]
  }, [hub.items])

  // Auto-seleccionar primeiro ficheiro no desktop quando nada está seleccionado.
  useEffect(() => {
    if (hub.loading) return
    if (hub.selectedId) return
    if (hub.items.length === 0) return
    if (previewAsSheet) return
    hub.selectDocument(hub.items[0]._id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hub.loading, hub.selectedId, hub.items, previewAsSheet])

  return (
    <div className="cb-docs-workspace">
      <DocumentsKpiStrip items={kpis} />
      <p className="cb-docs-section-lead">
        <span className="cb-docs-section-lead-title">Validar e organizar ficheiros</span>
        Pré-visualize, aprove ou rejeite o que os clientes enviaram. Filtre por cliente, período e estado.
      </p>

      <div className="cb-docs-toolbar">
        <select
          className="cb-docs-filter"
          value={hub.filters.clientId || ''}
          onChange={(e) => hub.updateParams({ clientId: e.target.value || null })}
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
        <Button type="button" size="sm" variant="primary" className="h-9 shrink-0 rounded-lg" asChild>
          <Link to="/app/firm/documents/requests?compose=1">Pedir documentos</Link>
        </Button>
      </div>

      <div
        className={cn(
          'cb-docs-split cb-docs-files-split',
          hasDesktopPreview && 'cb-docs-split-selected',
          hasDesktopPreview && previewFocus && 'cb-docs-split-focus',
        )}
      >
        <div className="cb-docs-table-wrap cb-docs-files-list">
          {hub.loading ? (
            <div className="space-y-2 p-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-16 animate-pulse rounded-xl bg-muted/30" />
              ))}
            </div>
          ) : hub.items.length === 0 ? (
            <EmptyState
              className="m-4 border-0 bg-transparent"
              icon={FileText}
              title="Ainda sem ficheiros nesta vista"
              description="Documentos enviados pelos clientes ou pedidos formais aparecem aqui para consulta e validação."
              action={
                <Button type="button" size="sm" variant="outline" asChild>
                  <Link to="/app/firm/documents/requests">Pedir documentos</Link>
                </Button>
              }
            />
          ) : (
            <ul className="cb-docs-file-cards">
              {hub.items.map((doc) => (
                <FileCard
                  key={doc._id}
                  doc={doc}
                  selected={hub.selectedId === doc._id}
                  onSelect={() => {
                    setPreviewFocus(true)
                    hub.selectDocument(doc._id)
                  }}
                />
              ))}
            </ul>
          )}
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
        <FirmWorkspaceFocusDialog
          open={sheetOpen}
          onOpenChange={(open) => !open && hub.selectDocument(null)}
          title={selectedDoc ? displayDocumentName(selectedDoc) : 'Pré-visualização do documento'}
          description="Documento no centro do ecrã — valide, descarregue ou feche sem perder a lista."
          className="w-[min(96vw,760px)] max-w-[min(96vw,760px)]"
        >
          <div className="min-h-0 flex-1 overflow-y-auto">
            <DocumentPreviewPanel
              doc={selectedDoc}
              detail={hub.detail}
              detailLoading={hub.detailLoading}
              getPreviewUrl={hub.getPreviewUrl}
              onRefresh={hub.refresh}
              onClose={() => hub.selectDocument(null)}
            />
          </div>
        </FirmWorkspaceFocusDialog>
      ) : null}
    </div>
  )
}

function FileCard({
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
  const period = doc.period || doc.obligationPeriod || null

  return (
    <li>
      <button
        type="button"
        className={cn('cb-docs-file-card', selected && 'cb-docs-file-card-selected')}
        onClick={() => {
          if (document.activeElement instanceof HTMLElement) document.activeElement.blur()
          onSelect()
        }}
      >
        <span className="cb-docs-file-card-icon">
          <Icon className="h-5 w-5" />
        </span>
        <span className="cb-docs-file-card-body">
          <span className="cb-docs-file-card-name">{name}</span>
          <span className="cb-docs-file-card-sub">
            {displayClientName(doc)}
            {period ? ` · ${period}` : ''}
          </span>
        </span>
        <span className={cn('cb-docs-pill', statusPillClass(doc.validationStatus))}>
          {validationLabel(doc.validationStatus)}
        </span>
      </button>
    </li>
  )
}
