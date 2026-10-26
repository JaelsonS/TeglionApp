import { useState } from 'react'
import {
  ArrowLeft,
  Bell,
  CheckCircle2,
  FileCheck,
  FileUp,
  MessageSquarePlus,
  X,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'

import { DocumentRequestBadge } from '@/features/firm/documents/DocumentRequestBadge'
import { displayDocumentRequestTitle } from '@/features/firm/documents/documentRequestDisplay'
import {
  documentRequestProgressHint,
  normalizeRequestStatus,
} from '@/features/firm/documents/documentRequestStatus'
import { formatPeriodLabel } from '@/features/firm/tasks/tasksOperationsUtils'
import { Button } from '@/shared/components/ui/button'
import { contabilMessagesApi } from '@/infrastructure/api'
import type { DocumentRequest } from '@/shared/types/contabil'
import { formatDateTime } from '@/shared/utils/date'
import { getErrorMessage } from '@/shared/utils/errors'
import { cn } from '@/shared/lib/utils'

type TimelineStep = { id: string; label: string; done: boolean; current: boolean }

function buildTimeline(status: ReturnType<typeof normalizeRequestStatus>): TimelineStep[] {
  const steps: TimelineStep[] = [
    { id: 'created', label: 'Criado', done: false, current: false },
    { id: 'seen', label: 'Visto', done: false, current: false },
    { id: 'waiting', label: 'Aguarda resposta', done: false, current: false },
  ]
  if (status === 'completed' || status === 'answered') {
    steps[0].done = true
    steps[1].done = true
    steps[2].done = true
    if (status === 'answered') steps[2].current = true
    return steps
  }
  if (status === 'seen') {
    steps[0].done = true
    steps[1].done = true
    steps[1].current = true
    steps[2].current = true
    return steps
  }
  // pending
  steps[0].done = true
  steps[0].current = false
  steps[2].current = true
  return steps
}

export function DocumentRequestDetailPanel({
  request,
  clientName,
  onClose,
  onNewFollowUp,
  onUpdated,
}: {
  request: DocumentRequest
  clientName: string
  onClose: () => void
  onNewFollowUp?: () => void
  onUpdated?: () => void
}) {
  const status = normalizeRequestStatus(request.status)
  const title = displayDocumentRequestTitle(request, clientName)
  const hasDocument = Boolean(request.documentId)
  const canComplete = status !== 'completed' && (status === 'answered' || hasDocument)
  const [completing, setCompleting] = useState(false)
  const timeline = buildTimeline(status)

  const handleComplete = async () => {
    setCompleting(true)
    try {
      await contabilMessagesApi.completeDocumentRequest(request.id)
      toast.success('Pedido marcado como concluído.')
      onUpdated?.()
    } catch (err) {
      toast.error('Não foi possível concluir', { description: getErrorMessage(err) })
    } finally {
      setCompleting(false)
    }
  }

  return (
    <div className="cb-docs-req-detail">
      <div className="cb-docs-req-detail-hd">
        <div className="flex min-w-0 flex-1 items-start gap-2">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="shrink-0 rounded-md xl:hidden"
            onClick={onClose}
            aria-label="Fechar"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="truncate text-base font-semibold text-foreground">{title}</h2>
              <DocumentRequestBadge status={request.status} clientViewedAt={request.seenAt} />
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              {clientName}
              <span className="mx-1.5 text-border">·</span>
              Criado {formatDateTime(request.createdAt)}
            </p>
          </div>
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-9 rounded-lg text-xs"
            disabled={status === 'completed'}
            onClick={() =>
              toast.message('Lembrete', {
                description:
                  'O cliente vê o pedido no portal. Em breve poderá reenviar aviso por e-mail daqui.',
              })
            }
          >
            <Bell className="mr-1.5 h-3.5 w-3.5" />
            Reenviar lembrete
          </Button>
          {canComplete || status !== 'completed' ? (
            <Button
              type="button"
              size="sm"
              variant="primary"
              className="h-9 rounded-lg text-xs"
              disabled={completing || (!canComplete && status !== 'pending' && status !== 'seen')}
              onClick={() => {
                if (canComplete) void handleComplete()
                else
                  toast.message('Ainda sem ficheiro', {
                    description: 'Quando o cliente responder no portal, poderá marcar como concluído.',
                  })
              }}
            >
              <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />
              {completing ? 'A concluir…' : 'Marcar concluído'}
            </Button>
          ) : null}
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="hidden h-8 w-8 rounded-md xl:flex"
            onClick={onClose}
            aria-label="Fechar detalhe"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="cb-docs-req-detail-body">
        <section className="cb-docs-req-section">
          <h3 className="cb-docs-req-section-title">Instruções</h3>
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">
            {request.instructions?.trim() || '—'}
          </p>
          {request.periodMonth ? (
            <p className="mt-2 text-xs text-muted-foreground">
              Período:{' '}
              <span className="font-medium text-foreground">{formatPeriodLabel(request.periodMonth)}</span>
            </p>
          ) : null}
        </section>

        <section className="cb-docs-req-section">
          <h3 className="cb-docs-req-section-title">Ficheiros recebidos</h3>
          {hasDocument ? (
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" className="h-9 rounded-lg text-xs" asChild>
                <Link to={`/app/firm/documents/files?doc=${request.documentId}`}>
                  <FileCheck className="mr-1.5 h-3.5 w-3.5" />
                  Validar ficheiro
                </Link>
              </Button>
            </div>
          ) : (
            <div className="cb-docs-req-files-empty">
              <FileUp className="h-5 w-5 opacity-40" aria-hidden />
              <p className="text-sm font-medium text-foreground">Ainda sem ficheiros</p>
              <p className="text-xs text-muted-foreground">O cliente responde no portal.</p>
            </div>
          )}
        </section>

        <section className="cb-docs-req-section">
          <h3 className="cb-docs-req-section-title">Linha do tempo</h3>
          <ol className="cb-docs-timeline" aria-label="Progresso do pedido">
            {timeline.map((step) => (
              <li
                key={step.id}
                className={cn(
                  'cb-docs-timeline-item',
                  step.done && 'cb-docs-timeline-item--done',
                  step.current && 'cb-docs-timeline-item--current',
                )}
              >
                <span className="cb-docs-timeline-dot" aria-hidden />
                <span className="cb-docs-timeline-label">{step.label}</span>
              </li>
            ))}
          </ol>
          <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
            {documentRequestProgressHint(status, hasDocument)}
          </p>
        </section>
      </div>

      <div className="cb-docs-req-detail-ft">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-9 rounded-lg text-xs"
          disabled={status === 'completed'}
          onClick={onNewFollowUp}
        >
          <MessageSquarePlus className="mr-1.5 h-3.5 w-3.5" />
          Novo pedido
        </Button>
      </div>
    </div>
  )
}
