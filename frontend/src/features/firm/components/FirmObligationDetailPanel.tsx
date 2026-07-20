import { useCallback, useEffect, useState } from 'react'
import {
  AlertTriangle,
  Calendar,
  Check,
  FileText,
  FileUp,
  History,
  Upload,
  User,
  X,
} from 'lucide-react'
import { toast } from 'sonner'

import {
  TYPE_LABELS,
  displayObligationTitle,
  type OperationalLane,
} from '@/features/firm/obligations/obligationOperational'
import { ViewTrackingBadge, type ViewStats } from '@/shared/components/contabil/ViewTrackingBadge'
import { DocumentPreviewModal } from '@/shared/components/contabil/DocumentPreviewModal'
import { SkeletonCard } from '@/shared/design-system'
import { contabilObligationsApi, fetchDocumentBlobUrl, fetchDocumentPreviewUrl } from '@/infrastructure/api'
import { getErrorMessage } from '@/shared/utils/errors'
import { MAX_UPLOAD_MB, validateUploadFileSize } from '@/shared/utils/uploadLimits'
import { formatEuro, formatPtDate } from '@/shared/utils/contabilLocale'
import type { Obligation } from '@/shared/types/contabil'
import { cn } from '@/shared/lib/utils'

type TimelineItem = {
  id: string
  title: string
  description?: string | null
  createdAt: string
  actorName?: string | null
}

const LANE_BADGE: Record<
  OperationalLane,
  { label: string; className: string }
> = {
  critical: { label: 'Crítico', className: 'bg-red-50 text-red-900' },
  overdue: { label: 'Atraso', className: 'bg-red-50 text-red-900' },
  waiting_client: { label: 'Aguarda cliente', className: 'bg-amber-50 text-amber-900' },
  upcoming: { label: 'Próxima', className: 'bg-sky-50 text-sky-900' },
  completed: { label: 'Concluída', className: 'bg-emerald-50 text-emerald-900' },
}

const STATUS_LABELS: Record<string, string> = {
  PENDING: 'Pendente',
  IN_PROGRESS: 'Em curso',
  WAITING_CLIENT: 'Aguarda cliente',
  DELIVERED: 'Entregue',
  OVERDUE: 'Em atraso',
  CANCELLED: 'Cancelada',
}

type Props = {
  obligation: Obligation & {
    viewStats?: ViewStats
    checklist?: string[]
    expectedDocuments?: string[]
    clientTaxId?: string
  }
  clientName: string
  onClose: () => void
  onUpdated: () => void
  embedded?: boolean
}

