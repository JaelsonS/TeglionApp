import { ChevronRight } from 'lucide-react'

import { DocumentRequestBadge } from '@/features/firm/documents/DocumentRequestBadge'
import { displayDocumentRequestTitle } from '@/features/firm/documents/documentRequestDisplay'
import type { DocumentRequest } from '@/shared/types/contabil'
import { formatDateTime } from '@/shared/utils/date'
import { cn } from '@/shared/lib/utils'

/** Linha formal de pedido — estilo lista estruturada (não chat). */
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
  const excerpt = request.instructions?.trim() || 'Sem instruções.'

  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        'group flex w-full items-stretch gap-3 border-b border-border/50 px-3 py-2.5 text-left transition-colors',
        'hover:bg-muted/30',
        selected && 'bg-brand/[0.06]',
      )}
    >
      <div className="min-w-0 flex-1 space-y-1">
        <div className="flex items-center justify-between gap-2">
          <span className="truncate text-xs font-semibold text-foreground">{clientName || 'Cliente'}</span>
          <time className="text-caption tabular-nums text-muted-foreground">{formatDateTime(request.createdAt)}</time>
        </div>
        <p className="truncate text-sm font-semibold text-foreground">{title}</p>
        <div className="flex items-center gap-2">
          <DocumentRequestBadge status={request.status} clientViewedAt={request.seenAt} />
          <p className="line-clamp-1 cb-text-caption">{excerpt}</p>
        </div>
      </div>
      <ChevronRight
        className={cn(
          'h-4 w-4 shrink-0 text-muted-foreground/50 transition',
          selected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100',
        )}
      />
    </button>
  )
}
