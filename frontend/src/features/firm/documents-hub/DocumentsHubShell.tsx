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

const PAGE_SUBTITLE =
  'Peça ficheiros aos clientes, valide o que chega e consulte o histórico — tudo ligado ao portal.'

function resolveDocumentsSection(pathname: string): string {
  if (pathname.startsWith(FIRM_DOCUMENTS_HISTORY)) return FIRM_DOCUMENTS_HISTORY
  if (pathname.startsWith(FIRM_DOCUMENTS_FILES)) return FIRM_DOCUMENTS_FILES
  if (pathname.startsWith(FIRM_DOCUMENTS_REQUESTS)) return FIRM_DOCUMENTS_REQUESTS
  return pathname
}

export function DocumentsHubShell({ children }: { children: ReactNode }) {
  const { pathname } = useLocation()
  const sectionKey = resolveDocumentsSection(pathname)

  return (
    <FirmModuleShell
      className="cb-docs-page cb-docs-page-v2"
      title="Documentos"
      subtitle={PAGE_SUBTITLE}
      tabs={[...SECTIONS]}
      tabsClassName="cb-docs-seg-tabs"
      headerRight={<AskMayaButton intentId="documents" />}
      bodyClassName="gap-0"
    >
      <div className={cn('flex w-full min-w-0 flex-col')} data-documents-section={sectionKey}>
        {children}
      </div>
    </FirmModuleShell>
  )
}
