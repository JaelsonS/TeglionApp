import type { ReactNode } from 'react'
import { useLocation } from 'react-router-dom'

import {
  FIRM_DOCUMENTS_FILES,
  FIRM_DOCUMENTS_HISTORY,
  FIRM_DOCUMENTS_REQUESTS,
} from '@/features/firm/documents-hub/firmDocumentsPaths'
import { AskMayaButton } from '@/features/maya'
import { FirmModuleShell } from '@/shared/design-system/FirmModuleShell'

const SECTIONS = [
  { to: FIRM_DOCUMENTS_REQUESTS, label: 'Pedidos', testId: 'documents-section-pedidos' },
  { to: FIRM_DOCUMENTS_FILES, label: 'Ficheiros', testId: 'documents-section-ficheiros' },
  { to: FIRM_DOCUMENTS_HISTORY, label: 'Histórico', testId: 'documents-section-historico' },
] as const

const SUBTITLES: Record<string, string> = {
  [FIRM_DOCUMENTS_REQUESTS]: 'Peça documentos ao cliente com prazo — ele entrega no portal.',
  [FIRM_DOCUMENTS_FILES]: 'Valide e organize os ficheiros que os clientes enviaram.',
  [FIRM_DOCUMENTS_HISTORY]: 'Histórico de submissões — o que foi pedido, enviado e validado.',
}

export function DocumentsHubShell({ children }: { children: ReactNode }) {
  const { pathname } = useLocation()
  const subtitle = SUBTITLES[pathname] || 'Gestão documental do gabinete'

  return (
    <FirmModuleShell
      className="cb-docs-page"
      title="Documentos"
      subtitle={subtitle}
      tabs={[...SECTIONS]}
      headerRight={<AskMayaButton intentId="documents" />}
    >
      {children}
    </FirmModuleShell>
  )
}
