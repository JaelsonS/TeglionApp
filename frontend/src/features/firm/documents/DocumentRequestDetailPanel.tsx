import { ArrowLeft, Bell, Check, FileCheck, FileUp, MessageSquarePlus, X } from 'lucide-react'
import { Link } from 'react-router-dom'

import { DocumentRequestBadge } from '@/features/firm/documents/DocumentRequestBadge'
import { displayDocumentRequestTitle } from '@/features/firm/documents/documentRequestDisplay'
import {
  documentRequestStepIndex,
  normalizeRequestStatus,
} from '@/features/firm/documents/documentRequestStatus'
import { formatPeriodLabel } from '@/features/firm/tasks/tasksOperationsUtils'
import { Button } from '@/shared/components/ui/button'
import type { DocumentRequest } from '@/shared/types/contabil'
import { formatDateTime } from '@/shared/utils/date'
import { cn } from '@/shared/lib/utils'

const STEPS = [
  { id: 'created', label: 'Criado' },
  { id: 'sent', label: 'Enviado' },
  { id: 'waiting', label: 'Aguarda resp.' },
  { id: 'review', label: 'Em revisão' },
  { id: 'done', label: 'Concluído' },
] as const

export function DocumentRequestDetailPanel({
  request,
  clientName,
  onClose,
  onNewFollowUp,
}: {
  request: DocumentRequest
  clientName: string
  onClose: () => void
  onNewFollowUp?: () => void
}) {
  const status = normalizeRequestStatus(request.status)
  const title = displayDocumentRequestTitle(request, clientName)
  const current = documentRequestStepIndex(status)

  return (
    <div className="flex h-full min-h-0 flex-col bg-muted/15">
      <div className="shrink-0 border-b border-border/60 bg-card px-4 py-3">
        <div className="flex items-start justify-between gap-2">
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
              <h2 className="truncate text-sm font-semibold">{title}</h2>
              <p className="mt-1 flex flex-wrap items-center gap-2 cb-text-caption">
                <span>{clientName}</span>
                <span>·</span>
                <span>Criado {formatDateTime(request.createdAt)}</span>
              </p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <DocumentRequestBadge status={request.status} clientViewedAt={request.seenAt} />
            <Button type="button" variant="ghost" size="icon" className="hidden h-8 w-8 rounded-md xl:flex" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <div className="cb-firm-split-body space-y-3 p-4">
        <section className="cb-surface">
          <div className="cb-surface-header">
            <h3 className="cb-section-title text-xs">Progresso do pedido</h3>
          </div>
          <div className="cb-surface-body">
            <div className="cb-request-stepper">
              {STEPS.map((step, i) => {
                const done = i < current
                const active = i === current
                return (
                  <div key={step.id} className="cb-request-step">
                    <div
                      className={cn(
                        'cb-request-step-circle',
                        done && 'cb-request-step-done',
                        active && 'cb-request-step-current',
                      )}
                    >
                      {done ? <Check className="h-3 w-3" /> : i + 1}
                    </div>
                    <span className="cb-request-step-label">{step.label}</span>
                    {i < STEPS.length - 1 ? (
                      <div className={cn('cb-request-step-line', done && 'cb-request-step-line-done')} />
                    ) : null}
                  </div>
                )
              })}
            </div>
          </div>
        </section>

        <section className="cb-surface">
          <div className="cb-surface-header">
            <h3 className="cb-section-title text-xs">Instruções</h3>
          </div>
          <div className="cb-surface-body">
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">
              {request.instructions?.trim() || '—'}
            </p>
            {request.periodMonth ? (
              <p className="mt-2 text-xs text-muted-foreground">
                Período: <span className="font-medium">{formatPeriodLabel(request.periodMonth)}</span>
              </p>
            ) : null}
          </div>
        </section>

        {request.documentId ? (
          <section className="cb-surface">
            <div className="cb-surface-header">
              <h3 className="cb-section-title text-xs">Documento recebido</h3>
            </div>
            <div className="cb-surface-body">
              <Button variant="outline" size="sm" className="h-8 rounded-md text-xs" asChild>
                <Link to={`/app/firm/documents/files?doc=${request.documentId}`}>
                  <FileCheck className="mr-1.5 h-3.5 w-3.5" />
                  Validar ficheiro
                </Link>
              </Button>
            </div>
          </section>
        ) : (
          <p className="text-center text-xs text-muted-foreground">
            Aguarda envio de ficheiro pelo cliente no portal.
          </p>
        )}
      </div>

      <div className="shrink-0 flex flex-wrap gap-2 border-t border-border/60 bg-card p-3">
        <Button type="button" size="sm" className="h-8 rounded-md text-xs">
          <Bell className="mr-1.5 h-3.5 w-3.5" />
          Notificar cliente
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-8 rounded-md text-xs"
          disabled={status === 'completed'}
          onClick={onNewFollowUp}
        >
          <MessageSquarePlus className="mr-1.5 h-3.5 w-3.5" />
          Novo pedido
        </Button>
        <Button type="button" variant="outline" size="sm" className="ml-auto h-8 rounded-md text-xs" asChild>
          <a href="/app/client" target="_blank" rel="noreferrer">
            <FileUp className="mr-1.5 h-3.5 w-3.5" />
            Portal
          </a>
        </Button>
      </div>
    </div>
  )
}
