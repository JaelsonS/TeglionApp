import { ChevronRight } from 'lucide-react'

import { DocumentRequestBadge } from '@/features/firm/documents/DocumentRequestBadge'
import { displayDocumentRequestTitle } from '@/features/firm/documents/documentRequestDisplay'
import { normalizeRequestStatus } from '@/features/firm/documents/documentRequestStatus'
import type { DocumentRequest } from '@/shared/types/contabil'
import { formatDateTime } from '@/shared/utils/date'
import { cn } from '@/shared/lib/utils'

function progressLabel(request: DocumentRequest) {
  const status = normalizeRequestStatus(request.status)
  if (request.documentId || status === 'answered' || status === 'completed') {
    return '1/1 ficheiro'
  }
  return '0 ficheiros'
}

function metaLine(request: DocumentRequest) {
  if (request.periodMonth) {
    const m = String(request.periodMonth).match(/^(\d{4})-(\d{2})/)
    if (m) return `Período ${m[2]}/${m[1].slice(2)}`
  }
  if (request.createdAt) {
    const d = new Date(request.createdAt)
    if (!Number.isNaN(d.getTime())) {
      return `Criado ${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`
    }
  }
  return null
}

/** Cartão de pedido — lista estruturada fiel ao mockup Documentos v2. */
export function RequestRow({
  request,
  clientName,
  selected,
  onSelect,
}: {
  request: DocumentRequest
  clientName?: string | null
  selected?: boolean
  onSelect: () => void
}) {
  const title = displayDocumentRequestTitle(request, clientName)
  const meta = metaLine(request)
  const progress = progressLabel(request)

  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn('group cb-docs-req-card', selected && 'cb-docs-req-card-selected')}
      aria-pressed={selected}
    >
      <div className="cb-docs-req-card-main">
        <div className="cb-docs-req-card-top">
          <span className="cb-docs-req-card-client">{clientName || 'Cliente'}</span>
          <time className="cb-docs-req-card-time" dateTime={request.createdAt}>
            {formatDateTime(request.createdAt)}
          </time>
        </div>
        <p className="cb-docs-req-card-title">{title}</p>
        <div className="cb-docs-req-card-meta">
          <DocumentRequestBadge status={request.status} clientViewedAt={request.seenAt} />
          <span className="cb-docs-req-card-progress">{progress}</span>
          {meta ? <span className="cb-docs-req-card-deadline">{meta}</span> : null}
        </div>
      </div>
      <ChevronRight
        className={cn(
          'cb-docs-req-card-chevron',
          selected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100',
        )}
        aria-hidden
      />
    </button>
  )
}
