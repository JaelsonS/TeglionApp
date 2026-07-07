import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { toast } from 'sonner'

import { contabilDocumentsApi, contabilClientsApi, contabilObligationsApi } from '@/infrastructure/api'
import { getErrorMessage } from '@/shared/utils/errors'
import type { Client } from '@/shared/types/clients'
import type { Obligation } from '@/shared/types/contabil'
import type {
  DocumentDetailResponse,
  DocumentFilters,
  DocumentGroupMode,
  DocumentSourceFilter,
  DocumentValidationStatus,
  DocumentsListResponse,
  FirmDocumentRow,
} from './documentTypes'

const PAGE_SIZE = 50

function parseStatus(
  status: string | null,
  pendingLegacy: boolean,
): DocumentValidationStatus | null {
  if (pendingLegacy) return 'PENDING'
  if (status === 'PENDING' || status === 'APPROVED' || status === 'REJECTED') return status
  return null
}

function parseSource(raw: string | null): DocumentSourceFilter {
  if (raw === 'firm' || raw === 'client') return raw
  return 'all'
}

function readFilters(params: URLSearchParams): DocumentFilters {
  const group = params.get('group')
  const groupMode: DocumentGroupMode =
    group === 'client' || group === 'period' || group === 'obligation' ? group : 'none'
  return {
    period: params.get('period'),
    status: parseStatus(params.get('status'), params.get('pending') === '1'),
    source: parseSource(params.get('source')),
    clientId: params.get('clientId') ,
    obligationId: params.get('obligationId'),
    group: groupMode,
    page: Math.max(1, Number(params.get('page') || 1)),
    docId: params.get('doc'),
    q: params.get('q') || '',
  }
}

function isThisMonth(iso?: string): boolean {
  if (!iso) return false
  const d = new Date(iso)
  const now = new Date()
  return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth()
}

