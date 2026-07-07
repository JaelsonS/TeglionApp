import { useCallback, useMemo, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useSearchParams } from 'react-router-dom'

import { PremiumDocumentUpload, type UploadMeta } from '@/features/client/PremiumDocumentUpload'
import { Dropzone } from '@/shared/components/portal-cliente/Dropzone'
import { EmptyState } from '@/shared/components/portal-cliente/EmptyState'
import { StatusPill } from '@/shared/components/portal-cliente/StatusPill'
import { Button } from '@/shared/components/ui/button'
import { Skeleton } from '@/shared/design-system'
import { FileText, LayoutGrid, List } from 'lucide-react'
import { getClientHubCopy } from '@/features/client/clientHubI18n'
import {
  DocumentPreviewModal,
  getViewSessionId,
} from '@/shared/components/contabil/DocumentPreviewModal'
import { clientPortalContabilApi, fetchDocumentPreviewUrl } from '@/infrastructure/api'
import type { ContabilDocument } from '@/shared/types/contabil'
import {
  clientDocumentDisplayName,
  clientDocumentValidationLabel,
} from '@/shared/utils/clientDocumentLabel'
import { DOCUMENT_WORKFLOW_LABELS, formatPtDate } from '@/shared/utils/contabilLocale'
import { getErrorMessage } from '@/shared/utils/errors'
import { emitAppDataChanged } from '@/shared/utils/appEvents'
import { cn } from '@/shared/lib/utils'
import { toast } from 'sonner'

const DOC_FILTERS_KEY = 'cb-client-doc-filters'

type DocFilters = { month: string; status: string; source: 'all' | 'firm' | 'client' }

function readDocFilters(): DocFilters {
  try {
    const raw = sessionStorage.getItem(DOC_FILTERS_KEY)
    if (raw) return { month: '', status: '', source: 'all', ...JSON.parse(raw) }
  } catch {
    /* ignore */
  }
  return { month: '', status: '', source: 'all' }
}

/** Upload e histórico — sem pedidos formais, sem chat. */
export function ClientDocumentsView({ t }: { t: ReturnType<typeof getClientHubCopy> }) {
  const [searchParams] = useSearchParams()
  const qc = useQueryClient()
  const obligationId = searchParams.get('obligationId') || ''
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [filters, setFilters] = useState<DocFilters>(readDocFilters)
  const [previewOpen, setPreviewOpen] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [previewTitle, setPreviewTitle] = useState('')
  const [previewLoading, setPreviewLoading] = useState(false)
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list')

  const docsQuery = useQuery({
    queryKey: ['client-my-documents'],
    queryFn: () =>
      clientPortalContabilApi.listMyDocuments({ limit: 200 }) as Promise<{
        items?: ContabilDocument[]
      }>,
    staleTime: 30_000,
  })

  const allDocs = docsQuery.data?.items ?? []

  const persistFilters = useCallback((next: DocFilters) => {
    setFilters(next)
    try {
      sessionStorage.setItem(DOC_FILTERS_KEY, JSON.stringify(next))
    } catch {
      /* ignore */
    }
  }, [])

  const months = useMemo(() => {
    const set = new Set<string>()
    for (const d of allDocs) {
      if (d.period) set.add(d.period)
      else if (d.createdAt) set.add(d.createdAt.slice(0, 7))
    }
    return [...set].sort().reverse()
  }, [allDocs])

  const filtered = useMemo(() => {
    return allDocs.filter((d) => {
      if (filters.source === 'firm' && d.uploadedByRole !== 'FIRM') return false
      if (filters.source === 'client' && d.uploadedByRole === 'FIRM') return false
      if (filters.month) {
        const p = d.period || (d.createdAt ? d.createdAt.slice(0, 7) : '')
        if (p !== filters.month) return false
      }
      if (filters.status && d.validationStatus !== filters.status) return false
      return true
    })
  }, [allDocs, filters])

  const fromFirm = filtered.filter((d) => d.uploadedByRole === 'FIRM')
  const fromClient = filtered.filter((d) => d.uploadedByRole !== 'FIRM')

  const handleUpload = async (files: File[], meta: UploadMeta) => {
    if (!files.length) return
    setUploading(true)
    setUploadProgress(10)
    try {
      const fd = new FormData()
      for (const file of files) fd.append('files', file)
      if (obligationId) fd.append('obligationId', obligationId)
      fd.append('title', meta.title || files[0].name)
      if (meta.description) fd.append('description', meta.description)
      if (meta.observations) fd.append('observations', meta.observations)
      if (meta.category) fd.append('category', meta.category)
      if (meta.tags) fd.append('tags', meta.tags)
      setUploadProgress(60)
      await clientPortalContabilApi.uploadDocument(fd)
      setUploadProgress(100)
      toast.success(files.length > 1 ? `${files.length} documentos enviados` : t.uploadSuccess)
      await qc.invalidateQueries({ queryKey: ['client-my-documents'] })
      emitAppDataChanged({ scope: 'documents' })
    } catch (err) {
      toast.error(t.uploadError, { description: getErrorMessage(err) })
    } finally {
      setUploading(false)
      setUploadProgress(0)
    }
  }

  const openDocument = async (d: ContabilDocument) => {
    setPreviewTitle(clientDocumentDisplayName(d))
    setPreviewOpen(true)
    setPreviewLoading(true)
    try {
      const sessionId = getViewSessionId()
      await clientPortalContabilApi.recordDocumentView(d._id, sessionId)
      const url = await fetchDocumentPreviewUrl(d._id, 'client')
      setPreviewUrl(url)
    } catch (err) {
      toast.error('Não foi possível abrir o documento', { description: getErrorMessage(err) })
      setPreviewOpen(false)
    } finally {
      setPreviewLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <Dropzone className="relative">
        <PremiumDocumentUpload uploading={uploading} uploadProgress={uploadProgress} onUpload={handleUpload} />
      </Dropzone>

      {obligationId ? (
        <p className="text-xs font-medium text-brand">Envio associado a uma obrigação fiscal.</p>
      ) : null}

      <div className="flex flex-wrap items-center gap-2">
        <div className="ml-auto flex gap-1">
          <Button
            type="button"
            variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
            size="icon"
            className="rounded-[10px]"
            aria-label="Vista em grelha"
            onClick={() => setViewMode('grid')}
          >
            <LayoutGrid className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant={viewMode === 'list' ? 'secondary' : 'ghost'}
            size="icon"
            className="rounded-[10px]"
            aria-label="Vista em lista"
            onClick={() => setViewMode('list')}
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
        <select
          className="pc-pill min-w-[7rem] cursor-pointer bg-background py-1.5"
          value={filters.month}
          onChange={(e) => persistFilters({ ...filters, month: e.target.value })}
          aria-label="Filtrar por mês"
        >
          <option value="">Todos os meses</option>
          {months.map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </select>
        <select
          className="pc-pill min-w-[7rem] cursor-pointer bg-background py-1.5"
          value={filters.status}
          onChange={(e) => persistFilters({ ...filters, status: e.target.value })}
          aria-label="Filtrar por estado"
        >
          <option value="">Todos os estados</option>
          <option value="PENDING">Pendente</option>
          <option value="APPROVED">Aprovado</option>
          <option value="REJECTED">Rejeitado</option>
        </select>
        {(['all', 'firm', 'client'] as const).map((src) => (
          <button
            key={src}
            type="button"
            className={cn('pc-pill', filters.source === src && 'pc-pill-active')}
            onClick={() => persistFilters({ ...filters, source: src })}
          >
            {src === 'all' ? 'Todos' : src === 'firm' ? 'Do escritório' : 'Enviados por mim'}
          </button>
        ))}
      </div>

      {docsQuery.isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-16 rounded-[12px]" />
          ))}
        </div>
      ) : fromClient.length === 0 && fromFirm.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="Ainda não enviaste documentos este mês."
          description="Usa a zona de upload em cima ou responde a um pedido do contabilista."
        />
      ) : (
        <>
          <DocSection title={t.documents.fromFirm} items={fromFirm} t={t} onOpen={openDocument} viewMode={viewMode} />
          <DocSection title={t.documents.myUploads} items={fromClient} t={t} onOpen={openDocument} viewMode={viewMode} />
        </>
      )}

      <DocumentPreviewModal
        open={previewOpen}
        onClose={() => {
          setPreviewOpen(false)
          setPreviewUrl(null)
        }}
        title={previewTitle}
        previewUrl={previewUrl}
        loading={previewLoading}
      />
    </div>
  )
}

