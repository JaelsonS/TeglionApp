import type { ReactNode } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

import {
  FIRM_DOCUMENTS_FILES,
  FIRM_DOCUMENTS_HISTORY,
  FIRM_DOCUMENTS_REQUESTS,
} from '@/features/firm/documents-hub/firmDocumentsPaths'
import { FirmModuleShell } from '@/shared/design-system/FirmModuleShell'
import { ModuleHelpDialog } from '@/shared/design-system/ModuleHelpDialog'

const SECTIONS = [
  { to: FIRM_DOCUMENTS_REQUESTS, label: 'Pedidos', testId: 'documents-section-pedidos' },
  { to: FIRM_DOCUMENTS_FILES, label: 'Ficheiros', testId: 'documents-section-ficheiros' },
  { to: FIRM_DOCUMENTS_HISTORY, label: 'Histórico', testId: 'documents-section-historico' },
] as const

const SUBTITLES: Record<string, string> = {
  [FIRM_DOCUMENTS_REQUESTS]: 'Pedidos formais e pedidos de documentos',
  [FIRM_DOCUMENTS_FILES]: 'Ficheiros recebidos por cliente e período',
  [FIRM_DOCUMENTS_HISTORY]: 'Histórico consolidado de submissões',
}

export function DocumentsHubShell({ children }: { children: ReactNode }) {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const subtitle = SUBTITLES[pathname] || 'Gestão documental do escritório'

  return (
    <FirmModuleShell
      className="cb-docs-page"
      title="Documentos"
      subtitle={subtitle}
      tabs={[...SECTIONS]}
      headerRight={
        <ModuleHelpDialog
          title="Documentos"
          intro="Centralize aqui os documentos dos seus clientes: envie ficheiros, solicite documentos em falta e acompanhe o estado de cada processo, tudo num só lugar."
          steps={[
            { title: 'Escolha o cliente', description: 'Abra o cliente na secção «Pedidos» ou «Ficheiros» para ver o que já tem e o que falta.' },
            { title: 'Envie ou solicite um documento', description: 'Envie um ficheiro directamente ao cliente ou peça-lhe um documento específico — ele recebe o pedido no portal dele.' },
            { title: 'Acompanhe o estado', description: 'Veja quais pedidos estão pendentes, respondidos ou concluídos, sem sair desta tela.' },
            { title: 'Consulte o histórico', description: 'Toda a submissão fica registada em «Histórico», por cliente e por período.' },
          ]}
          cta={{ label: 'Começar a enviar documentos', onClick: () => navigate(FIRM_DOCUMENTS_REQUESTS) }}
        />
      }
    >
      {children}
    </FirmModuleShell>
  )
}
