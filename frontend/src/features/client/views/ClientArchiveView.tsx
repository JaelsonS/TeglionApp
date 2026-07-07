import { useMemo, useState } from 'react'
import type { FormChangeEvent } from '@/shared/types/react-events'
import { useQuery } from '@tanstack/react-query'
import { Archive, ChevronDown, Search } from 'lucide-react'
import { toast } from 'sonner'

import {
  DocumentPreviewModal,
  getViewSessionId,
} from '@/shared/components/contabil/DocumentPreviewModal'
import { EmptyState } from '@/shared/components/portal-cliente/EmptyState'
import { clientPortalContabilApi, fetchDocumentPreviewUrl } from '@/infrastructure/api'
import type { ContabilDocument } from '@/shared/types/contabil'
import { clientDocumentDisplayName } from '@/shared/utils/clientDocumentLabel'
import { formatPtDate } from '@/shared/utils/contabilLocale'
import { getErrorMessage } from '@/shared/utils/errors'
import { Input } from '@/shared/components/ui/input'
import { Button } from '@/shared/components/ui/button'
import { Skeleton } from '@/shared/design-system'
import { cn } from '@/shared/lib/utils'

function monthLabel(ym: string) {
  const [y, m] = ym.split('-')
  const d = new Date(Number(y), Number(m) - 1, 1)
  return d.toLocaleDateString('pt-PT', { month: 'long' })
}

export function ClientArchiveView() {
  const [previewOpen, setPreviewOpen] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [previewTitle, setPreviewTitle] = useState('')
  const [previewLoading, setPreviewLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [year, setYear] = useState(String(new Date().getFullYear()))
  const [openMonths, setOpenMonths] = useState<Record<string, boolean>>({})

  const query = useQuery({
    queryKey: ['client-archive-documents'],
    queryFn: () =>
      clientPortalContabilApi.listMyDocuments({
        validationStatus: 'APPROVED',
        limit: 200,
      }) as Promise<{ items?: ContabilDocument[] }>,
    staleTime: 60_000,
  })

  const items = useMemo(() => {
    const list = query.data?.items ?? []
    const q = search.trim().toLowerCase()
    return [...list]
      .filter((d) => {
        const y = (d.createdAt || '').slice(0, 4)
        if (year && y !== year) return false
        if (!q) return true
        return clientDocumentDisplayName(d).toLowerCase().includes(q)
      })
      .sort((a, b) => {
        const ta = a.createdAt ? new Date(a.createdAt).getTime() : 0
        const tb = b.createdAt ? new Date(b.createdAt).getTime() : 0
        return tb - ta
      })
  }, [query.data?.items, search, year])

  const years = useMemo(() => {
    const set = new Set<string>()
    for (const d of query.data?.items ?? []) {
      if (d.createdAt) set.add(d.createdAt.slice(0, 4))
    }
    set.add(String(new Date().getFullYear()))
    return [...set].sort().reverse()
  }, [query.data?.items])

  const byMonth = useMemo(() => {
    const map = new Map<string, ContabilDocument[]>()
    for (const d of items) {
      const key = d.period || (d.createdAt ? d.createdAt.slice(0, 7) : 'sem-data')
      if (!map.has(key)) map.set(key, [])
      map.get(key)!.push(d)
    }
    return [...map.entries()].sort((a, b) => b[0].localeCompare(a[0]))
  }, [items])

  const openDocument = async (d: ContabilDocument) => {
    setPreviewTitle(clientDocumentDisplayName(d))
    setPreviewOpen(true)
    setPreviewLoading(true)
    try {
      await clientPortalContabilApi.recordDocumentView(d._id, getViewSessionId())
      setPreviewUrl(await fetchDocumentPreviewUrl(d._id, 'client'))
    } catch (err) {
      toast.error('Não foi possível abrir', { description: getErrorMessage(err) })
      setPreviewOpen(false)
    } finally {
      setPreviewLoading(false)
    }
  }

  const download = async (d: ContabilDocument) => {
    try {
      const url = await fetchDocumentPreviewUrl(d._id, 'client')
      if (!url) throw new Error('URL indisponível')
      const a = document.createElement('a')
      a.href = url
      a.download = clientDocumentDisplayName(d)
      a.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      toast.error('Transferência falhou', { description: getErrorMessage(err) })
    }
  }

  return (
    <div className="space-y-6">
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e: FormChangeEvent) => setSearch(e.target.value)}
          placeholder="Pesquisar no arquivo…"
          className="rounded-[10px] pl-9"
        />
      </div>

      <div className="flex flex-wrap gap-2">
        {years.map((y) => (
          <button
            key={y}
            type="button"
            className={cn('pc-pill', year === y && 'pc-pill-active')}
            onClick={() => setYear(y)}
          >
            {y}
          </button>
        ))}
      </div>

      {query.isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-16 rounded-[12px]" />
          ))}
        </div>
      ) : byMonth.length === 0 ? (
        <EmptyState
          icon={Archive}
          title="Sem ficheiros neste ano"
          description="Documentos validados pelo escritório ficam aqui para consulta."
        />
      ) : (
        <div className="space-y-3">
          {byMonth.map(([monthKey, docs]) => {
            const open = openMonths[monthKey] ?? true
            return (
              <div key={monthKey} className="pc-card overflow-hidden">
                <button
                  type="button"
                  className="flex w-full items-center justify-between px-4 py-3 text-left hover:bg-muted/40"
                  onClick={() => setOpenMonths((m) => ({ ...m, [monthKey]: !open }))}
                >
                  <span className="font-semibold capitalize text-foreground">{monthLabel(monthKey)}</span>
                  <ChevronDown className={cn('h-4 w-4 transition', open && 'rotate-180')} />
                </button>
                {open ? (
                  <ul className="border-t border-border">
                    {docs.map((d) => (
                      <li
                        key={d._id}
                        className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-4 py-3 last:border-0 hover:bg-muted/30"
                      >
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-foreground">{clientDocumentDisplayName(d)}</p>
                          <p className="text-xs text-muted-foreground">
                            {d.createdAt ? formatPtDate(d.createdAt) : ''}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Button type="button" variant="ghost" size="sm" className="rounded-[10px]" onClick={() => void openDocument(d)}>
                            Ver
                          </Button>
                          <Button type="button" variant="outline" size="sm" className="rounded-[10px]" onClick={() => void download(d)}>
                            Transferir
                          </Button>
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </div>
            )
          })}
        </div>
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
