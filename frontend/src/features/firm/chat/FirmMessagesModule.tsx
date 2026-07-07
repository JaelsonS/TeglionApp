import { useCallback, useEffect, useMemo, useRef, useState, type ChangeEvent } from 'react'
import type { FormChangeEvent } from '@/shared/types/react-events'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { MessageSquare, MoreVertical, Paperclip, Pin, Search, Send } from 'lucide-react'
import { useSearchParams } from 'react-router-dom'
import { toast } from 'sonner'

import { FirmChatConversationRow } from '@/features/firm/chat/FirmChatConversationRow'
import { FirmChatMessageBubble } from '@/features/firm/chat/FirmChatMessageBubble'
import {
  type ChatListFilter,
  getPinnedClientIds,
  isClientOnline,
  previewLastMessage,
  togglePinnedClientId,
  chatAvatarPalette,
  chatClientInitials,
} from '@/features/firm/chat/chatUi'
import { formatNifDisplay } from '@/features/firm/clients/clientCompanyAvatar'
import { FirmSplitView } from '@/shared/design-system'
import { useAuth } from '@/shared/hooks/useAuth'
import { useFirmInbox } from '@/shared/hooks/queries/useFirmInbox'
import { Input } from '@/shared/components/ui/input'
import { Button } from '@/shared/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/shared/components/ui/dropdown-menu'
import { contabilMessagesApi } from '@/infrastructure/api'
import { emitAppDataChanged, onAppDataChanged } from '@/shared/utils/appEvents'
import { getErrorMessage } from '@/shared/utils/errors'
import { logger } from '@/shared/utils/logger'
import { cn } from '@/shared/lib/utils'
import type { ContabilMessage, MessageThread } from '@/shared/types/contabil'
import type { Client } from '@/shared/types/clients'

type ThreadOption = {
  id: string
  name: string
  preview: string
  lastAt?: string | null
  unreadCount: number
}

type MessagesPayload = {
  items?: ContabilMessage[]
  client?: Client & { id?: string }
}

const FILTER_LABELS: Record<ChatListFilter, string> = {
  todos: 'Todos',
  unread: 'Não lidas',
  pinned: 'Fixados',
}

