import { FileText } from 'lucide-react'

import { cn } from '@/shared/lib/utils'
import { formatChatMessageTime } from './chatUi'
import type { ContabilMessage } from '@/shared/types/contabil'

function isPdf(name?: string | null, mime?: string | null) {
  if (mime?.includes('pdf')) return true
  return /\.pdf$/i.test(name || '')
}

export function FirmChatMessageBubble({
  message,
  viewerRole,
  canEdit = false,
  onEdit,
}: {
  message: ContabilMessage
  viewerRole: 'FIRM' | 'CLIENT'
  canEdit?: boolean
  onEdit?: () => void
}) {
  const isMine =
    (viewerRole === 'FIRM' && message.senderRole === 'FIRM') ||
    (viewerRole === 'CLIENT' && message.senderRole === 'CLIENT')

  const hasAttachment = Boolean(message.attachmentName || message.attachmentStorageKey)
  const body = String(message.body || '').trim()

  return (
    <div className={cn('cb-chat-msg-row', isMine ? 'cb-chat-msg-row-out' : 'cb-chat-msg-row-in')}>
      <div className={cn('cb-chat-bubble', isMine ? 'cb-chat-bubble-out' : 'cb-chat-bubble-in')}>
        {body ? <p className="cb-chat-bubble-text">{message.body}</p> : null}
        {hasAttachment ? (
          <div className="cb-chat-attach-card">
            <span
              className={cn(
                'cb-chat-attach-icon',
                isPdf(message.attachmentName, message.attachmentMime) && 'cb-chat-attach-icon-pdf',
              )}
              aria-hidden
            >
              <FileText className="h-5 w-5" />
            </span>
            <span className="cb-chat-attach-meta">
              <span className="cb-chat-attach-name">{message.attachmentName || 'Anexo'}</span>
              {message.attachmentMime ? (
                <span className="cb-chat-attach-size">{message.attachmentMime.split('/').pop()}</span>
              ) : null}
            </span>
            <span className="cb-chat-attach-link" title="Anexo">
              anexo
            </span>
          </div>
        ) : null}
      </div>
      <p className={cn('cb-chat-msg-meta', isMine && 'cb-chat-msg-meta-out')}>
        <span>{formatChatMessageTime(message.createdAt)}</span>
        {message.editedAt ? <span>editada</span> : null}
        {isMine ? (
          <span className="cb-chat-read-receipt" aria-label={message.readAt ? 'Lida' : 'Enviada'}>
            {message.readAt ? '✓✓' : '✓'}
          </span>
        ) : null}
        {canEdit && onEdit ? (
          <button type="button" className="text-xs underline-offset-2 hover:underline" onClick={onEdit}>
            editar
          </button>
        ) : null}
      </p>
    </div>
  )
}