export function FirmObligationDetailPanel({
  obligation,
  clientName,
  onClose,
  onUpdated,
  embedded = false,
}: Props) {
  const [timeline, setTimeline] = useState<TimelineItem[]>([])
  const [viewStats, setViewStats] = useState<ViewStats | null>(obligation.viewStats || null)
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [marking, setMarking] = useState(false)
  const [previewOpen, setPreviewOpen] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [docId, setDocId] = useState<string | null>(obligation.documentId || null)
  const [previewDocId, setPreviewDocId] = useState<string | null>(null)
  const [obligationDocs, setObligationDocs] = useState<
    { id: string; title?: string; category?: string; uploadedByRole?: string }[]
  >([])

  const lane = (obligation.operationalLane || 'upcoming') as OperationalLane
  const laneBadge = LANE_BADGE[lane] ?? LANE_BADGE.upcoming
  const typeLabel = TYPE_LABELS[obligation.type] || obligation.type
  const title = displayObligationTitle(obligation)
  const isDelivered = String(obligation.status).toUpperCase() === 'DELIVERED'

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = (await contabilObligationsApi.getTimeline(obligation._id)) as {
        timeline?: TimelineItem[]
        viewStats?: ViewStats
        document?: { _id?: string }
        documents?: { id: string; title?: string; category?: string; uploadedByRole?: string }[]
      }
      setTimeline(data.timeline || [])
      setViewStats(data.viewStats || null)
      const docs = data.documents || []
      setObligationDocs(docs)
      if (data.document?._id) {
        setDocId(data.document._id)
      } else if (docs[0]?.id) {
        setDocId(docs[0].id)
      }
    } catch (err) {
      toast.error('Erro ao carregar detalhes', { description: getErrorMessage(err) })
    } finally {
      setLoading(false)
    }
  }, [obligation._id])

  useEffect(() => {
    void load()
  }, [load])

  const handleUploadFiles = async (files: FileList) => {
    setUploading(true)
    try {
      for (const file of Array.from(files)) {
        const sizeErr = validateUploadFileSize(file)
        if (sizeErr) {
          toast.error('Ficheiro demasiado grande', {
            description: `${file.name}: ${sizeErr} (máx. ${MAX_UPLOAD_MB} MB)`,
          })
          continue
        }
        const fd = new FormData()
        fd.append('file', file)
        await contabilObligationsApi.uploadGuide(obligation._id, fd)
      }
      toast.success(files.length > 1 ? 'Documentos enviados' : 'Documento enviado — cliente notificado')
      await load()
      onUpdated()
    } catch (err) {
      toast.error('Não foi possível enviar', { description: getErrorMessage(err) })
    } finally {
      setUploading(false)
    }
  }

  const markDelivered = async () => {
    setMarking(true)
    try {
      await contabilObligationsApi.update(obligation._id, { status: 'DELIVERED' })
      toast.success('Obrigação marcada como entregue')
      onUpdated()
      await load()
    } catch (err) {
      toast.error('Não foi possível actualizar', { description: getErrorMessage(err) })
    } finally {
      setMarking(false)
    }
  }

  const previewTargetId = previewDocId || docId

  const openPreview = async (targetId?: string | null) => {
    const id = targetId || docId || obligationDocs[0]?.id
    if (!id) {
      toast.error('Sem documento para pré-visualizar')
      return
    }
    setPreviewDocId(id)
    setPreviewOpen(true)
    setPreviewUrl(null)
    try {
      const url = (await fetchDocumentPreviewUrl(id, 'firm')) || (await fetchDocumentBlobUrl(id, 'firm'))
      setPreviewUrl(url)
    } catch (err) {
      toast.error('Pré-visualização indisponível', {
        description: getErrorMessage(err) || 'O ficheiro pode ter sido removido ou ainda não foi carregado.',
      })
      setPreviewOpen(false)
      setPreviewDocId(null)
    }
  }

  useEffect(() => {
    return () => {
      if (previewUrl?.startsWith('blob:')) URL.revokeObjectURL(previewUrl)
    }
  }, [previewUrl])

  const checklist = obligation.checklist || []
  const expectedDocs = obligation.expectedDocuments || []

  return (
    <div
      className={
        embedded
          ? 'cb-ob-det-pane'
          : 'fixed inset-y-0 right-0 z-40 flex h-full max-h-dvh w-full max-w-lg flex-col overflow-hidden border-l border-border bg-card shadow-2xl sm:max-w-xl'
      }
    >
      <div className="cb-ob-det-header relative shrink-0">
        <button
          type="button"
          className="absolute right-3 top-3 rounded-md p-1.5 text-muted-foreground hover:bg-muted/60"
          onClick={onClose}
          aria-label="Fechar"
        >
          <X className="h-4 w-4" />
        </button>
        <span className={cn('cb-ob-det-type-badge', laneBadge.className)}>
          <FileText className="h-3 w-3" />
          {typeLabel}
          {obligation.period ? ` · ${obligation.period}` : ''}
        </span>
        <h2 className="pr-8 text-base font-bold text-foreground">{title}</h2>
        <p className="mt-1 text-[13px] font-medium text-brand">{clientName}</p>
        <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 cb-text-caption">
          {obligation.dueDate ? (
            <span className="inline-flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              Vence {formatPtDate(obligation.dueDate, 'date')}
            </span>
          ) : null}
          <span className="inline-flex items-center gap-1">
            <User className="h-3 w-3" />
            Estado: {STATUS_LABELS[String(obligation.status).toUpperCase()] || obligation.status}
          </span>
          <span className={cn('inline-flex items-center gap-1 font-medium', lane === 'critical' || lane === 'overdue' ? 'text-red-600' : 'text-muted-foreground')}>
            <AlertTriangle className="h-3 w-3" />
            {laneBadge.label}
          </span>
        </div>
      </div>

      <div className="cb-ob-det-scroll">
        <section className="cb-ob-det-card">
          <div className="cb-ob-det-card-hd">Dados da obrigação</div>
          <div className="cb-ob-meta-grid">
            <div className="cb-ob-meta-cell">
              <p className="cb-ob-meta-label">NIF</p>
              <p className="cb-ob-meta-val">{obligation.clientTaxId || '—'}</p>
            </div>
            <div className="cb-ob-meta-cell">
              <p className="cb-ob-meta-label">Período</p>
              <p className="cb-ob-meta-val">{obligation.period || '—'}</p>
            </div>
            <div className="cb-ob-meta-cell">
              <p className="cb-ob-meta-label">Prazo legal</p>
              <p className="cb-ob-meta-val">
                {obligation.dueDate ? formatPtDate(obligation.dueDate, 'date') : '—'}
              </p>
            </div>
            <div className="cb-ob-meta-cell">
              <p className="cb-ob-meta-label">Valor</p>
              <p className="cb-ob-meta-val">{formatEuro(obligation.amountCents)}</p>
            </div>
            <div className="cb-ob-meta-cell">
              <p className="cb-ob-meta-label">Estado</p>
              <p
                className={cn(
                  'cb-ob-meta-val',
                  lane === 'critical' || lane === 'overdue' ? 'text-red-600' : undefined,
                )}
              >
                {laneBadge.label}
              </p>
            </div>
            <div className="cb-ob-meta-cell">
              <p className="cb-ob-meta-label">Tipo</p>
              <p className="cb-ob-meta-val">{typeLabel}</p>
            </div>
          </div>
        </section>

        {obligation.accountantNotes ? (
          <p className="rounded-lg border border-border/60 bg-card px-3 py-2 text-xs text-muted-foreground">
            {obligation.accountantNotes}
          </p>
        ) : null}

        {checklist.length > 0 ? (
          <section className="cb-ob-det-card">
            <div className="cb-ob-det-card-hd">Checklist de entrega</div>
            {checklist.map((item) => (
              <div key={item} className="cb-ob-checklist-item text-muted-foreground">
                <span className="cb-ob-check-box" aria-hidden />
                <span>{item}</span>
              </div>
            ))}
          </section>
        ) : null}

        <section className="cb-ob-det-card">
          <div className="cb-ob-det-card-hd">Documentos</div>
          {expectedDocs.length > 0 ? (
            <div className="flex flex-col gap-1.5 p-3 pt-2">
              {expectedDocs.map((item) => (
                <div key={item} className="cb-ob-doc-row">
                  <FileText className="h-3.5 w-3.5 shrink-0 text-sky-600" />
                  <span className="min-w-0 flex-1 truncate">{item}</span>
                  <span className="cb-pill cb-pill-amber">Esperado</span>
                </div>
              ))}
            </div>
          ) : null}
          {obligationDocs.length > 0 ? (
            <div className="flex flex-col gap-1.5 px-3 pb-2">
              {obligationDocs.map((d) => (
                <button
                  key={d.id}
                  type="button"
                  className="cb-ob-doc-row w-full text-left transition hover:border-brand/30 hover:bg-muted/40"
                  onClick={() => void openPreview(d.id)}
                >
                  <FileText className="h-3.5 w-3.5 shrink-0 text-sky-600" />
                  <span className="min-w-0 flex-1 truncate">{d.title || 'Documento'}</span>
                  <span className="cb-pill cb-pill-green">
                    {d.uploadedByRole === 'CLIENT' ? 'Cliente' : 'Escritório'}
                  </span>
                </button>
              ))}
            </div>
          ) : null}
          <label
            className="mx-3 mb-3 flex cursor-pointer flex-col items-center gap-1.5 rounded-lg border border-dashed border-border bg-muted/20 px-3 py-4 text-center transition hover:border-brand/30 hover:bg-muted/30"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault()
              const files = e.dataTransfer.files
              if (files?.length) void handleUploadFiles(files)
            }}
          >
            <Upload className="h-5 w-5 text-brand" />
            <span className="text-caption font-medium text-muted-foreground">
              {uploading ? 'A enviar…' : 'Guia ou comprovativo — arrastar ou clicar'}
            </span>
            <input
              type="file"
              multiple
              accept="application/pdf,image/*,.xls,.xlsx"
              className="hidden"
              disabled={uploading}
              onChange={(e) => {
                if (e.target.files?.length) void handleUploadFiles(e.target.files)
              }}
            />
          </label>
        </section>

        <section className="cb-ob-det-card">
          <div className="cb-ob-det-card-hd flex items-center gap-1.5">
            <History className="h-3.5 w-3.5" />
            Histórico
          </div>
          <div className="px-3 py-2">
            {loading ? (
              <p className="text-xs text-muted-foreground">A carregar…</p>
            ) : timeline.length === 0 ? (
              <p className="text-xs text-muted-foreground">Sem eventos registados.</p>
            ) : (
              <ul className="space-y-2 border-l-2 border-border/60 pl-3">
                {timeline.map((ev) => (
                  <li key={ev.id} className="relative text-xs">
                    <span className="absolute -left-[13px] top-1 h-1.5 w-1.5 rounded-full bg-brand" />
                    <p className="font-medium text-foreground">{ev.title}</p>
                    <p className="text-muted-foreground">{formatPtDate(ev.createdAt)}</p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>

        {loading ? (
          <SkeletonCard />
        ) : viewStats ? (
          <section className="cb-ob-det-card px-3 py-2">
            <p className="mb-2 text-caption font-semibold uppercase tracking-wide text-muted-foreground">
              Leitura pelo cliente
            </p>
            <ViewTrackingBadge stats={viewStats} />
          </section>
        ) : null}
      </div>

      <div className="cb-ob-det-actions">
        {!isDelivered ? (
          <button
            type="button"
            disabled={marking}
            className="cb-ob-det-btn cb-ob-det-btn-primary"
            onClick={() => void markDelivered()}
          >
            <Check className="h-3.5 w-3.5" />
            {marking ? 'A guardar…' : 'Marcar entregue'}
          </button>
        ) : null}
        {previewTargetId || obligationDocs.length > 0 ? (
          <button
            type="button"
            className={cn('cb-ob-det-btn cb-ob-det-btn-secondary', isDelivered && 'ml-auto')}
            onClick={() => void openPreview()}
          >
            <FileUp className="h-3.5 w-3.5" />
            Pré-visualizar
          </button>
        ) : null}
      </div>

      <DocumentPreviewModal
        open={previewOpen}
        onClose={() => {
          setPreviewOpen(false)
          setPreviewDocId(null)
          if (previewUrl?.startsWith('blob:')) URL.revokeObjectURL(previewUrl)
          setPreviewUrl(null)
        }}
        title={
          obligationDocs.find((d) => d.id === previewTargetId)?.title || obligation.title || 'Documento'
        }
        previewUrl={previewUrl}
        loading={previewOpen && !previewUrl}
      />
    </div>
  )
}
