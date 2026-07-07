import { FileText, X } from 'lucide-react'

import { isImageAttachment, type BroadcastAttachment } from '@/features/firm/alerts/alertTypes'
import { cn } from '@/shared/lib/utils'

export function AlertAttachmentsGrid({
  attachments,
  coverUrl,
  onRemove,
  editable,
}: {
  attachments: BroadcastAttachment[]
  coverUrl?: string | null
  onRemove?: (index: number) => void
  editable?: boolean
}) {
  const all: BroadcastAttachment[] = [
    ...(coverUrl ? [{ url: coverUrl, name: 'Capa', type: 'image' as const }] : []),
    ...attachments,
  ]
  if (!all.length) return null

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {all.map((a, idx) => {
        const isCover = Boolean(coverUrl && idx === 0 && a.url === coverUrl)
        const attIdx = isCover ? -1 : idx - (coverUrl ? 1 : 0)
        const image = isImageAttachment(a)
        return (
          <div
            key={`${a.url}-${idx}`}
            className={cn(
              'relative overflow-hidden rounded-xl border border-border/50 bg-muted/20',
              image ? 'aspect-video' : 'flex items-center gap-3 p-3',
            )}
          >
            {editable && onRemove ? (
              <button
                type="button"
                className="absolute right-2 top-2 z-10 rounded-full bg-background/90 p-1 shadow-sm hover:bg-muted"
                onClick={() => (isCover ? onRemove(-1) : onRemove(attIdx))}
              >
                <X className="h-3.5 w-3.5" />
              </button>
            ) : null}
            {image ? (
              <img src={a.url} alt={a.name || ''} className="h-full w-full object-cover" />
            ) : (
              <>
                <FileText className="h-8 w-8 shrink-0 text-primary" />
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{a.name || 'Documento'}</p>
                  <a
                    href={a.url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-primary hover:underline"
                  >
                    Abrir ficheiro
                  </a>
                </div>
              </>
            )}
          </div>
        )
      })}
    </div>
  )
}
