import { useCallback, useEffect, useMemo, useState } from 'react'
import type { FormChangeEvent } from '@/shared/types/react-events'
import { useSearchParams } from 'react-router-dom'
import { CheckCircle2, Clock3, FileText, Inbox, Plus, Search } from 'lucide-react'
import { toast } from 'sonner'

import { DocumentsKpiStrip } from '@/features/firm/documents-hub/DocumentsKpiStrip'
import { NewRequestDialog } from '@/features/firm/documents-hub/requests/NewRequestDialog'
import { RequestRow } from '@/features/firm/documents-hub/requests/RequestRow'
import { DocumentRequestDetailPanel } from '@/features/firm/documents/DocumentRequestDetailPanel'
import { normalizeRequestStatus } from '@/features/firm/documents/documentRequestStatus'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { FirmSplitView, EmptyState } from '@/shared/design-system'
import { useFirmInbox } from '@/shared/hooks/queries/useFirmInbox'
import { contabilMessagesApi } from '@/infrastructure/api'
import { emitAppDataChanged, onAppDataChanged } from '@/shared/utils/appEvents'
import { getErrorMessage } from '@/shared/utils/errors'
import { cn } from '@/shared/lib/utils'
import type { DocumentRequest } from '@/shared/types/contabil'

type RequestWithClient = DocumentRequest & { clientName?: string }

const STATUS_FILTERS = [
  { value: '', label: 'Todos' },
  { value: 'pending', label: 'Pendentes' },
  { value: 'seen', label: 'Vistos' },
  { value: 'answered', label: 'Respondidos' },
  { value: 'completed', label: 'Concluídos' },
] as const

function startOfWeekMs(d = new Date()) {
  const x = new Date(d)
  const day = x.getDay()
  const diff = day === 0 ? -6 : 1 - day
  x.setHours(0, 0, 0, 0)
  x.setDate(x.getDate() + diff)
  return x.getTime()
}

