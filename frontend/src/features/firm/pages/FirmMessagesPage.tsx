import { FirmMessagesModule } from '@/features/firm/chat/FirmMessagesModule'
import { FirmWorkspacePage } from '@/features/firm/FirmPageLayout'
import { AskMayaButton } from '@/features/maya'
import { PageHeader } from '@/shared/design-system'

export function FirmMessagesPage() {
  return (
    <FirmWorkspacePage className="cb-chat-page xl:min-h-0 xl:flex-1">
      <div className="shrink-0 px-4 pt-4 sm:px-5" data-testid="firm-messages-header">
        <PageHeader
          title="Mensagens"
          subtitle="Escreva ao cliente e receba anexos aqui — o histórico fica no Teglion, não no WhatsApp."
          testId="firm-messages-title"
          secondary={<AskMayaButton intentId="messages" />}
        />
      </div>
      <div className="cb-chat-page-panel cb-firm-operational-panel flex min-h-0 flex-1 flex-col overflow-hidden">
        <FirmMessagesModule />
      </div>
    </FirmWorkspacePage>
  )
}
