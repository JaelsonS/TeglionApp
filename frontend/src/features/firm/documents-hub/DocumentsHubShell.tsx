import type { ReactNode } from 'react'
import { useLocation } from 'react-router-dom'

import {
  FIRM_DOCUMENTS_FILES,
  FIRM_DOCUMENTS_HISTORY,
  FIRM_DOCUMENTS_REQUESTS,
} from '@/features/firm/documents-hub/firmDocumentsPaths'
import { AskMayaButton } from '@/features/maya'
import { FirmModuleShell } from '@/shared/design-system/FirmModuleShell'
import { cn } from '@/shared/lib/utils'

const SECTIONS = [
  { to: FIRM_DOCUMENTS_REQUESTS, label: 'Pedidos', testId: 'documents-section-pedidos' },
  { to: FIRM_DOCUMENTS_FILES, label: 'Ficheiros', testId: 'documents-section-ficheiros' },
  { to: FIRM_DOCUMENTS_HISTORY, label: 'Histórico', testId: 'documents-section-historico' },
] as const

const SECTION_PURPOSE: Record<
  string,
  { headline: string; detail: string }
> = {
  [FIRM_DOCUMENTS_REQUESTS]: {
    headline: 'Pedidos formais ao cliente',
    detail:
      'Crie pedidos com prazo e instruções — o cliente responde no portal; os ficheiros seguem para validação em Ficheiros.',
  },
  [FIRM_DOCUMENTS_FILES]: {
    headline: 'Validar e organizar ficheiros',
    detail:
      'Pré-visualize, aprove ou rejeite o que os clientes enviaram. Filtre por cliente, período e estado de validação.',
  },
  [FIRM_DOCUMENTS_HISTORY]: {
    headline: 'Histórico com exportação',
    detail:
      'Linhas consolidadas por submissão — o que foi pedido, enviado e validado. Exporte CSV ou apague com selecção múltipla.',
  },
}

function resolveDocumentsSection(pathname: string): string {
  if (pathname.startsWith(FIRM_DOCUMENTS_HISTORY)) return FIRM_DOCUMENTS_HISTORY
  if (pathname.startsWith(FIRM_DOCUMENTS_FILES)) return FIRM_DOCUMENTS_FILES
  if (pathname.startsWith(FIRM_DOCUMENTS_REQUESTS)) return FIRM_DOCUMENTS_REQUESTS
  return pathname
}

export function DocumentsHubShell({ children }: { children: ReactNode }) {
  const { pathname } = useLocation()
  const sectionKey = resolveDocumentsSection(pathname)
  const purpose = SECTION_PURPOSE[sectionKey]

  return (
    <FirmModuleShell
      className="cb-docs-page"
      title="Documentos"
      subtitle="Pedidos, validação e histórico documental — tudo com rasto no portal do cliente."
      tabs={[...SECTIONS]}
      headerRight={<AskMayaButton intentId="documents" />}
      bodyClassName="gap-0"
    >
      {purpose ? (
        <div className="cb-docs-tab-purpose shrink-0" data-testid="documents-tab-purpose">
          <p className="cb-docs-tab-purpose-title">{purpose.headline}</p>
          <p className="cb-docs-tab-purpose-detail">{purpose.detail}</p>
        </div>
      ) : null}
      <div className={cn('flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden')}>{children}</div>
    </FirmModuleShell>
  )
}
