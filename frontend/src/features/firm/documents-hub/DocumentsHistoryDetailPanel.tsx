import { Download, ExternalLink, FileText, History } from 'lucide-react'
import { Link } from 'react-router-dom'

import {
  describeDocumentHistoryEvent,
  historyEventToneClass,
} from '@/features/firm/documents-hub/documentsHistoryLabels'
import {
  historyStatusLabel,
  historyStatusPill,
  type DocumentsHistoryRow,
} from '@/features/firm/documents-hub/documentsHistoryUtils'
import {
  displayDocumentName,
  formatFileSize,
  mimeIcon,
  validationLabel,
} from '@/features/firm/documents/documentDisplay'
import type { DocumentDetailResponse, FirmDocumentRow } from '@/features/firm/documents/documentTypes'
import { Button } from '@/shared/components/ui/button'
import { SkeletonCard } from '@/shared/design-system'
import { FIRM_DOCUMENTS_FILES } from '@/features/firm/documents-hub/firmDocumentsPaths'
import { formatDateTime } from '@/shared/utils/date'
import { cn } from '@/shared/lib/utils'

function statusPillClass(status?: string | null) {
  if (status === 'APPROVED') return 'cb-docs-pill-approved'
  if (status === 'REJECTED') return 'cb-docs-pill-rejected'
  if (status === 'PENDING') return 'cb-docs-pill-pending'
  return 'cb-docs-pill-muted'
}

export function DocumentsHistoryDetailPanel({
  row,
  docs,
  focusDoc,
  detail,
  detailLoading,
  onSelectDoc,
}: {
  row: DocumentsHistoryRow
  docs: FirmDocumentRow[]
  focusDoc: FirmDocumentRow | null
  detail: DocumentDetailResponse | null
  detailLoading: boolean
  onSelectDoc: (id: string) => void
}) {
  const events = (detail?.history || []).map(describeDocumentHistoryEvent)
  const filesHref = focusDoc
    ? `${FIRM_DOCUMENTS_FILES}?doc=${encodeURIComponent(focusDoc._id)}`
    : FIRM_DOCUMENTS_FILES

  return (
    <div className="cb-docs-hist-detail" data-testid="documents-history-detail">
      <section className="cb-docs-hist-summary">
        <div className="min-w-0 flex-1">
          <p className="cb-docs-hist-summary-kicker">Submissão</p>
          <h3 className="cb-docs-hist-summary-title">{row.typeLabel}</h3>
          <p className="cb-docs-hist-summary-meta">
            {row.clientName}
            <span aria-hidden> · </span>
            {row.period}
            <span aria-hidden> · </span>
            {row.docCount} ficheiro{row.docCount === 1 ? '' : 's'}
            {row.submittedAt ? (
              <>
                <span aria-hidden> · </span>
                submetido {formatDateTime(row.submittedAt)}
              </>
            ) : null}
            {row.submittedBy ? (
              <>
                <span aria-hidden> · </span>
                por {row.submittedBy}
              </>
            ) : null}
          </p>
        </div>
        <span className={historyStatusPill(row.status)}>{historyStatusLabel(row.status)}</span>
      </section>

      <section className="cb-docs-hist-section">
        <header className="cb-docs-hist-section-hd">
          <FileText className="h-3.5 w-3.5" aria-hidden />
          <h4>Ficheiros desta submissão</h4>
        </header>
        <p className="cb-docs-hist-section-hint">
          Escolha um ficheiro para ver a linha do tempo. Para validar ou pré-visualizar, abra em Ficheiros.
        </p>
        <ul className="cb-docs-hist-doc-list">
          {docs.map((doc) => {
            const Icon = mimeIcon(doc.mimeType, displayDocumentName(doc))
            const active = focusDoc?._id === doc._id
            return (
              <li key={doc._id}>
                <button
                  type="button"
                  className={cn('cb-docs-hist-doc-row', active && 'cb-docs-hist-doc-row-active')}
                  onClick={() => onSelectDoc(doc._id)}
                >
                  <span className="cb-docs-hist-doc-icon">
                    <Icon className="h-4 w-4" />
                  </span>
                  <span className="min-w-0 flex-1 text-left">
                    <span className="block truncate text-sm font-semibold text-foreground">
                      {displayDocumentName(doc)}
                    </span>
                    <span className="mt-0.5 block truncate text-xs text-muted-foreground">
                      {doc.sizeBytes != null ? formatFileSize(doc.sizeBytes) : '—'}
                      {doc.createdAt ? ` · enviado ${formatDateTime(doc.createdAt)}` : ''}
                      {doc.validatedAt ? ` · validado ${formatDateTime(doc.validatedAt)}` : ''}
                    </span>
                  </span>
                  <span className={cn('cb-docs-pill', statusPillClass(doc.validationStatus))}>
                    {validationLabel(doc.validationStatus)}
                  </span>
                </button>
              </li>
            )
          })}
        </ul>
      </section>

      <section className="cb-docs-hist-section">
        <header className="cb-docs-hist-section-hd">
          <History className="h-3.5 w-3.5" aria-hidden />
          <h4>
            Linha do tempo
            {focusDoc ? ` · ${displayDocumentName(focusDoc)}` : ''}
          </h4>
        </header>
        <p className="cb-docs-hist-section-hint">
          Quem viu, descarregou, aprovou ou rejeitou — por ordem cronológica (mais recente primeiro).
        </p>

        {detailLoading ? (
          <div className="space-y-2 px-1 py-2">
            <SkeletonCard />
            <SkeletonCard />
          </div>
        ) : !focusDoc ? (
          <p className="cb-docs-hist-empty">Seleccione um ficheiro acima.</p>
        ) : events.length === 0 ? (
          <p className="cb-docs-hist-empty">Ainda sem eventos registados para este ficheiro.</p>
        ) : (
          <ol className="cb-docs-hist-timeline" aria-label="Linha do tempo do documento">
            {events.map((ev) => (
              <li key={ev.id} className={cn('cb-docs-hist-event', historyEventToneClass(ev.tone))}>
                <span className="cb-docs-hist-event-dot" aria-hidden />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
                    <p className="text-sm font-semibold text-foreground">{ev.title}</p>
                    <time
                      className="shrink-0 text-caption tabular-nums text-muted-foreground"
                      dateTime={ev.absoluteWhen || undefined}
                      title={ev.absoluteWhen || undefined}
                    >
                      {ev.whenLabel || ev.absoluteWhen || '—'}
                    </time>
                  </div>
                  {ev.detail ? <p className="mt-0.5 text-xs text-muted-foreground">{ev.detail}</p> : null}
                  {ev.absoluteWhen && ev.whenLabel ? (
                    <p className="mt-0.5 text-caption text-muted-foreground/80">{ev.absoluteWhen}</p>
                  ) : null}
                </div>
              </li>
            ))}
          </ol>
        )}
      </section>

      <div className="cb-docs-hist-actions">
        <Button type="button" variant="outline" size="sm" className="h-9 rounded-lg" asChild>
          <Link to={filesHref}>
            <ExternalLink className="mr-1.5 h-3.5 w-3.5" />
            Abrir em Ficheiros
          </Link>
        </Button>
        {focusDoc ? (
          <p className="cb-docs-hist-actions-hint">
            Em Ficheiros pode descarregar, validar, registar validade ou pedir reenvio.
          </p>
        ) : (
          <p className="cb-docs-hist-actions-hint inline-flex items-center gap-1.5">
            <Download className="h-3.5 w-3.5 opacity-50" aria-hidden />
            Acções de ficheiro ficam na tab Ficheiros.
          </p>
        )}
      </div>
    </div>
  )
}
