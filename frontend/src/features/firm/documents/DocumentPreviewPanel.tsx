import { useCallback, useEffect, useState } from 'react'
import type { FormChangeEvent } from '@/shared/types/react-events'
import {
  Check,
  Download,
  FileStack,
  History,
  Loader2,
  MessageSquare,
  RotateCcw,
  Send,
  X,
} from 'lucide-react'
import { toast } from 'sonner'

import { Badge, Button, Input, SkeletonCard } from '@/shared/design-system'
import { cn } from '@/shared/lib/utils'
import { contabilDocumentsApi, contabilMessagesApi, fetchDocumentBlobUrl } from '@/infrastructure/api'
import { formatDateTime } from '@/shared/utils/date'
import { emitAppDataChanged } from '@/shared/utils/appEvents'
import { getErrorMessage } from '@/shared/utils/errors'
import { formatPtDate } from '@/shared/utils/contabilLocale'
import type { DocumentDetailResponse, FirmDocumentRow } from './documentTypes'
import {
  displayClientName,
  displayDocumentName,
  formatFileSize,
  mimeKind,
  mimeLabel,
  relativeTimePt,
  validationBadgeVariant,
  validationLabel,
} from './documentDisplay'

type Props = {
  doc: FirmDocumentRow | null
  detail: DocumentDetailResponse | null
  detailLoading: boolean
  getPreviewUrl: (id: string) => Promise<string | null>
  onRefresh: () => Promise<void>
  onClose?: () => void
  readOnly?: boolean
  /** Painel lateral largo no desktop — acções no topo e pré-visualização maior */
  layout?: 'default' | 'expanded'
}

