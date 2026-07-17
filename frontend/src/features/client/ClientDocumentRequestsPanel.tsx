import { useMemo, useState } from 'react'
import type { FormChangeEvent } from '@/shared/types/react-events'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useSearchParams } from 'react-router-dom'
import { Eye, EyeOff, FileUp, Inbox, Search, Sparkles } from 'lucide-react'
import { Skeleton } from '@/shared/design-system'
import { EmptyState } from '@/shared/components/portal-cliente/EmptyState'
import { RequestCard } from '@/shared/components/portal-cliente/RequestCard'
import { toast } from 'sonner'

import { PremiumDocumentUpload, type UploadMeta } from '@/features/client/PremiumDocumentUpload'
import { DocumentRequestBadge } from '@/features/firm/documents/DocumentRequestBadge'
import {
  displayDocumentRequestTitle,
  requestTimelineEvents,
} from '@/features/firm/documents/documentRequestDisplay'
import { normalizeRequestStatus } from '@/features/firm/documents/documentRequestStatus'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { clientPortalContabilApi } from '@/infrastructure/api'
import { emitAppDataChanged } from '@/shared/utils/appEvents'
import { getErrorMessage } from '@/shared/utils/errors'
import { formatDateTime } from '@/shared/utils/date'
import type { DocumentRequest } from '@/shared/types/contabil'
import { cn } from '@/shared/lib/utils'

const STATUS_TABS: { value: string; label: string }[] = [
  { value: 'pending', label: 'Pendentes' },
  { value: 'seen', label: 'Em revisão' },
  { value: 'completed', label: 'Concluídos' },
  { value: '', label: 'Todos' },
]

