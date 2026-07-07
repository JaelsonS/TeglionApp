import { FirmMessagesModule } from '@/features/firm/chat/FirmMessagesModule'
import { FirmWorkspacePage } from '@/features/firm/FirmPageLayout'

export function FirmMessagesPage() {
  return (
    <FirmWorkspacePage className="cb-chat-page xl:min-h-0 xl:flex-1">
      <header className="cb-chat-page-hd" data-testid="firm-messages-header">
        <h1 className="cb-operational-page-title font-display sm:text-2xl">Mensagens</h1>
        <p className="cb-operational-page-sub text-sm">Conversas e anexos com a carteira de clientes</p>
      </header>
      <div className="cb-chat-page-panel cb-firm-operational-panel flex min-h-0 flex-1 flex-col overflow-hidden">
        <FirmMessagesModule />
      </div>
    </FirmWorkspacePage>
  )
}