export function DocumentPreviewPanel({
  doc,
  detail,
  detailLoading,
  getPreviewUrl,
  onRefresh,
  onClose,
  readOnly = false,
  layout = 'default',
}: Props) {
  const expanded = layout === 'expanded'
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [previewLoading, setPreviewLoading] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)
  const [comment, setComment] = useState('')
  const [sendingComment, setSendingComment] = useState(false)

  const loadPreview = useCallback(async () => {
    if (!doc?._id) {
      setPreviewUrl(null)
      return
    }
    setPreviewLoading(true)
    try {
      const url = await getPreviewUrl(doc._id)
      setPreviewUrl(url)
    } catch (err) {
      setPreviewUrl(null)
      toast.error('Pré-visualização indisponível', { description: getErrorMessage(err) })
    } finally {
      setPreviewLoading(false)
    }
  }, [doc?._id, getPreviewUrl])

  useEffect(() => {
    void loadPreview()
  }, [loadPreview])

  const runAction = async (fn: () => Promise<void>) => {
    setActionLoading(true)
    try {
      await fn()
      await onRefresh()
    } catch (err) {
      toast.error('Ação falhou', { description: getErrorMessage(err) })
    } finally {
      setActionLoading(false)
    }
  }

  const handleValidate = (status: 'APPROVED' | 'REJECTED') =>
    runAction(async () => {
      if (!doc) return
      await contabilDocumentsApi.validate(doc._id, status)
      toast.success(status === 'APPROVED' ? 'Documento aprovado' : 'Documento rejeitado')
      emitAppDataChanged({ scope: 'document-requests' })
    })

  const handleResend = () =>
    runAction(async () => {
      if (!doc) return
      await contabilDocumentsApi.requestResend(doc._id, {
        message: comment.trim() || undefined,
      })
      setComment('')
      toast.success('Pedido de reenvio enviado ao cliente')
    })

  const handleDownload = async () => {
    if (!doc) return
    try {
      const url = await fetchDocumentBlobUrl(doc._id, 'firm')
      const a = document.createElement('a')
      a.href = url
      a.download = displayDocumentName(doc)
      a.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      toast.error('Transferência falhou', { description: getErrorMessage(err) })
    }
  }

  const handleSendComment = async () => {
    if (!doc?.clientId) return
    const body = comment.trim()
    if (!body) return
    setSendingComment(true)
    try {
      await contabilMessagesApi.send({
        clientId: doc.clientId,
        body,
        obligationId: doc.obligationId,
      })
      setComment('')
      toast.success('Mensagem enviada ao cliente')
      await onRefresh()
    } catch (err) {
      toast.error('Não foi possível enviar', { description: getErrorMessage(err) })
    } finally {
      setSendingComment(false)
    }
  }

  if (!doc) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 p-10 text-center text-muted-foreground">
        <FileStack className="h-12 w-12 opacity-30" />
        <p className="max-w-xs text-sm">Selecione um documento na lista para pré-visualizar e validar.</p>
      </div>
    )
  }

  const kind = mimeKind(doc.mimeType, doc.title)
  const history = detail?.history || []
  const views = detail?.views

  const actionButtons = (
    <>
      {!readOnly && doc.validationStatus === 'PENDING' ? (
        <>
          <Button
            type="button"
            size="sm"
            className="rounded-full"
            disabled={actionLoading}
            onClick={() => void handleValidate('APPROVED')}
          >
            <Check className="mr-1.5 h-4 w-4" />
            Aprovar
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="rounded-full"
            disabled={actionLoading}
            onClick={() => void handleValidate('REJECTED')}
          >
            <X className="mr-1.5 h-4 w-4" />
            Rejeitar
          </Button>
        </>
      ) : null}
      <Button type="button" size="sm" variant="outline" className="rounded-full" onClick={() => void handleDownload()}>
        <Download className="mr-1.5 h-4 w-4" />
        Descarregar
      </Button>
      {!readOnly ? (
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="rounded-full"
          disabled={actionLoading}
          onClick={() => void handleResend()}
        >
          <RotateCcw className="mr-1.5 h-4 w-4" />
          Solicitar reenvio
        </Button>
      ) : null}
    </>
  )

  return (
    <div className={cn('cb-firm-detail-embed cb-docs-preview-panel flex h-full min-h-0 flex-col', expanded && 'cb-docs-preview-panel-expanded')}>
      <header className="flex shrink-0 flex-col gap-3 border-b border-border/60 px-4 py-3 sm:px-5 sm:py-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="truncate text-base font-semibold sm:text-lg">{displayDocumentName(doc)}</h2>
              <Badge variant={validationBadgeVariant(doc.validationStatus)} className="normal-case">
                {validationLabel(doc.validationStatus)}
              </Badge>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              {displayClientName(doc)}
              {doc.period ? ` · ${doc.period}` : ''}
            </p>
          </div>
          {onClose ? (
            <Button type="button" size="icon" variant="ghost" className="shrink-0 rounded-full xl:hidden" onClick={onClose}>
              <X className="h-5 w-5" />
            </Button>
          ) : null}
        </div>
        <div className="hidden flex-wrap gap-2 xl:flex">{actionButtons}</div>
      </header>

      <div
        className={cn(
          'grid min-h-0 flex-1',
          expanded ? 'xl:grid-cols-[minmax(0,1fr)_280px]' : 'xl:grid-cols-[minmax(0,1fr)_260px]',
        )}
      >
        <div className="flex min-h-0 flex-col border-b border-border/60 xl:border-b-0 xl:border-r">
          <div
            className={cn(
              'relative min-h-[240px] flex-1 bg-muted/30',
              expanded ? 'min-h-[min(52vh,520px)] xl:min-h-[min(60vh,640px)]' : 'xl:min-h-[320px]',
            )}
          >
            {previewLoading ? (
              <div className="absolute inset-0 flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : previewUrl && kind === 'image' ? (
              <img src={previewUrl} alt={displayDocumentName(doc)} className="h-full w-full object-contain" />
            ) : previewUrl ? (
              <iframe title={displayDocumentName(doc)} src={previewUrl} className="h-full min-h-[280px] w-full" />
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                Pré-visualização indisponível para este tipo de ficheiro.
              </div>
            )}
          </div>
          <div className="flex flex-wrap gap-2 border-t border-border/60 p-3 xl:hidden">{actionButtons}</div>
        </div>

        <aside className="flex min-h-0 flex-col overflow-y-auto">
          <section className="border-b border-border/60 p-4">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Detalhes</h3>
            <dl className="mt-3 space-y-2 text-sm">
              <div className="flex justify-between gap-2">
                <dt className="text-muted-foreground">Tipo</dt>
                <dd>{mimeLabel(doc.mimeType, doc.title)}</dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-muted-foreground">Tamanho</dt>
                <dd>{formatFileSize(doc.sizeBytes)}</dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-muted-foreground">Enviado</dt>
                <dd>{doc.createdAt ? formatDateTime(doc.createdAt) : '—'}</dd>
              </div>
              {doc.validatedAt ? (
                <div className="flex justify-between gap-2">
                  <dt className="text-muted-foreground">Validado</dt>
                  <dd>{formatPtDate(doc.validatedAt, 'long')}</dd>
                </div>
              ) : null}
              {views?.totalViews != null ? (
                <div className="flex justify-between gap-2">
                  <dt className="text-muted-foreground">Visualizações</dt>
                  <dd>{views.totalViews}</dd>
                </div>
              ) : null}
              {doc.obligationTitle ? (
                <div className="flex justify-between gap-2">
                  <dt className="text-muted-foreground">Obrigação</dt>
                  <dd className="truncate text-right">{doc.obligationTitle}</dd>
                </div>
              ) : null}
            </dl>
          </section>

          {!readOnly ? (
          <section className="border-b border-border/60 p-4">
            <h3 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              <MessageSquare className="h-3.5 w-3.5" />
              Mensagem ao cliente
            </h3>
            <div className="mt-2 flex gap-2">
              <Input
                value={comment}
                onChange={(e: FormChangeEvent) => setComment(e.target.value)}
                placeholder="Comentário ou instrução…"
                className="rounded-full text-sm"
              />
              <Button
                type="button"
                size="icon"
                className="shrink-0 rounded-full"
                disabled={sendingComment || !comment.trim()}
                onClick={() => void handleSendComment()}
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
            <p className="mt-1.5 cb-text-caption">
              O pedido de reenvio usa a caixa acima se estiver preenchida.
            </p>
          </section>
          ) : null}

          <section className="p-4">
            <h3 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              <History className="h-3.5 w-3.5" />
              Histórico
            </h3>
            {detailLoading ? (
              <div className="mt-3 space-y-2">
                <SkeletonCard />
              </div>
            ) : history.length === 0 ? (
              <p className="mt-3 text-sm text-muted-foreground">Sem eventos registados.</p>
            ) : (
              <ul className="mt-3 space-y-3">
                {history.slice(0, 12).map((h) => (
                  <li key={h.id} className="relative border-l-2 border-brand/20 pl-3">
                    <p className="text-sm font-medium">{h.title || 'Evento'}</p>
                    {h.description ? (
                      <p className="text-xs text-muted-foreground">{h.description}</p>
                    ) : null}
                    <p className="mt-0.5 cb-text-caption">
                      {h.createdAt ? relativeTimePt(h.createdAt) : ''}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </aside>
      </div>
    </div>
  )
}
