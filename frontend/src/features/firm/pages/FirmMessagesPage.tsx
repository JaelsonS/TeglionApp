import { FirmMessagesModule } from '@/features/firm/chat/FirmMessagesModule'
import { FirmWorkspacePage } from '@/features/firm/FirmPageLayout'
import { ModuleHelpDialog, PageHeader } from '@/shared/design-system'

export function FirmMessagesPage() {
  return (
    <FirmWorkspacePage className="cb-chat-page xl:min-h-0 xl:flex-1">
      <div className="shrink-0 px-4 pt-4 sm:px-5" data-testid="firm-messages-header">
        <PageHeader
          title="Mensagens"
          subtitle="Conversas e anexos com a carteira de clientes — histórico num só lugar."
          testId="firm-messages-title"
          secondary={
            <ModuleHelpDialog
              title="Mensagens"
              intro="Aqui pode conversar directamente com os seus clientes — mensagens, anexos e histórico, tudo num só lugar."
              triggerLabel="Guia"
              steps={[
                {
                  title: 'Escolha uma conversa',
                  description: 'Seleccione um cliente na lista à esquerda para ver o histórico completo.',
                },
                {
                  title: 'Escreva e envie',
                  description: 'Escreva a mensagem e anexe ficheiros quando for preciso — o cliente recebe no portal.',
                },
                {
                  title: 'Fixe as conversas importantes',
                  description: 'Use o menu ⋯ numa conversa para a fixar e mantê-la no topo da lista.',
                },
              ]}
            />
          }
        />
      </div>
      <div className="cb-chat-page-panel cb-firm-operational-panel flex min-h-0 flex-1 flex-col overflow-hidden">
        <FirmMessagesModule />
      </div>
    </FirmWorkspacePage>
  )
}
