import { cn } from '@/shared/lib/utils'

import { chatAvatarPalette, chatClientInitials, formatChatThreadTime } from './chatUi'

export type FirmChatConversationRowProps = {
  clientId: string
  name: string
  preview: string
  lastAt?: string | null
  unreadCount: number
  selected: boolean
  pinned?: boolean
  onClick: () => void
}

export function FirmChatConversationRow({
  clientId,
  name,
  preview,
  lastAt,
  unreadCount,
  selected,
  onClick,
}: FirmChatConversationRowProps) {
  const palette = chatAvatarPalette(clientId)

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn('cb-chat-conv-row', selected && 'cb-chat-conv-row-active')}
      data-testid={`chat-thread-${clientId}`}
    >
      <span className={cn('cb-chat-conv-avatar', palette.bg, palette.text)} aria-hidden>
        {chatClientInitials(name)}
      </span>
      <span className="cb-chat-conv-body">
        <span className="cb-chat-conv-top">
          <span className="cb-chat-conv-name">{name}</span>
          {lastAt ? <span className="cb-chat-conv-time">{formatChatThreadTime(lastAt)}</span> : null}
        </span>
        <span className="cb-chat-conv-bottom">
          <span className="cb-chat-conv-preview">{preview}</span>
          {unreadCount > 0 ? (
            <span className="cb-chat-conv-badge" aria-label={`${unreadCount} não lidas`}>
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          ) : null}
        </span>
      </span>
    </button>
  )
}
