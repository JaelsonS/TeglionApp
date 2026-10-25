import { useEffect, useMemo, useState } from 'react'
import { MessageSquare, Pin, ShieldAlert } from 'lucide-react'

import { FirmMessagesModule } from '@/features/firm/chat/FirmMessagesModule'
import { FirmWorkspacePage } from '@/features/firm/FirmPageLayout'
import { AskMayaButton } from '@/features/maya'
import { FirmModuleShell } from '@/shared/design-system/FirmModuleShell'
import { useFirmInbox } from '@/shared/hooks/queries/useFirmInbox'
import { useAuth } from '@/shared/hooks/useAuth'
import { CHAT_PINS_CHANGED_EVENT, getPinnedClientIds } from '@/features/firm/chat/chatUi'
import { cn } from '@/shared/lib/utils'

const PAGE_SUBTITLE =
  'Fale com a carteira no mesmo sítio: lista à esquerda, conversa à direita. Anexe ficheiros ou importe do Google Drive.'

export function FirmMessagesPage() {
  const inboxQuery = useFirmInbox()
  const { user } = useAuth()
  const tenantSlug = user?.tenant?.slug ?? ''
  const threads = inboxQuery.data?.threads ?? []
  const clients = inboxQuery.data?.clients ?? []
  const [pinnedIds, setPinnedIds] = useState<string[]>(() => getPinnedClientIds(tenantSlug))

  useEffect(() => {
    setPinnedIds(getPinnedClientIds(tenantSlug))
    const onPinsChanged = () => setPinnedIds(getPinnedClientIds(tenantSlug))
    window.addEventListener(CHAT_PINS_CHANGED_EVENT, onPinsChanged)
    window.addEventListener('storage', onPinsChanged)
    return () => {
      window.removeEventListener(CHAT_PINS_CHANGED_EVENT, onPinsChanged)
      window.removeEventListener('storage', onPinsChanged)
    }
  }, [tenantSlug])

  const kpis = useMemo(() => {
    const unread = threads.reduce((acc, t) => acc + (t.unreadCount ?? (t.unread ? 1 : 0)), 0)
    /** Mesmos IDs que a lista «Fixados» (ThreadOption.id = client._id | thread.clientId). */
    const knownIds = new Set<string>()
    for (const t of threads) {
      if (t.clientId) knownIds.add(t.clientId)
    }
    for (const c of clients) {
      if (c._id) knownIds.add(c._id)
      if (c.id) knownIds.add(c.id)
    }
    const pinned = pinnedIds.filter((id) => knownIds.has(id)).length
    return [
      {
        id: 'unread',
        value: unread,
        label: unread === 1 ? 'não lida' : 'não lidas',
        tone: unread > 0 ? 'amber' : 'muted',
        icon: ShieldAlert,
      },
      {
        id: 'pinned',
        value: pinned,
        label: pinned === 1 ? 'fixada' : 'fixadas',
        tone: 'brand',
        icon: Pin,
      },
      {
        id: 'all',
        value: threads.length,
        label: threads.length === 1 ? 'conversa' : 'conversas',
        tone: 'muted',
        icon: MessageSquare,
      },
    ] as const
  }, [threads, clients, pinnedIds])

  return (
    <FirmWorkspacePage className="cb-chat-page cb-chat-layout-page xl:min-h-0 xl:flex-1">
      <div className="cb-firm-operational-panel cb-chat-layout-panel flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        <FirmModuleShell
          className="cb-chat-shell"
          title="Mensagens"
          subtitle={PAGE_SUBTITLE}
          headerRight={<AskMayaButton intentId="messages" />}
          bodyClassName="gap-0"
        >
          <div className="cb-chat-kpi-strip" data-testid="messages-kpi-strip">
            {kpis.map((item) => {
              const Icon = item.icon
              return (
                <div
                  key={item.id}
                  className={cn(
                    'cb-chat-kpi',
                    item.tone === 'amber' && 'cb-chat-kpi--amber',
                    item.tone === 'brand' && 'cb-chat-kpi--brand',
                  )}
                >
                  <span className="cb-chat-kpi-icon" aria-hidden>
                    <Icon className="h-4 w-4" />
                  </span>
                  <div className="min-w-0">
                    <p className="cb-chat-kpi-value">{item.value}</p>
                    <p className="cb-chat-kpi-label">{item.label}</p>
                  </div>
                </div>
              )
            })}
          </div>
          <p className="cb-chat-section-lead">
            <span className="cb-chat-section-lead-title">Operação diária com clientes</span>
            Abra uma conversa, responda e anexe o que o cliente precisa — o histórico fica ligado ao
            portal.
          </p>
          <div className="cb-chat-module-host">
            <FirmMessagesModule />
          </div>
        </FirmModuleShell>
      </div>
    </FirmWorkspacePage>
  )
}
