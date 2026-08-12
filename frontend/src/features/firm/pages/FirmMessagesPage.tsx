import { FirmMessagesModule } from '@/features/firm/chat/FirmMessagesModule'
import { FirmWorkspacePage } from '@/features/firm/FirmPageLayout'
import { ModuleHelpDialog } from '@/shared/design-system/ModuleHelpDialog'

export function FirmMessagesPage() {
  return (
    <FirmWorkspacePage className="cb-chat-page xl:min-h-0 xl:flex-1">
      <header className="cb-chat-page-hd cb-operational-page-header" data-testid="firm-messages-header">
        <div>
          <h1 className="cb-operational-page-title font-display sm:text-2xl">Mensagens</h1>
          <p className="cb-operational-page-sub text-sm">Conversas e anexos com a carteira de clientes</p>
        </div>
        <ModuleHelpDialog
          title="Mensagens"
          intro="Aqui pode conversar directamente com os seus clientes, de forma clara e humana — mensagens, anexos e histórico, tudo num só lugar."
          steps={[
            { title: 'Escolha uma conversa', description: 'Seleccione um cliente na lista à esquerda para ver o histórico completo de mensagens.' },
            { title: 'Escreva e envie', description: 'Escreva a mensagem e anexe ficheiros quando for preciso — o cliente recebe tudo no portal dele.' },
            { title: 'Fixe as conversas importantes', description: 'Use o menu ⋯ numa conversa para a fixar e mantê-la sempre visível no topo da lista.' },
          ]}
        />
      </header>
      <div className="cb-chat-page-panel cb-firm-operational-panel flex min-h-0 flex-1 flex-col overflow-hidden">
        <FirmMessagesModule />
      </div>
    </FirmWorkspacePage>
  )
}
