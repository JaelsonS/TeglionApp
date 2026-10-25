import { useMemo } from 'react'
import type { FormChangeEvent } from '@/shared/types/react-events'
import { CheckCircle2, ChevronRight, FileText, Search, ShieldAlert, ShieldX } from 'lucide-react'
import { Link } from 'react-router-dom'

import { DocumentsKpiStrip } from '@/features/firm/documents-hub/DocumentsKpiStrip'
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
import { cn } from '@/shared/lib/utils'
import { Input } from '@/shared/components/ui/input'
import { Button } from '@/shared/components/ui/button'
import { FirmWorkspaceFocusDialog } from '@/features/firm/FirmWorkspaceFocusDialog'
import { EmptyState } from '@/shared/design-system'
import { formatDateTime } from '@/shared/utils/date'

function statusPillClass(status?: string | null) {
  if (status === 'APPROVED') return 'cb-docs-pill-approved'
  if (status === 'REJECTED') return 'cb-docs-pill-rejected'
  if (status === 'PENDING') return 'cb-docs-pill-pending'
  return 'cb-docs-pill-muted'
}

export function DocumentsFilesWorkspace() {
  const hub = useDocumentsHub()
  const dialogOpen = Boolean(hub.selectedId)

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

  return (
    <div className="cb-docs-workspace">
      <DocumentsKpiStrip items={kpis} />
      <p className="cb-docs-section-lead">
        <span className="cb-docs-section-lead-title">Validar e organizar ficheiros</span>
        Clique num ficheiro para abrir o cartão completo no centro — pré-visualizar, validar, validade e
        histórico.
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

      <div className="cb-docs-files-panel">
        {hub.loading ? (
          <div className="space-y-2 p-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-14 animate-pulse rounded-xl bg-muted/30" />
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
          <ul className="cb-docs-file-cards cb-docs-file-cards--full">
            {hub.items.map((doc) => (
              <FileCard
                key={doc._id}
                doc={doc}
                selected={hub.selectedId === doc._id}
                onSelect={() => hub.selectDocument(doc._id)}
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

      <FirmWorkspaceFocusDialog
        open={dialogOpen}
        onOpenChange={(open) => {
          if (!open) hub.selectDocument(null)
        }}
        title={selectedDoc ? displayDocumentName(selectedDoc) : 'Documento'}
        description="Valide, descarregue, registe validade ou envie mensagem — sem sair da lista."
        className="w-[min(96vw,920px)] max-w-[min(96vw,920px)]"
      >
        <DocumentPreviewPanel
          doc={selectedDoc}
          detail={hub.detail}
          detailLoading={hub.detailLoading}
          getPreviewUrl={hub.getPreviewUrl}
          onRefresh={hub.refresh}
          onClose={() => hub.selectDocument(null)}
          layout="default"
        />
      </FirmWorkspaceFocusDialog>
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
        className={cn('cb-docs-file-card cb-docs-file-card--row', selected && 'cb-docs-file-card-selected')}
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
            {doc.sizeBytes != null ? ` · ${formatFileSize(doc.sizeBytes)}` : ''}
            {doc.createdAt ? ` · ${formatDateTime(doc.createdAt)}` : ''}
          </span>
        </span>
        <span className={cn('cb-docs-pill', statusPillClass(doc.validationStatus))}>
          {validationLabel(doc.validationStatus)}
        </span>
        <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground/50" aria-hidden />
      </button>
    </li>
  )
}
