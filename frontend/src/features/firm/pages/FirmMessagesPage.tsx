import { FirmMessagesModule } from '@/features/firm/chat/FirmMessagesModule'
import { FirmWorkspacePage } from '@/features/firm/FirmPageLayout'
import { AskMayaButton } from '@/features/maya'
import { PageHeader } from '@/shared/design-system'

export function FirmMessagesPage() {
  return (
    <FirmWorkspacePage className="cb-chat-page xl:min-h-0 xl:flex-1">
      <div className="cb-chat-page-hd shrink-0 mx-4 mt-4 sm:mx-5" data-testid="firm-messages-header">
        <PageHeader
          title="Mensagens"
          subtitle="Conversas com a carteira no produto — lista à esquerda, thread à direita; anexos e Google Drive no mesmo fluxo."
          testId="firm-messages-title"
          secondary={<AskMayaButton intentId="messages" />}
        />
      </div>
      <div className="cb-chat-page-panel cb-firm-operational-panel mx-4 mb-4 flex min-h-0 flex-1 flex-col overflow-hidden sm:mx-5">
        <FirmMessagesModule />
      </div>
    </FirmWorkspacePage>
  )
}
