import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ClipboardList, FileText, Plus, Search, X } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import type { FormChangeEvent } from '@/shared/types/react-events'
import { useSearchParams } from 'react-router-dom'
import { toast } from 'sonner'

import {
  ServiceRequestDetailPanel,
  type ServiceComment,
  type ServiceRequestDetail,
} from '@/features/firm/services/ServiceRequestDetailPanel'
import { ServiceQuoteDialog } from '@/features/firm/services/ServiceQuoteDialog'
import {
  SERVICE_STATUS_LABEL,
  servicePriorityClass,
  SERVICE_PRIORITY_LABEL,
} from '@/features/firm/services/serviceLabels'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { Sheet, SheetContent } from '@/shared/components/ui/sheet'
import { SheetHiddenTitle } from '@/shared/components/ui/sheet-hidden-title'
import { api, contabilClientsApi } from '@/infrastructure/api'
import { getErrorMessage } from '@/shared/utils/errors'
import { escapeHtml } from '@/shared/utils/escapeHtml'
import { cn } from '@/shared/lib/utils'
import type { Client } from '@/shared/types/clients'

const PIPELINE: { status: string; label: string; tone: string }[] = [
  { status: 'SUBMITTED', label: 'Novos', tone: 'cb-services-col-new' },
  { status: 'ASSIGNED', label: 'Atribuídos', tone: 'cb-services-col-assigned' },
  { status: 'QUOTED', label: 'Orçamentados', tone: 'cb-services-col-quoted' },
  { status: 'APPROVED', label: 'Aprovados', tone: 'cb-services-col-approved' },
  { status: 'IN_PROGRESS', label: 'Em curso', tone: 'cb-services-col-progress' },
  { status: 'DONE', label: 'Concluídos', tone: 'cb-services-col-done' },
]

type ServiceRequest = {
  id: string
  title: string
  clientName?: string
  status: string
  priority: string
  quotedAmountCents?: number | null
  currency?: string
  description?: string | null
}

function useServicesDetailSheet() {
  const query = '(max-width: 1279px)'
  const [useSheet, setUseSheet] = useState(
    () => typeof window !== 'undefined' && window.matchMedia(query).matches,
  )
  useEffect(() => {
    const mq = window.matchMedia(query)
    const onChange = () => setUseSheet(mq.matches)
    onChange()
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])
  return useSheet
}