function DocSection({
  title,
  items,
  t,
  onOpen,
  viewMode,
}: {
  title: string
  items: ContabilDocument[]
  t: ReturnType<typeof getClientHubCopy>
  onOpen: (d: ContabilDocument) => void
  viewMode: 'list' | 'grid'
}) {
  if (items.length === 0) return null
  return (
    <section>
      <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{title}</h2>
      {viewMode === 'grid' ? (
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((d) => (
            <li key={d._id} className="pc-card-hover p-4">
              <div className="flex h-20 items-center justify-center rounded-[10px] bg-muted text-muted-foreground">
                <FileText className="h-8 w-8" />
              </div>
              <p className="mt-3 truncate text-sm font-medium text-foreground">{clientDocumentDisplayName(d)}</p>
              <p className="text-xs text-muted-foreground">{d.createdAt ? formatPtDate(d.createdAt) : ''}</p>
              <Button type="button" variant="outline" size="sm" className="mt-3 w-full rounded-[10px]" onClick={() => onOpen(d)}>
                {t.documents.open}
              </Button>
            </li>
          ))}
        </ul>
      ) : (
        <ul className="space-y-2">
          {items.map((d) => (
            <li key={d._id} className="pc-card-hover flex flex-wrap items-center justify-between gap-3 p-4">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-foreground">{clientDocumentDisplayName(d)}</p>
                <p className="text-xs text-muted-foreground">{d.createdAt ? formatPtDate(d.createdAt) : ''}</p>
                <div className="mt-2 flex flex-wrap gap-1">
                  {d.validationStatus ? (
                    <StatusPill variant="neutral">{clientDocumentValidationLabel(d.validationStatus)}</StatusPill>
                  ) : null}
                  {d.workflowStatus ? (
                    <span className="text-caption text-muted-foreground">
                      {DOCUMENT_WORKFLOW_LABELS[d.workflowStatus] || d.workflowStatus}
                    </span>
                  ) : null}
                </div>
              </div>
              <Button type="button" variant="outline" size="sm" className="shrink-0 rounded-[10px]" onClick={() => onOpen(d)}>
                {t.documents.open}
              </Button>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
