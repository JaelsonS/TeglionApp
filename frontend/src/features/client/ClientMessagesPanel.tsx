import { useCallback, useEffect, useRef, useState, type ChangeEvent } from 'react'
import { useQuery } from '@tanstack/react-query'
import { MessageSquare, Paperclip, Send } from 'lucide-react'
import { toast } from 'sonner'

import { ChatBubble } from '@/shared/components/portal-cliente/ChatBubble'
import { EmptyState } from '@/shared/components/portal-cliente/EmptyState'
import { Button } from '@/shared/components/ui/button'
import { Skeleton } from '@/shared/design-system'
import { clientPortalContabilApi } from '@/infrastructure/api'
import { emitAppDataChanged } from '@/shared/utils/appEvents'
import { getErrorMessage } from '@/shared/utils/errors'
import { formatDateTime } from '@/shared/utils/date'
import { cn } from '@/shared/lib/utils'
import type { ContabilMessage } from '@/shared/types/contabil'

type Copy = {
  loadError: string
  loading: string
  messages: { empty: string; placeholder: string; send: string }
}

export function ClientMessagesPanel({ t }: { t: Copy }) {
  const messagesQuery = useQuery({
    queryKey: ['client-messages'],
    queryFn: () =>
      clientPortalContabilApi.listMessages() as Promise<{ items?: ContabilMessage[] }>,
    staleTime: 30_000,
    placeholderData: (prev) => prev,
  })

  const messages = messagesQuery.data?.items ?? []
  const loading = messagesQuery.isLoading
  const [draft, setDraft] = useState('')
  const [sending, setSending] = useState(false)
  const [attachFile, setAttachFile] = useState<File | null>(null)
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null)
  const [editingBody, setEditingBody] = useState('')
  const [savingEdit, setSavingEdit] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const shouldScrollToBottomRef = useRef(false)

  const reload = useCallback(async () => {
    await messagesQuery.refetch()
    emitAppDataChanged({ scope: 'messages' })
  }, [messagesQuery])

  useEffect(() => {
    if (messagesQuery.isError) {
      toast.error(t.loadError, { description: getErrorMessage(messagesQuery.error) })
    }
  }, [messagesQuery.isError, messagesQuery.error, t.loadError])

  useEffect(() => {
    if (!shouldScrollToBottomRef.current) return
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    shouldScrollToBottomRef.current = false
  }, [messages.length])

  useEffect(() => {
    if (loading || messagesQuery.isError) return
    if (!messagesQuery.isFetched) return
    emitAppDataChanged({ scope: 'messages' })
  }, [loading, messagesQuery.isFetched, messagesQuery.isError])

  const send = async () => {
    const body = draft.trim()
    if (!body && !attachFile) return
    setSending(true)
    try {
      shouldScrollToBottomRef.current = true
      await clientPortalContabilApi.sendMessage({ body: body || undefined }, attachFile)
      setDraft('')
      setAttachFile(null)
      await reload()
      emitAppDataChanged({ scope: 'messages' })
    } catch (err) {
      toast.error(t.loadError, { description: getErrorMessage(err) })
    } finally {
      setSending(false)
    }
  }

  const unreadFromFirm = messages.filter((m) => m.senderRole === 'FIRM' && !m.readAt).length

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
    if (!editingMessageId) return
    const body = editingBody.trim()
    if (!body) return
    setSavingEdit(true)
    try {
      await clientPortalContabilApi.updateMessage(editingMessageId, { body })
      await reload()
      cancelEdit()
    } catch (err) {
      toast.error('Não foi possível editar a mensagem', { description: getErrorMessage(err) })
    } finally {
      setSavingEdit(false)
    }
  }

  return (
    <div className="pc-chat-layout">
      <aside className="pc-chat-list hidden sm:flex">
        <div className="border-b border-border p-4">
          <p className="text-sm font-semibold text-foreground">Conversas</p>
          <p className="text-xs text-muted-foreground">Escritório de contabilidade</p>
        </div>
        <div className="p-2">
          <button
            type="button"
            className="flex w-full items-center gap-3 rounded-[10px] bg-muted px-3 py-2.5 text-left"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
              MF
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-medium">Contabilista</span>
              <span className="block truncate text-xs text-muted-foreground">Online</span>
            </span>
            {unreadFromFirm > 0 ? (
              <span className="pc-nav-badge">{unreadFromFirm}</span>
            ) : null}
          </button>
        </div>
      </aside>

      <div className="pc-chat-thread">
        <div className="border-b border-border px-4 py-3">
          <p className="text-sm font-semibold text-foreground">Contabilista</p>
          <p className="text-xs text-muted-foreground">Resposta habitual em dias úteis</p>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-14 w-3/4 rounded-[12px]" />
              ))}
            </div>
          ) : messages.length === 0 ? (
            <EmptyState
              icon={MessageSquare}
              title="Inicia conversa com o teu contabilista"
              description="Perguntas rápidas, esclarecimentos ou envio de contexto — tudo num só sítio."
            />
          ) : (
            <ul className="space-y-4">
              {messages.map((m) => {
                const mine = m.senderRole === 'CLIENT'
                const messageId = m.id || m._id || ''
                const isEditing = editingMessageId === messageId
                return (
                  <li key={messageId || m.createdAt}>
                    {isEditing ? (
                      <div className="space-y-2 rounded-xl border border-border/70 bg-muted/20 p-3">
                        <textarea
                          value={editingBody}
                          onChange={(e) => setEditingBody(e.target.value)}
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
                      <div className="space-y-1">
                        <ChatBubble
                          mine={mine}
                          timestamp={m.createdAt ? formatDateTime(m.createdAt) : undefined}
                          avatar={
                            !mine ? (
                              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-muted text-caption font-semibold text-primary">
                                MF
                              </span>
                            ) : undefined
                          }
                        >
                          <span className="whitespace-pre-wrap">{m.body || m.content}</span>
                        </ChatBubble>
                        {mine ? (
                          <div className={cn('flex items-center gap-2 px-1 text-[11px] text-muted-foreground', mine && 'justify-end')}>
                            {m.editedAt ? <span>Editada</span> : null}
                            <button type="button" className="underline-offset-2 hover:underline" onClick={() => startEdit(m)}>
                              Editar
                            </button>
                          </div>
                        ) : null}
                      </div>
                    )}
                  </li>
                )
              })}
            </ul>
          )}
          <div ref={bottomRef} />
        </div>

        <form
          className="flex shrink-0 gap-2 border-t border-border p-3"
          onSubmit={(e) => {
            e.preventDefault()
            void send()
          }}
        >
          <label className="flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-[10px] border border-border hover:bg-muted focus-within:ring-2 focus-within:ring-ring">
            <Paperclip className="h-4 w-4 text-muted-foreground" aria-hidden />
            <span className="sr-only">Anexar ficheiro</span>
            <input
              type="file"
              className="sr-only"
              onChange={(e: ChangeEvent<HTMLInputElement>) => setAttachFile(e.target.files?.[0] || null)}
            />
          </label>
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder={t.messages.placeholder}
            rows={2}
            className={cn(
              'min-h-[52px] max-h-32 flex-1 resize-none rounded-[10px] border border-input bg-background px-3 py-2 text-sm leading-6',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
            )}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                e.preventDefault()
                void send()
              }
            }}
          />
          <Button type="submit" disabled={sending} className="rounded-[10px] px-4" aria-label={t.messages.send}>
            <Send className="h-4 w-4" />
          </Button>
        </form>
        {attachFile ? (
          <p className="border-t border-border px-4 py-2 text-xs text-muted-foreground">
            Anexo: {attachFile.name}
          </p>
        ) : null}
        <p className="border-t border-border px-4 py-2 text-[11px] text-muted-foreground">
          Enter cria nova linha. Use Ctrl/Cmd + Enter para enviar.
        </p>
      </div>
    </div>
  )
}
