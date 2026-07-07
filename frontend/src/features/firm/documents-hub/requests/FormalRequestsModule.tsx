import { useCallback, useEffect, useMemo, useState } from 'react'
import type { FormChangeEvent } from '@/shared/types/react-events'
import { useSearchParams } from 'react-router-dom'
import { Inbox, Plus, Search } from 'lucide-react'
import { toast } from 'sonner'

import { NewRequestDialog } from '@/features/firm/documents-hub/requests/NewRequestDialog'
import { RequestRow } from '@/features/firm/documents-hub/requests/RequestRow'
import { DocumentRequestDetailPanel } from '@/features/firm/documents/DocumentRequestDetailPanel'
import { normalizeRequestStatus } from '@/features/firm/documents/documentRequestStatus'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { FirmSplitView } from '@/shared/design-system'
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
      <div className="cb-docs-requests-toolbar-hd">
        <p className="cb-docs-requests-toolbar-title">Pedidos formais</p>
        <Button
          type="button"
          size="sm"
          className="cb-docs-requests-btn h-8 shrink-0 rounded-lg px-3"
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
    <div className="min-h-0 flex-1 overflow-y-auto">
      {loading || loadingRequests ? (
        <div className="divide-y divide-border/40">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-16 animate-pulse bg-muted/20" />
          ))}
        </div>
      ) : filteredRequests.length === 0 ? (
        <div className="cb-empty-state m-3 p-4 text-center">
          <Inbox className="mx-auto mb-2 h-8 w-8 text-muted-foreground/40" />
          <p className="text-sm font-medium">Nenhum pedido neste filtro</p>
          <Button className="mt-2 h-8 rounded-lg" size="sm" onClick={() => setComposeOpen(true)}>
            Criar pedido formal
          </Button>
        </div>
      ) : (
        <div className="divide-y divide-border/50">
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
    />
  ) : (
    <div className="flex flex-1 flex-col items-center justify-center gap-1.5 p-6 text-center text-muted-foreground">
      <Inbox className="h-10 w-10 opacity-25" />
      <p className="text-sm font-medium text-foreground">Selecione um pedido</p>
      <p className="max-w-xs text-xs">
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