export function ServicesWorkspace() {
  const [searchParams, setSearchParams] = useSearchParams()
  const selectedId = searchParams.get('request') || ''
  const qc = useQueryClient()
  const detailAsSheet = useServicesDetailSheet()

  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ clientId: '', title: '', description: '' })
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [quoteTarget, setQuoteTarget] = useState<ServiceRequest | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['service-requests'],
    queryFn: () => api.get('/contabil/service-requests').then((r) => r.data as { items: ServiceRequest[] }),
  })

  const { data: clientsData } = useQuery({
    queryKey: ['service-requests-clients'],
    queryFn: () => contabilClientsApi.list({ page: 1, limit: 300 }) as Promise<{ items?: Client[] }>,
  })

  const { data: detailData, isLoading: detailLoading } = useQuery({
    queryKey: ['service-request-detail', selectedId],
    queryFn: () =>
      api
        .get(`/contabil/service-requests/${encodeURIComponent(selectedId)}`)
        .then(
          (r) =>
            r.data as {
              request: ServiceRequestDetail
              comments: ServiceComment[]
            },
        ),
    enabled: Boolean(selectedId),
  })

  const patchMut = useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Record<string, unknown> }) =>
      api.patch(`/contabil/service-requests/${id}`, patch).then((r) => r.data),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['service-requests'] })
      void qc.invalidateQueries({ queryKey: ['service-request-detail', selectedId] })
    },
  })

  const createMut = useMutation({
    mutationFn: (payload: Record<string, unknown>) =>
      api.post('/contabil/service-requests', payload).then((r) => r.data),
    onSuccess: () => {
      toast.success('Pedido criado')
      setShowForm(false)
      setForm({ clientId: '', title: '', description: '' })
      void qc.invalidateQueries({ queryKey: ['service-requests'] })
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  })

  const items = data?.items ?? []
  const clients = clientsData?.items ?? []

  const filtered = useMemo(() => {
    let list = items
    if (statusFilter) list = list.filter((i) => i.status === statusFilter)
    const q = search.trim().toLowerCase()
    if (!q) return list
    return list.filter(
      (i) =>
        i.title.toLowerCase().includes(q) ||
        (i.clientName || '').toLowerCase().includes(q),
    )
  }, [items, search, statusFilter])

  const byStatus = (s: string) => filtered.filter((i) => i.status === s)

  const kpi = useMemo(() => {
    const active = items.filter((i) => !['DONE', 'CANCELLED'].includes(i.status)).length
    const quoted = items.filter((i) => i.status === 'QUOTED').length
    const done = items.filter((i) => i.status === 'DONE').length
    return { total: items.length, active, quoted, done }
  }, [items])

  const selectRequest = (id: string) => {
    const next = new URLSearchParams(searchParams)
    next.set('request', id)
    setSearchParams(next, { replace: true })
  }

  const clearRequest = () => {
    const next = new URLSearchParams(searchParams)
    next.delete('request')
    setSearchParams(next, { replace: true })
  }

  const selectedFromList = items.find((i) => i.id === selectedId) || null

  const openQuote = async (id: string) => {
    try {
      const res = await api.get(`/contabil/service-requests/${id}/quote`)
      const w = window.open('', '_blank')
      if (!w) return
      const q = res.data.quote
      w.document.write(`<!DOCTYPE html><html><head><title>${escapeHtml(q.title)}</title></head><body style="font-family:system-ui;padding:40px">
        <h1>${escapeHtml(q.title)}</h1><p><strong>Cliente:</strong> ${escapeHtml(q.clientName)}</p>
        <p><strong>Valor:</strong> ${escapeHtml(q.amount)}</p><p>${escapeHtml(q.description || '')}</p>
        <p style="color:#666;font-size:12px">Gerado ${escapeHtml(new Date(q.generatedAt).toLocaleString('pt-PT'))}</p>
        </body></html>`)
      w.document.close()
      w.print()
    } catch (e) {
      toast.error(getErrorMessage(e))
    }
  }

  const detailPanel = (
    <ServiceRequestDetailPanel
      request={detailData?.request || (selectedFromList as ServiceRequestDetail | null)}
      comments={detailData?.comments || []}
      loading={Boolean(selectedId) && detailLoading}
      onClose={clearRequest}
      onAssign={
        selectedFromList?.status === 'SUBMITTED'
          ? () => patchMut.mutate({ id: selectedId, patch: { status: 'ASSIGNED' } })
          : undefined
      }
      onQuote={
        selectedFromList?.status === 'ASSIGNED'
          ? () => selectedFromList && setQuoteTarget(selectedFromList)
          : undefined
      }
      onOpenPdf={
        selectedFromList?.status === 'QUOTED' ? () => void openQuote(selectedId) : undefined
      }
      onStart={
        selectedFromList?.status === 'APPROVED'
          ? () => patchMut.mutate({ id: selectedId, patch: { status: 'IN_PROGRESS' } })
          : undefined
      }
      onComplete={
        selectedFromList?.status === 'IN_PROGRESS'
          ? () => patchMut.mutate({ id: selectedId, patch: { status: 'DONE' } })
          : undefined
      }
      actionLoading={patchMut.isPending}
    />
  )

  return (
    <div className="cb-services-page">
      <header className="cb-services-page-hd shrink-0">
        <div className="cb-services-page-hd-row">
          <div>
            <h1 className="cb-services-page-title">Central de Serviços</h1>
            <p className="cb-services-page-sub">
              Pedidos, orçamentos e entregas — pipeline comercial do escritório
            </p>
          </div>
          <Button
            type="button"
            className="cb-services-btn-primary shrink-0"
            onClick={() => setShowForm((v) => !v)}
          >
            {showForm ? <X className="mr-2 h-4 w-4" /> : <Plus className="mr-2 h-4 w-4" />}
            {showForm ? 'Fechar' : 'Novo pedido'}
          </Button>
        </div>

        <div className="cb-services-toolbar">
          <div className="cb-services-kpi-row">
            <div className="cb-services-kpi">
              <span className="cb-services-kpi-label">Total</span>
              <span className="cb-services-kpi-value">{kpi.total}</span>
            </div>
            <div className="cb-services-kpi">
              <span className="cb-services-kpi-label">Activos</span>
              <span className="cb-services-kpi-value">{kpi.active}</span>
            </div>
            <div className="cb-services-kpi">
              <span className="cb-services-kpi-label">Orçamentados</span>
              <span className="cb-services-kpi-value">{kpi.quoted}</span>
            </div>
            <div className="cb-services-kpi">
              <span className="cb-services-kpi-label">Concluídos</span>
              <span className="cb-services-kpi-value">{kpi.done}</span>
            </div>
          </div>
          <div className="cb-docs-search min-w-0 flex-1 sm:max-w-xs">
            <Search className="cb-docs-search-icon" aria-hidden />
            <Input
              value={search}
              onChange={(e: FormChangeEvent) => setSearch(e.target.value)}
              placeholder="Pesquisar pedidos ou clientes…"
              className="cb-docs-search-input"
            />
          </div>
        </div>

        <div className="cb-services-status-chips">
          <button
            type="button"
            className={cn('cb-services-chip', !statusFilter && 'cb-services-chip-active')}
            onClick={() => setStatusFilter('')}
          >
            Todos
          </button>
          {PIPELINE.map((col) => (
            <button
              key={col.status}
              type="button"
              className={cn('cb-services-chip', statusFilter === col.status && 'cb-services-chip-active')}
              onClick={() => setStatusFilter(col.status)}
            >
              {col.label}
            </button>
          ))}
        </div>
      </header>

      {showForm ? (
        <form
          className="cb-services-create shrink-0"
          onSubmit={(e) => {
            e.preventDefault()
            if (!form.clientId || !form.title.trim()) {
              toast.error('Selecione o cliente e indique o título')
              return
            }
            createMut.mutate({
              clientId: form.clientId,
              title: form.title,
              description: form.description,
              status: 'ASSIGNED',
            })
          }}
        >
          <select
            className="cb-services-filter"
            value={form.clientId}
            onChange={(e) => setForm((f) => ({ ...f, clientId: e.target.value }))}
            required
            aria-label="Cliente"
          >
            <option value="">Cliente…</option>
            {clients.map((c) => (
              <option key={c._id} value={c._id}>
                {c.fullName || c.name || c.displayName}
              </option>
            ))}
          </select>
          <Input
            placeholder="Título do serviço"
            value={form.title}
            onChange={(e: FormChangeEvent) => setForm((f) => ({ ...f, title: e.target.value }))}
            className="cb-services-input"
          />
          <Input
            placeholder="Descrição (opcional)"
            value={form.description}
            onChange={(e: FormChangeEvent) => setForm((f) => ({ ...f, description: e.target.value }))}
            className="cb-services-input"
          />
          <Button type="submit" className="cb-services-btn-primary" disabled={createMut.isPending}>
            Criar pedido
          </Button>
        </form>
      ) : null}

      <div
        className={cn(
          'cb-services-body',
          selectedId && !detailAsSheet && 'cb-services-body-with-detail',
        )}
      >
        <div className="cb-services-board-wrap">
          {isLoading ? (
            <div className="cb-services-loading" />
          ) : filtered.length === 0 ? (
            <div className="cb-services-empty">
              <ClipboardList className="mb-2 h-8 w-8 opacity-30" />
              <p className="text-sm font-medium">Nenhum pedido neste filtro</p>
            </div>
          ) : (
            <div className="cb-services-board">
              {PIPELINE.map((col) => {
                const colItems = byStatus(col.status)
                if (statusFilter && statusFilter !== col.status) return null
                return (
                  <div key={col.status} className={cn('cb-services-column', col.tone)}>
                    <div className="cb-services-column-hd">
                      <span>{col.label}</span>
                      <span className="cb-services-column-count">{colItems.length}</span>
                    </div>
                    <div className="cb-services-column-body">
                      {colItems.map((req) => (
                        <article
                          key={req.id}
                          role="button"
                          tabIndex={0}
                          onClick={() => selectRequest(req.id)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault()
                              selectRequest(req.id)
                            }
                          }}
                          className={cn(
                            'cb-services-card',
                            selectedId === req.id && 'cb-services-card-active',
                          )}
                        >
                          <div className="flex items-start justify-between gap-1">
                            <p className="cb-services-card-title">{req.title}</p>
                            {req.priority && req.priority !== 'NORMAL' ? (
                              <span
                                className={cn(
                                  'cb-services-priority-pill shrink-0',
                                  servicePriorityClass(req.priority),
                                )}
                              >
                                {SERVICE_PRIORITY_LABEL[req.priority] || req.priority}
                              </span>
                            ) : null}
                          </div>
                          <p className="cb-services-card-client">{req.clientName || '—'}</p>
                          {req.quotedAmountCents != null ? (
                            <p className="cb-services-card-value">
                              {(req.quotedAmountCents / 100).toFixed(2)} {req.currency || 'EUR'}
                            </p>
                          ) : null}
                          <p className="cb-services-card-status-hint">
                            {SERVICE_STATUS_LABEL[req.status]}
                          </p>
                        </article>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {selectedId && !detailAsSheet ? (
          <aside className="cb-services-detail-aside hidden xl:flex">{detailPanel}</aside>
        ) : null}
      </div>

      {detailAsSheet ? (
        <Sheet open={Boolean(selectedId)} onOpenChange={(o: { id?: string; value?: string; label?: string; [key: string]: unknown }) => !o && clearRequest()}>
          <SheetContent side="right" className="flex w-full flex-col p-0 sm:max-w-lg">
            <SheetHiddenTitle>
              {selectedFromList?.title || 'Detalhe do pedido'}
            </SheetHiddenTitle>
            {detailPanel}
          </SheetContent>
        </Sheet>
      ) : null}

      <ServiceQuoteDialog
        open={Boolean(quoteTarget)}
        onOpenChange={(o) => !o && setQuoteTarget(null)}
        requestTitle={quoteTarget?.title}
        loading={patchMut.isPending}
        onConfirm={(cents) => {
          if (!quoteTarget) return
          patchMut.mutate(
            { id: quoteTarget.id, patch: { status: 'QUOTED', quotedAmountCents: cents } },
            {
              onSuccess: () => {
                toast.success('Orçamento guardado')
                setQuoteTarget(null)
                selectRequest(quoteTarget.id)
              },
              onError: (e) => toast.error(getErrorMessage(e)),
            },
          )
        }}
      />

      <p className="cb-services-foot shrink-0">TegLion — Serviços</p>
    </div>
  )
}