export function useDocumentsHub() {
  const [searchParams, setSearchParams] = useSearchParams()
  const filters = useMemo(() => readFilters(searchParams), [searchParams])

  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [items, setItems] = useState<FirmDocumentRow[]>([])
  const [total, setTotal] = useState(0)
  const [hasMore, setHasMore] = useState(false)
  const [facetItems, setFacetItems] = useState<FirmDocumentRow[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [obligations, setObligations] = useState<Obligation[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(filters.docId)
  const [detail, setDetail] = useState<DocumentDetailResponse | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const previewCache = useRef<Map<string, string>>(new Map())

  const updateParams = useCallback(
    (patch: Record<string, string | null | undefined>, opts?: { resetPage?: boolean }) => {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev)
        for (const [key, value] of Object.entries(patch)) {
          if (value == null || value === '') next.delete(key)
          else next.set(key, value)
        }
        if (opts?.resetPage !== false && !('page' in patch)) {
          next.delete('page')
        }
        if ('pending' in patch) next.delete('pending')
        return next
      })
    },
    [setSearchParams],
  )

  const listParams = useMemo(
    () => ({
      period: filters.period || undefined,
      validationStatus: filters.status || undefined,
      clientId: filters.clientId || undefined,
      obligationId: filters.obligationId || undefined,
      page: filters.page,
      limit: PAGE_SIZE,
    }),
    [filters],
  )

  const loadFacets = useCallback(async () => {
    try {
      const res = (await contabilDocumentsApi.list({
        clientId: filters.clientId || undefined,
        limit: 300,
        page: 1,
      })) as DocumentsListResponse
      setFacetItems(res.items || [])
    } catch {
      setFacetItems([])
    }
  }, [filters.clientId])

  const loadMeta = useCallback(async () => {
    try {
      const [clientRes, obRes] = await Promise.all([
        contabilClientsApi.list({ page: 1, limit: 200 }) as Promise<{ items?: Client[] }>,
        contabilObligationsApi.list({ limit: 150 }) as Promise<{ items?: Obligation[] }>,
      ])
      setClients(clientRes.items || [])
      setObligations(obRes.items || [])
    } catch {
      /* optional */
    }
  }, [])

  const loadPage = useCallback(
    async (append?: boolean) => {
      const shouldAppend = append ?? listParams.page > 1
      if (shouldAppend) setLoadingMore(true)
      else setLoading(true)
      try {
        const res = (await contabilDocumentsApi.list(listParams)) as DocumentsListResponse
        const rows = res.items || []
        setTotal(res.total ?? rows.length)
        setHasMore(Boolean(res.hasMore))
        setItems((prev) => (shouldAppend ? [...prev, ...rows] : rows))
      } catch (err) {
        toast.error('Não foi possível carregar documentos', {
          description: getErrorMessage(err),
          action: { label: 'Tentar novamente', onClick: () => void loadPage(shouldAppend) },
        })
      } finally {
        setLoading(false)
        setLoadingMore(false)
      }
    },
    [listParams, filters.docId, updateParams],
  )

  const loadDetail = useCallback(async (docId: string) => {
    setDetailLoading(true)
    try {
      const res = (await contabilDocumentsApi.getDetail(docId)) as DocumentDetailResponse
      setDetail(res)
    } catch (err) {
      setDetail(null)
      toast.error('Detalhe indisponível', { description: getErrorMessage(err) })
    } finally {
      setDetailLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadMeta()
  }, [loadMeta])

  useEffect(() => {
    void loadFacets()
  }, [loadFacets])

  useEffect(() => {
    void loadPage(listParams.page > 1)
  }, [loadPage, listParams.page])

  useEffect(() => {
    setSelectedId(filters.docId)
  }, [filters.docId])

  useEffect(() => {
    if (!selectedId) {
      setDetail(null)
      return
    }
    void loadDetail(selectedId)
  }, [selectedId, loadDetail])

  const selectDocument = useCallback(
    (id: string | null) => {
      setSelectedId(id)
      updateParams({ doc: id }, { resetPage: false })
    },
    [updateParams],
  )

  const filteredItems = useMemo(() => {
    let list = items
    if (filters.source === 'firm') {
      list = list.filter((d) => d.uploadedByRole === 'FIRM')
    } else if (filters.source === 'client') {
      list = list.filter((d) => d.uploadedByRole !== 'FIRM')
    }
    const q = filters.q.trim().toLowerCase()
    if (!q) return list
    return list.filter((d) => {
      const hay = [
        d.title,
        d.originalName,
        d.clientName,
        d.clientEmail,
        d.clientTaxId,
        d.period,
        d.obligationTitle,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
      return hay.includes(q)
    })
  }, [items, filters.q, filters.source])

  const metrics = useMemo(() => {
    const base = facetItems
    return {
      pending: base.filter((d) => d.validationStatus === 'PENDING').length,
      approved: base.filter((d) => d.validationStatus === 'APPROVED').length,
      rejected: base.filter((d) => d.validationStatus === 'REJECTED').length,
      thisMonth: base.filter((d) => isThisMonth(d.createdAt)).length,
      fromFirm: base.filter((d) => d.uploadedByRole === 'FIRM').length,
      fromClient: base.filter((d) => d.uploadedByRole !== 'FIRM').length,
    }
  }, [facetItems])

  const periodOptions = useMemo(() => {
    const set = new Set<string>()
    for (const d of facetItems) {
      if (d.period) set.add(d.period)
    }
    return Array.from(set).sort().reverse()
  }, [facetItems])

  const obligationOptions = useMemo(() => {
    const map = new Map<string, string>()
    for (const d of facetItems) {
      if (d.obligationId) {
        map.set(d.obligationId, d.obligationTitle || 'Obrigação')
      }
    }
    for (const o of obligations) {
      const id = o._id || o.id
      if (id && !map.has(id)) map.set(id, o.title || 'Obrigação')
    }
    return Array.from(map.entries()).map(([id, title]) => ({ id, title }))
  }, [facetItems, obligations])

  const clientById = useMemo(() => {
    const map = new Map<string, Client>()
    for (const c of clients) map.set(c._id, c)
    return map
  }, [clients])

  const activeFilterCount = useMemo(() => {
    let n = 0
    if (filters.period) n++
    if (filters.status) n++
    if (filters.clientId) n++
    if (filters.obligationId) n++
    if (filters.source !== 'all') n++
    if (filters.q.trim()) n++
    return n
  }, [filters])

  const refresh = useCallback(async () => {
    await Promise.all([loadPage(false), loadFacets()])
    if (selectedId) await loadDetail(selectedId)
  }, [loadPage, loadFacets, loadDetail, selectedId])

  const loadMore = useCallback(() => {
    if (!hasMore || loadingMore) return
    updateParams({ page: String(filters.page + 1) }, { resetPage: false })
  }, [hasMore, loadingMore, filters.page, updateParams])

  const getPreviewUrl = useCallback(async (docId: string) => {
    const cached = previewCache.current.get(docId)
    if (cached) return cached
    const { fetchDocumentPreviewUrl } = await import('@/infrastructure/api')
    const url = await fetchDocumentPreviewUrl(docId, 'firm')
    if (url) previewCache.current.set(docId, url)
    return url
  }, [])

  const revokePreview = useCallback((docId: string) => {
    const url = previewCache.current.get(docId)
    if (url) {
      URL.revokeObjectURL(url)
      previewCache.current.delete(docId)
    }
  }, [])

  return {
    filters,
    updateParams,
    loading,
    loadingMore,
    items: filteredItems,
    total,
    hasMore,
    metrics,
    periodOptions,
    obligationOptions,
    clients,
    clientById,
    selectedId,
    selectDocument,
    detail,
    detailLoading,
    activeFilterCount,
    refresh,
    loadMore,
    getPreviewUrl,
    revokePreview,
  }
}