export function FirmMessagesModule({ embeddedClientId }: { embeddedClientId?: string } = {}) {
  const [searchParams, setSearchParams] = useSearchParams()
  const qc = useQueryClient()
  const { user } = useAuth()
  const tenantSlug = user?.tenant.slug ?? ''
  const selectedClientId = embeddedClientId || searchParams.get('client')

  const [listQuery, setListQuery] = useState('')
  const [listFilter, setListFilter] = useState<ChatListFilter>('todos')
  const [pinnedIds, setPinnedIds] = useState<string[]>(() => getPinnedClientIds(tenantSlug))

  const inboxQuery = useFirmInbox()
  const threads = inboxQuery.data?.threads ?? []
  const clients = inboxQuery.data?.clients ?? []

  const messagesQuery = useQuery({
    queryKey: ['firm-messages', selectedClientId],
    queryFn: () =>
      contabilMessagesApi.listByClient(selectedClientId!) as Promise<MessagesPayload>,
    enabled: Boolean(selectedClientId),
    staleTime: 20_000,
  })

  const messages = messagesQuery.data?.items ?? []
  const activeClient = messagesQuery.data?.client
  const [sending, setSending] = useState(false)
  const [draft, setDraft] = useState('')
  const [attachFile, setAttachFile] = useState<File | null>(null)
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null)
  const [editingBody, setEditingBody] = useState('')
  const [savingEdit, setSavingEdit] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setPinnedIds(getPinnedClientIds(tenantSlug))
  }, [tenantSlug])

  useEffect(() => {
    if (messagesQuery.isError && selectedClientId) {
      logger.warn('[firm-messages] Falha ao carregar', { message: getErrorMessage(messagesQuery.error) })
      toast.error('Erro ao abrir conversa', { description: getErrorMessage(messagesQuery.error) })
    }
  }, [messagesQuery.isError, messagesQuery.error, selectedClientId])

  useEffect(() => {
    return onAppDataChanged((d) => {
      if (!d.scope || d.scope === 'messages' || d.scope === 'live') {
        void inboxQuery.refetch()
        if (selectedClientId) {
          void qc.invalidateQueries({ queryKey: ['firm-messages', selectedClientId] })
        }
      }
    })
  }, [inboxQuery, qc, selectedClientId])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages.length, selectedClientId])

  const selectClient = (id: string) => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev)
        next.set('client', id)
        return next
      },
      { replace: true },
    )
  }

  const clearClient = () => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev)
      next.delete('client')
      return next
    })
  }

  const send = async () => {
    if (!selectedClientId) return
    const body = draft.trim()
    if (!body && !attachFile) return
    setSending(true)
    try {
      await contabilMessagesApi.send({ clientId: selectedClientId, body: body || undefined }, attachFile)
      setDraft('')
      setAttachFile(null)
      await Promise.all([
        inboxQuery.refetch(),
        qc.invalidateQueries({ queryKey: ['firm-messages', selectedClientId] }),
      ])
      emitAppDataChanged({ scope: 'messages' })
    } catch (err) {
      toast.error('Não foi possível enviar', { description: getErrorMessage(err) })
    } finally {
      setSending(false)
    }
  }

  const startEdit = (message: ContabilMessage) => {
    const id = message.id || message._id
    if (!id) return
    setEditingMessageId(id)
    setEditingBody(String(message.body || message.content || ''))
  }

  const cancelEdit = () => {
    setEditingMessageId(null)
    setEditingBody('')
  }

  const saveEdit = async () => {
    if (!selectedClientId || !editingMessageId) return
    const body = editingBody.trim()
    if (!body) return
    setSavingEdit(true)
    try {
      await contabilMessagesApi.update({ messageId: editingMessageId, clientId: selectedClientId, body })
      await Promise.all([
        inboxQuery.refetch(),
        qc.invalidateQueries({ queryKey: ['firm-messages', selectedClientId] }),
      ])
      cancelEdit()
      emitAppDataChanged({ scope: 'messages' })
    } catch (err) {
      toast.error('Não foi possível editar', { description: getErrorMessage(err) })
    } finally {
      setSavingEdit(false)
    }
  }

  const threadByClient = useMemo(() => {
    const map = new Map<string, MessageThread>()
    for (const t of threads) map.set(t.clientId, t)
    return map
  }, [threads])

  const clientOptions = useMemo((): ThreadOption[] => {
    const map = new Map<string, ThreadOption>()

    for (const c of clients) {
      const th = threadByClient.get(c._id)
      map.set(c._id, {
        id: c._id,
        name: c.fullName || c.name || 'Cliente',
        preview: previewLastMessage(th?.lastBody, null),
        lastAt: th?.lastAt,
        unreadCount: th?.unreadCount ?? (th?.unread ? 1 : 0),
      })
    }

    for (const t of threads) {
      if (!map.has(t.clientId)) {
        map.set(t.clientId, {
          id: t.clientId,
          name: t.clientName || 'Cliente',
          preview: previewLastMessage(t.lastBody, null),
          lastAt: t.lastAt,
          unreadCount: t.unreadCount ?? (t.unread ? 1 : 0),
        })
      }
    }

    return [...map.values()].sort((a, b) => {
      const aPin = pinnedIds.includes(a.id) ? 1 : 0
      const bPin = pinnedIds.includes(b.id) ? 1 : 0
      if (bPin !== aPin) return bPin - aPin
      const aTime = a.lastAt ? new Date(a.lastAt).getTime() : 0
      const bTime = b.lastAt ? new Date(b.lastAt).getTime() : 0
      if (bTime !== aTime) return bTime - aTime
      return a.name.localeCompare(b.name, 'pt-PT')
    })
  }, [clients, threadByClient, threads, pinnedIds])

  const filteredOptions = useMemo(() => {
    const q = listQuery.trim().toLowerCase()
    return clientOptions.filter((c) => {
      if (listFilter === 'unread' && c.unreadCount <= 0) return false
      if (listFilter === 'pinned' && !pinnedIds.includes(c.id)) return false
      if (!q) return true
      return c.name.toLowerCase().includes(q) || c.preview.toLowerCase().includes(q)
    })
  }, [clientOptions, listFilter, listQuery, pinnedIds])

  const activeName = useMemo(() => {
    if (activeClient) {
      return activeClient.fullName || activeClient.name || activeClient.displayName || 'Cliente'
    }
    const fromList = clientOptions.find((c) => c.id === selectedClientId)
    if (fromList) return fromList.name
    const th = threads.find((t) => t.clientId === selectedClientId)
    return th?.clientName || 'Cliente'
  }, [activeClient, clientOptions, selectedClientId, threads])

  const activeNif = formatNifDisplay(activeClient?.taxId)
  const activeOnline = isClientOnline(activeClient?.lastLoginAt)
  const activePalette = selectedClientId ? chatAvatarPalette(selectedClientId) : null

  const togglePinActive = useCallback(() => {
    if (!selectedClientId || !tenantSlug) return
    const next = togglePinnedClientId(tenantSlug, selectedClientId)
    setPinnedIds(next)
    toast.success(next.includes(selectedClientId) ? 'Conversa fixada' : 'Conversa desafixada')
  }, [selectedClientId, tenantSlug])

  const list = (
    <div className="cb-chat-sidebar">
      <div className="cb-chat-sidebar-search">
        <Search className="cb-chat-sidebar-search-icon" aria-hidden />
        <Input
          value={listQuery}
          onChange={(e: FormChangeEvent) => setListQuery(e.target.value)}
          placeholder="Procurar conversas"
          className="cb-chat-sidebar-search-input"
          aria-label="Procurar conversas"
        />
      </div>
      <div className="cb-chat-filters" role="tablist" aria-label="Filtrar conversas">
        {(['todos', 'unread', 'pinned'] as ChatListFilter[]).map((key) => (
          <button
            key={key}
            type="button"
            role="tab"
            aria-selected={listFilter === key}
            className={cn('cb-chat-filter-chip', listFilter === key && 'cb-chat-filter-chip-active')}
            onClick={() => setListFilter(key)}
          >
            {FILTER_LABELS[key]}
          </button>
        ))}
      </div>
      <div className="cb-chat-conv-list">
        {inboxQuery.isLoading ? (
          <p className="cb-chat-conv-empty">A carregar conversas…</p>
        ) : filteredOptions.length === 0 ? (
          <p className="cb-chat-conv-empty">
            {listFilter === 'pinned'
              ? 'Nenhuma conversa fixada. Use o menu ⋯ numa conversa para fixar.'
              : listFilter === 'unread'
                ? 'Sem mensagens por ler.'
                : 'Sem conversas activas.'}
          </p>
        ) : (
          filteredOptions.map((c) => (
            <FirmChatConversationRow
              key={c.id}
              clientId={c.id}
              name={c.name}
              preview={c.preview}
              lastAt={c.lastAt}
              unreadCount={c.unreadCount}
              selected={selectedClientId === c.id}
              pinned={pinnedIds.includes(c.id)}
              onClick={() => selectClient(c.id)}
            />
          ))
        )}
      </div>
    </div>
  )

  const detail = !selectedClientId ? (
    <div className="cb-chat-empty-main">
      <MessageSquare className="cb-chat-empty-icon" aria-hidden />
      <p className="cb-chat-empty-title">Escolha uma conversa</p>
      <p className="cb-chat-empty-sub">Mensagens e anexos com os seus clientes.</p>
    </div>
  ) : (
    <div className="cb-chat-main">
      <header className="cb-chat-main-header">
        <div className="cb-chat-main-header-left">
          {activePalette ? (
            <span className={cn('cb-chat-header-avatar', activePalette.bg, activePalette.text)}>
              {chatClientInitials(activeName)}
            </span>
          ) : null}
          <div className="min-w-0">
            <p className="cb-chat-header-name">{activeName}</p>
            <p className="cb-chat-header-sub">
              NIF {activeNif}
              {activeOnline ? (
                <span className="cb-chat-header-online">
                  <span className="cb-chat-header-online-dot" aria-hidden />
                  em linha agora
                </span>
              ) : null}
            </p>
          </div>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button type="button" variant="ghost" size="icon" className="cb-chat-header-menu" aria-label="Opções">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={togglePinActive}>
              <Pin className="mr-2 h-4 w-4" />
              {pinnedIds.includes(selectedClientId) ? 'Desafixar conversa' : 'Fixar conversa'}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </header>

      <div className="cb-chat-thread">
        {messagesQuery.isLoading ? (
          <p className="cb-chat-thread-loading">A carregar mensagens…</p>
        ) : messages.length === 0 ? (
          <p className="cb-chat-thread-loading">Inicie a conversa com o cliente.</p>
        ) : (
          messages.map((m) => {
            const messageId = m.id || m._id || ''
            const canEdit = m.senderRole === 'FIRM'
            const isEditing = editingMessageId === messageId
            return (
              <div key={messageId || m.createdAt}>
                {isEditing ? (
                  <div className="space-y-2 rounded-xl border border-border/70 bg-muted/20 p-3">
                    <textarea
                      value={editingBody}
                      onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setEditingBody(e.target.value)}
                      rows={3}
                      className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                          e.preventDefault()
                          void saveEdit()
                        }
                      }}
                    />
                    <div className="flex items-center justify-end gap-2">
                      <Button type="button" variant="outline" size="sm" onClick={cancelEdit} disabled={savingEdit}>
                        Cancelar
                      </Button>
                      <Button type="button" size="sm" onClick={() => void saveEdit()} disabled={savingEdit || !editingBody.trim()}>
                        Guardar
                      </Button>
                    </div>
                  </div>
                ) : (
                  <FirmChatMessageBubble
                    message={m}
                    viewerRole="FIRM"
                    canEdit={canEdit}
                    onEdit={canEdit ? () => startEdit(m) : undefined}
                  />
                )}
              </div>
            )
          })
        )}
        <div ref={bottomRef} />
      </div>

      <form
        className="cb-chat-compose"
        onSubmit={(e) => {
          e.preventDefault()
          void send()
        }}
      >
        <div className="cb-chat-compose-field">
          <textarea
            value={draft}
            onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setDraft(e.target.value)}
            placeholder={attachFile ? attachFile.name : 'Escrever mensagem…'}
            rows={2}
            className="cb-chat-compose-input min-h-[44px] resize-none"
            disabled={sending}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                e.preventDefault()
                void send()
              }
            }}
          />
          <div className="cb-chat-compose-actions">
            <button
              type="button"
              className="cb-chat-compose-icon-btn"
              aria-label="Anexar ficheiro"
              onClick={() => fileInputRef.current?.click()}
            >
              <Paperclip className="h-4 w-4" />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              className="sr-only"
              onChange={(e) => setAttachFile(e.target.files?.[0] || null)}
            />
          </div>
        </div>
        <Button
          type="submit"
          size="icon"
          className="cb-chat-send-btn"
          disabled={sending || (!draft.trim() && !attachFile)}
          aria-label="Enviar"
        >
          <Send className="h-4 w-4" />
        </Button>
        <p className="cb-chat-compose-foot">Enter quebra linha. Ctrl/Cmd + Enter envia.</p>
      </form>
    </div>
  )

  return embeddedClientId ? (
    <div className="cb-chat-split cb-chat-split-embedded flex h-full min-h-[24rem] flex-col">
      {detail}
    </div>
  ) : (
    <FirmSplitView
      className="cb-chat-split min-h-0 flex-1"
      hasSelection={Boolean(selectedClientId)}
      onClearSelection={clearClient}
      sheetTitle={activeName}
      list={list}
      detail={detail}
      listClassName="cb-chat-split-list"
      detailClassName="cb-chat-split-detail"
    />
  )
}