export function ClientDocumentRequestsPanel() {
  const [searchParams, setSearchParams] = useSearchParams()
  const selectedId = searchParams.get('request') || ''
  const rawStatus = searchParams.get('reqStatus')
  const statusFilter = rawStatus === null ? 'pending' : rawStatus

  const requestsQuery = useQuery({
    queryKey: ['client-document-requests'],
    queryFn: () => clientPortalContabilApi.listDocumentRequests(),
    staleTime: 30_000,
  })

  const qc = useQueryClient()

  const requests = (requestsQuery.data?.items ?? []) as DocumentRequest[]
  const loading = requestsQuery.isLoading
  const [search, setSearch] = useState('')
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)

  const reload = async () => {
    await requestsQuery.refetch()
    emitAppDataChanged({ scope: 'document-requests' })
  }

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return requests.filter((r) => {
      const st = normalizeRequestStatus(r.status)
      if (statusFilter === 'pending' && st !== 'pending') return false
      if (statusFilter === 'seen' && st !== 'seen' && st !== 'answered') return false
      if (statusFilter === 'completed' && st !== 'completed') return false
      if (!q) return true
      const title = displayDocumentRequestTitle(r).toLowerCase()
      const body = (r.instructions || '').toLowerCase()
      return title.includes(q) || body.includes(q)
    })
  }, [requests, search, statusFilter])

  const selected = useMemo(
    () => requests.find((r) => r.id === selectedId) || null,
    [requests, selectedId],
  )

  const selectRequest = (id: string) => {
    setSearchParams((prev) => {
      const p = new URLSearchParams(prev)
      p.set('request', id)
      return p
    })
    void clientPortalContabilApi.markDocumentRequestSeen(id).then(() => {
      void requestsQuery.refetch()
      void qc.invalidateQueries({ queryKey: ['client-dashboard'] })
      emitAppDataChanged({ scope: 'document-requests' })
    })
  }

  const closeDetail = () => {
    setSearchParams((prev) => {
      const p = new URLSearchParams(prev)
      p.delete('request')
      return p
    })
  }

  const handleUpload = async (files: File[], meta: UploadMeta, requestId: string) => {
    if (!files.length || !requestId) return
    setUploading(true)
    setUploadProgress(10)
    try {
      const fd = new FormData()
      for (const file of files) fd.append('files', file)
      fd.append('documentRequestId', requestId)
      fd.append('title', meta.title || files[0].name)
      if (meta.description) fd.append('description', meta.description)
      if (meta.observations) fd.append('observations', meta.observations)
      if (meta.category) fd.append('category', meta.category)
      if (meta.tags) fd.append('tags', meta.tags)
      setUploadProgress(60)
      await clientPortalContabilApi.uploadDocument(fd)
      setUploadProgress(100)
      toast.success(
        files.length > 1 ? `${files.length} ficheiros enviados com sucesso` : 'Ficheiro enviado com sucesso',
      )
      await reload()
      void qc.invalidateQueries({ queryKey: ['client-dashboard'] })
    } catch (err) {
      toast.error('Erro ao enviar ficheiro', { description: getErrorMessage(err) })
    } finally {
      setUploading(false)
      setUploadProgress(0)
    }
  }

  return (
    <div className="grid min-h-[32rem] gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
      <div className="pc-card flex min-h-0 flex-col">
        <div className="shrink-0 space-y-3 border-b border-border p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e: FormChangeEvent) => setSearch(e.target.value)}
              placeholder="Pesquisar pedidos…"
              className="rounded-[10px] pl-9"
            />
          </div>
          <div className="flex flex-wrap gap-2" role="tablist" aria-label="Filtrar pedidos">
            {STATUS_TABS.map(({ value: tabValue, label }) => {
              const active = statusFilter === tabValue
              return (
                <button
                  key={label}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() =>
                    setSearchParams((prev) => {
                      const p = new URLSearchParams(prev)
                      if (tabValue) p.set('reqStatus', tabValue)
                      else p.set('reqStatus', '')
                      return p
                    })
                  }
                  className={cn('pc-pill', active && 'pc-pill-active')}
                >
                  {label}
                </button>
              )
            })}
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-3">
          {loading ? (
            <div className="space-y-2 p-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-24 rounded-[12px]" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <EmptyState
              icon={Sparkles}
              title="Sem pedidos pendentes. Boa! ✨"
              description="Quando o contabilista pedir algo, aparece aqui."
            />
          ) : (
            <ul className="space-y-2">
              {filtered.map((r) => (
                <li key={r.id}>
                  <ClientRequestInboxCard
                    request={r}
                    selected={r.id === selectedId}
                    onSelect={() => selectRequest(r.id)}
                  />
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div
        className={cn(
          'pc-card min-h-[24rem] lg:min-h-0',
          !selected && 'hidden lg:flex lg:flex-col',
        )}
      >
        {selected ? (
          <ClientRequestDetail
            request={selected}
            onClose={closeDetail}
            uploading={uploading}
            uploadProgress={uploadProgress}
            onUpload={(files, meta) => handleUpload(files, meta, selected.id)}
          />
        ) : (
          <div className="flex flex-1 flex-col items-center justify-center gap-2 p-8 text-center text-muted-foreground">
            <Inbox className="h-10 w-10 opacity-30" />
            <p className="text-sm">Seleccione um pedido para ver instruções e enviar ficheiros.</p>
          </div>
        )}
      </div>
    </div>
  )
}

function ClientRequestInboxCard({
  request,
  selected,
  onSelect,
}: {
  request: DocumentRequest
  selected?: boolean
  onSelect: () => void
}) {
  const status = normalizeRequestStatus(request.status)
  const seen = Boolean(request.seenAt) || status === 'seen' || status === 'answered' || status === 'completed'
  const title = displayDocumentRequestTitle(request)
  const excerpt = request.instructions?.trim() || 'Sem instruções.'

  return (
    <RequestCard selected={selected} urgent={status === 'pending'} onClick={onSelect}>
      <div className="space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <DocumentRequestBadge status={request.status} clientViewedAt={request.seenAt} />
          <span className="inline-flex items-center gap-1 text-caption font-medium text-muted-foreground">
            {seen ? <Eye className="h-3.5 w-3.5 text-primary" /> : <EyeOff className="h-3.5 w-3.5 opacity-50" />}
            {seen ? 'Visto' : 'Não visto'}
          </span>
        </div>
        <p className="text-base font-semibold leading-snug text-foreground">{title}</p>
        <p className="line-clamp-2 text-sm text-muted-foreground">{excerpt}</p>
        <p className="text-caption text-muted-foreground">{formatDateTime(request.createdAt)}</p>
      </div>
    </RequestCard>
  )
}

function ClientRequestDetail({
  request,
  onClose,
  uploading,
  uploadProgress,
  onUpload,
}: {
  request: DocumentRequest
  onClose: () => void
  uploading: boolean
  uploadProgress: number
  onUpload: (files: File[], meta: UploadMeta) => void | Promise<void>
}) {
  const status = normalizeRequestStatus(request.status)
  const title = displayDocumentRequestTitle(request)
  const timeline = requestTimelineEvents(request)
  const canUpload = status === 'pending' || status === 'seen'

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="shrink-0 border-b border-border/60 p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
            <div className="mt-2">
              <DocumentRequestBadge status={request.status} clientViewedAt={request.seenAt} />
            </div>
          </div>
          <Button type="button" variant="ghost" size="sm" className="shrink-0 rounded-full lg:hidden" onClick={onClose}>
            Fechar
          </Button>
        </div>
      </div>

      <div className="min-h-0 flex-1 space-y-5 overflow-y-auto p-4">
        <section className="rounded-xl border border-border/60 bg-muted/20 p-4">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Instruções do escritório
          </p>
          <p className="whitespace-pre-wrap text-sm leading-relaxed">{request.instructions?.trim() || '—'}</p>
        </section>

        <section>
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Histórico do pedido
          </p>
          <ol className="relative space-y-0 border-l border-border/80 pl-4">
            {timeline.map((ev) => (
              <li key={ev.id} className="relative pb-4 last:pb-0">
                <span
                  className={cn(
                    'absolute -left-[1.35rem] top-1 h-2.5 w-2.5 rounded-full ring-2 ring-background',
                    ev.tone === 'success' ? 'bg-emerald-500' : ev.tone === 'warn' ? 'bg-amber-500' : 'bg-brand',
                  )}
                />
                <p className="text-sm font-medium">{ev.label}</p>
                {ev.at ? <p className="text-xs text-muted-foreground">{formatDateTime(ev.at)}</p> : null}
              </li>
            ))}
          </ol>
        </section>

        {canUpload ? (
          <section>
            <p className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              <FileUp className="h-3.5 w-3.5" />
              Enviar ficheiros
            </p>
            <PremiumDocumentUpload uploading={uploading} uploadProgress={uploadProgress} onUpload={onUpload} />
          </section>
        ) : status === 'answered' ? (
          <p className="rounded-[10px] border border-violet-200 bg-violet-50 px-4 py-3 text-sm text-violet-900">
            Ficheiro enviado. O escritório está a rever — quando validar, o pedido passa a concluído.
          </p>
        ) : (
          <p className="rounded-[10px] border border-border bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
            Este pedido está concluído. Obrigado pelo envio.
          </p>
        )}
      </div>
    </div>
  )
}
