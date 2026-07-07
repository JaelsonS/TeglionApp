import { FileText, Loader2, X } from 'lucide-react'

import {
  SERVICE_PRIORITY_LABEL,
  SERVICE_STATUS_LABEL,
  servicePriorityClass,
} from '@/features/firm/services/serviceLabels'
import { Button } from '@/shared/components/ui/button'
import { formatDateTime } from '@/shared/utils/date'
import { cn } from '@/shared/lib/utils'

export type ServiceRequestDetail = {
  id: string
  title: string
  description?: string | null
  status: string
  priority?: string
  clientName?: string | null
  quotedAmountCents?: number | null
  currency?: string | null
  submittedAt?: string | null
  createdAt?: string | null
}

export type ServiceComment = {
  id: string
  body: string
  authorRole?: string
  createdAt?: string
  isInternal?: boolean
}

type Props = {
  request: ServiceRequestDetail | null
  comments: ServiceComment[]
  loading: boolean
  onClose?: () => void
  onAssign?: () => void
  onQuote?: () => void
  onOpenPdf?: () => void
  onStart?: () => void
  onComplete?: () => void
  actionLoading?: boolean
}

export function ServiceRequestDetailPanel({
  request,
  comments,
  loading,
  onClose,
  onAssign,
  onQuote,
  onOpenPdf,
  onStart,
  onComplete,
  actionLoading,
}: Props) {
  if (loading) {
    return (
      <div className="cb-services-detail flex h-full items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!request) {
    return (
      <div className="cb-services-detail cb-services-detail-empty">
        <p className="text-sm font-medium text-foreground">Selecione um pedido</p>
        <p className="mt-1 max-w-xs text-center text-xs text-muted-foreground">
          Clique num cartão do pipeline para ver detalhes, histórico e acções disponíveis.
        </p>
      </div>
    )
  }

  const status = request.status

  return (
    <div className="cb-services-detail">
      <header className="cb-services-detail-hd">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="cb-services-detail-status">{SERVICE_STATUS_LABEL[status] || status}</span>
            {request.priority ? (
              <span className={cn('cb-services-priority-pill', servicePriorityClass(request.priority))}>
                {SERVICE_PRIORITY_LABEL[request.priority] || request.priority}
              </span>
            ) : null}
          </div>
          <h2 className="cb-services-detail-title">{request.title}</h2>
          <p className="cb-services-detail-client">{request.clientName || '—'}</p>
        </div>
        {onClose ? (
          <Button type="button" size="icon" variant="ghost" className="shrink-0 xl:hidden" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        ) : null}
      </header>

      <div className="cb-services-detail-body">
        {request.description ? (
          <section className="cb-services-detail-section">
            <h3 className="cb-services-detail-section-title">Descrição</h3>
            <p className="text-sm leading-relaxed text-muted-foreground whitespace-pre-wrap">
              {request.description}
            </p>
          </section>
        ) : null}

        <section className="cb-services-detail-section">
          <h3 className="cb-services-detail-section-title">Resumo</h3>
          <dl className="cb-services-detail-dl">
            {request.quotedAmountCents != null ? (
              <div>
                <dt>Orçamento</dt>
                <dd className="font-medium text-emerald-700">
                  {(request.quotedAmountCents / 100).toFixed(2)} {request.currency || 'EUR'}
                </dd>
              </div>
            ) : null}
            <div>
              <dt>Submetido</dt>
              <dd>{request.submittedAt || request.createdAt ? formatDateTime(request.submittedAt || request.createdAt!) : '—'}</dd>
            </div>
          </dl>
        </section>

        <section className="cb-services-detail-section">
          <h3 className="cb-services-detail-section-title">Comentários ({comments.length})</h3>
          {comments.length === 0 ? (
            <p className="text-xs text-muted-foreground">Sem comentários registados.</p>
          ) : (
            <ul className="space-y-2">
              {comments.map((c) => (
                <li key={c.id} className="rounded-lg border border-border/50 bg-muted/15 px-3 py-2 text-sm">
                  <p className="whitespace-pre-wrap">{c.body}</p>
                  <p className="mt-1 cb-text-caption">
                    {c.authorRole === 'FIRM' ? 'Escritório' : 'Cliente'}
                    {c.isInternal ? ' · interno' : ''}
                    {c.createdAt ? ` · ${formatDateTime(c.createdAt)}` : ''}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <footer className="cb-services-detail-foot">
        {status === 'SUBMITTED' && onAssign ? (
          <Button size="sm" variant="secondary" className="rounded-lg" disabled={actionLoading} onClick={onAssign}>
            Atribuir
          </Button>
        ) : null}
        {status === 'ASSIGNED' && onQuote ? (
          <Button size="sm" variant="secondary" className="rounded-lg" disabled={actionLoading} onClick={onQuote}>
            Orçamentar
          </Button>
        ) : null}
        {status === 'QUOTED' && onOpenPdf ? (
          <Button size="sm" variant="outline" className="rounded-lg" disabled={actionLoading} onClick={onOpenPdf}>
            <FileText className="mr-1.5 h-3.5 w-3.5" />
            PDF
          </Button>
        ) : null}
        {status === 'APPROVED' && onStart ? (
          <Button size="sm" variant="secondary" className="rounded-lg" disabled={actionLoading} onClick={onStart}>
            Iniciar trabalho
          </Button>
        ) : null}
        {status === 'IN_PROGRESS' && onComplete ? (
          <Button size="sm" className="cb-services-btn-primary rounded-lg" disabled={actionLoading} onClick={onComplete}>
            Concluir
          </Button>
        ) : null}
      </footer>
    </div>
  )
}
