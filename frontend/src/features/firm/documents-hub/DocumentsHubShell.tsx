import type { ReactNode } from 'react'
import { useLocation } from 'react-router-dom'

import {
  FIRM_DOCUMENTS_FILES,
  FIRM_DOCUMENTS_HISTORY,
  FIRM_DOCUMENTS_REQUESTS,
} from '@/features/firm/documents-hub/firmDocumentsPaths'
import { FirmModuleShell } from '@/shared/design-system/FirmModuleShell'

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
  const subtitle = SUBTITLES[pathname] || 'Gestão documental do escritório'

  return (
    <FirmModuleShell
      className="cb-docs-page"
      title="Documentos"
      subtitle={subtitle}
      tabs={[...SECTIONS]}
    >
      {children}
    </FirmModuleShell>
  )
}