export function FormalRequestsModule() {
  const [searchParams, setSearchParams] = useSearchParams()
  const selectedClientId = searchParams.get('client') || ''
  const selectedRequestId = searchParams.get('request') || ''
  const statusFilter = searchParams.get('reqStatus') || ''

  const inboxQuery = useFirmInbox({
    clientId: selectedClientId || undefined,
    status: statusFilter || undefined,
  })

  const clients = inboxQuery.data?.clients ?? []
  const requests = (inboxQuery.data?.requests ?? []) as RequestWithClient[]
  const loading = inboxQuery.isLoading
  const loadingRequests = inboxQuery.isFetching && !inboxQuery.isLoading

  const [search, setSearch] = useState('')
  const [composeOpen, setComposeOpen] = useState(searchParams.get('compose') === '1')
  const [sending, setSending] = useState(false)

  const clientById = useMemo(() => new Map(clients.map((c) => [c._id, c])), [clients])

  const refresh = useCallback(async () => {
    await inboxQuery.refetch()
    emitAppDataChanged({ scope: 'document-requests' })
  }, [inboxQuery])

  useEffect(() => {
    if (inboxQuery.isError) {
      toast.error('Erro ao carregar pedidos', { description: getErrorMessage(inboxQuery.error) })
    }
  }, [inboxQuery.isError, inboxQuery.error])

  useEffect(() => {
    return onAppDataChanged((d) => {
      if (
        !d.scope ||
        d.scope === 'document-requests' ||
        d.scope === 'documents' ||
        d.scope === 'live'
      ) {
        void inboxQuery.refetch()
      }
    })
  }, [inboxQuery])

  const filteredRequests = useMemo(() => {
    let list = requests
    if (statusFilter) {
      list = list.filter((r) => normalizeRequestStatus(r.status) === statusFilter)
    }
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(
        (r) =>
          r.title?.toLowerCase().includes(q) ||
          r.instructions?.toLowerCase().includes(q) ||
          r.clientName?.toLowerCase().includes(q),
      )
    }
    return list
  }, [requests, statusFilter, search])

  const kpis = useMemo(() => {
    const open = requests.filter((r) => {
      const s = normalizeRequestStatus(r.status)
      return s === 'pending' || s === 'seen' || s === 'answered'
    }).length
    const awaitingValidation = requests.filter((r) => {
      const s = normalizeRequestStatus(r.status)
      return s === 'answered' || Boolean(r.documentId && s !== 'completed')
    }).length
    const weekStart = startOfWeekMs()
    const completedWeek = requests.filter((r) => {
      if (normalizeRequestStatus(r.status) !== 'completed') return false
      const at = r.completedAt || r.answeredAt || r.createdAt
      return at ? new Date(at).getTime() >= weekStart : false
    }).length
    return [
      { id: 'open', value: open, label: 'pedidos em aberto', tone: 'brand' as const, icon: FileText },
      {
        id: 'wait',
        value: awaitingValidation,
        label: 'à espera de validação',
        tone: 'amber' as const,
        icon: Clock3,
      },
      {
        id: 'done',
        value: completedWeek,
        label: 'concluído esta semana',
        tone: 'emerald' as const,
        icon: CheckCircle2,
      },
    ]
  }, [requests])

  const selectedRequest = useMemo(
    () => filteredRequests.find((r) => r.id === selectedRequestId) || null,
    [filteredRequests, selectedRequestId],
  )

  const updateParams = (patch: Record<string, string | null>) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev)
      for (const [k, v] of Object.entries(patch)) {
        if (v == null || v === '') next.delete(k)
        else next.set(k, v)
      }
      next.delete('tab')
      return next
    })
  }

  // Auto-seleccionar o primeiro pedido no desktop (lista + detalhe como no mockup).
  useEffect(() => {
    if (loading || loadingRequests || composeOpen) return
    if (selectedRequestId || searchParams.get('compose') === '1') return
    if (filteredRequests.length === 0) return
    if (typeof window !== 'undefined' && window.matchMedia('(max-width: 1279px)').matches) return
    updateParams({ request: filteredRequests[0].id })
    // eslint-disable-next-line react-hooks/exhaustive-deps -- só na carga / mudança de lista filtrada
  }, [loading, loadingRequests, filteredRequests, selectedRequestId, composeOpen])

  const submitNewRequest = async (payload: {
    clientId: string
    title: string
    instructions: string
  }) => {
    setSending(true)
    try {
      await contabilMessagesApi.createDocumentRequest({
        clientId: payload.clientId,
        title: payload.title || undefined,
        instructions: payload.instructions,
      })
      toast.success('Pedido formal criado')
      setComposeOpen(false)
      updateParams({ compose: null, client: payload.clientId })
      await refresh()
    } catch (err) {
      toast.error('Não foi possível criar o pedido', { description: getErrorMessage(err) })
    } finally {
      setSending(false)
    }
  }

  const toolbar = (
    <div className="cb-docs-requests-toolbar">
      <DocumentsKpiStrip items={kpis} className="mb-1" />
      <div className="cb-docs-requests-toolbar-hd">
        <div className="min-w-0">
          <p className="cb-docs-requests-toolbar-title">Pedidos formais ao cliente</p>
          <p className="cb-docs-requests-toolbar-sub">
            Crie pedidos com prazo e instruções — o cliente responde no portal; os ficheiros seguem para
            validação em Ficheiros.
          </p>
        </div>
        <Button
          type="button"
          size="sm"
          variant="primary"
          className="cb-docs-requests-btn h-9 shrink-0 rounded-lg px-3"
          onClick={() => {
            setComposeOpen(true)
            updateParams({ compose: '1' })
          }}
        >
          <Plus className="mr-1.5 h-4 w-4" />
          Novo pedido
        </Button>
      </div>
      <div className="cb-docs-toolbar">
        <select
          value={selectedClientId}
          onChange={(e) => updateParams({ client: e.target.value || null, request: null })}
          className="cb-docs-filter"
          aria-label="Filtrar por cliente"
        >
          <option value="">Cliente: Todos</option>
          {clients.map((c) => (
            <option key={c._id} value={c._id}>
              {c.fullName || c.name}
            </option>
          ))}
        </select>
        <div className="cb-docs-search min-w-0 flex-1">
          <Search className="cb-docs-search-icon" aria-hidden />
          <Input
            className="cb-docs-search-input"
            placeholder="Pesquisar pedidos…"
            value={search}
            onChange={(e: FormChangeEvent) => setSearch(e.target.value)}
          />
        </div>
      </div>
      <div className="cb-docs-requests-chips">
        {STATUS_FILTERS.map(({ value, label }) => (
          <button
            key={value || 'all'}
            type="button"
            onClick={() => updateParams({ reqStatus: value || null })}
            className={cn(
              'cb-docs-requests-chip',
              (statusFilter || '') === value && 'cb-docs-requests-chip-active',
            )}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  )

  const listBody = (
    <div className="cb-docs-req-list min-h-0 flex-1 overflow-y-auto">
      {loading || loadingRequests ? (
        <div className="space-y-2 p-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-[4.5rem] animate-pulse rounded-xl bg-muted/30" />
          ))}
        </div>
      ) : filteredRequests.length === 0 ? (
        <EmptyState
          className="m-3"
          icon={Inbox}
          title={requests.length === 0 ? 'Ainda sem pedidos de documentos' : 'Nenhum pedido neste filtro'}
          description={
            requests.length === 0
              ? 'Peça documentos aos clientes de forma formal. Eles recebem o pedido no portal e enviam os ficheiros para validação.'
              : 'Altere o filtro de estado ou limpe a pesquisa.'
          }
          action={
            <Button type="button" size="sm" variant="primary" onClick={() => setComposeOpen(true)}>
              <Plus className="h-4 w-4" />
              {requests.length === 0 ? 'Criar primeiro pedido' : 'Criar pedido formal'}
            </Button>
          }
        />
      ) : (
        <div className="cb-docs-req-list-inner">
          {filteredRequests.map((r) => (
            <RequestRow
              key={r.id}
              request={r}
              clientName={selectedClientId ? undefined : r.clientName}
              selected={selectedRequestId === r.id}
              onSelect={() => updateParams({ request: r.id })}
            />
          ))}
        </div>
      )}
    </div>
  )

  const detailPanel = selectedRequest ? (
    <DocumentRequestDetailPanel
      request={selectedRequest}
      clientName={
        selectedRequest.clientName ||
        clientById.get(selectedRequest.clientId)?.fullName ||
        clientById.get(selectedRequest.clientId)?.name ||
        'Cliente'
      }
      onClose={() => updateParams({ request: null })}
      onNewFollowUp={() => {
        setComposeOpen(true)
        updateParams({ compose: '1', request: null })
      }}
      onUpdated={() => {
        void refresh()
      }}
    />
  ) : (
    <div className="cb-docs-req-empty-detail">
      <Inbox className="h-10 w-10 opacity-25" />
      <p className="text-sm font-medium text-foreground">Selecione um pedido</p>
      <p className="max-w-xs text-xs text-muted-foreground">
        Abra o detalhe para ver instruções, histórico e validar documentos enviados.
      </p>
    </div>
  )

  return (
    <>
      <FirmSplitView
        hasSelection={Boolean(selectedRequestId)}
        onClearSelection={() => updateParams({ request: null })}
        sheetTitle={selectedRequest?.title || 'Pedido'}
        toolbar={toolbar}
        list={listBody}
        detail={detailPanel}
      />

      <NewRequestDialog
        open={composeOpen}
        onOpenChange={(open) => {
          setComposeOpen(open)
          if (!open) updateParams({ compose: null })
        }}
        clients={clients}
        defaultClientId={selectedClientId}
        sending={sending}
        onSubmit={submitNewRequest}
      />
    </>
  )
}
