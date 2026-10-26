import type { ReactNode } from 'react'

import {
  ClientsKpiStrip,
  type ClientsKpi,
  type ClientsKpiId,
} from '@/features/firm/clients/ClientsKpiStrip'
import { FirmModuleShell } from '@/shared/design-system/FirmModuleShell'

const PAGE_SUBTITLE =
  'Carteira do gabinete — filtrar, convidar ao portal e abrir o hub.'

export function ClientsWorkspaceShell({
  headerRight,
  kpis,
  activeKpiId,
  onKpiSelect,
  children,
}: {
  headerRight?: ReactNode
  kpis: ClientsKpi[]
  activeKpiId?: ClientsKpiId | null
  onKpiSelect?: (id: ClientsKpiId) => void
  children: ReactNode
}) {
  return (
    <FirmModuleShell
      className="cb-clients-shell cb-clients-page-scroll"
      title="Clientes"
      subtitle={PAGE_SUBTITLE}
      headerRight={headerRight}
      bodyClassName="gap-0 cb-clients-body"
    >
      <ClientsKpiStrip items={kpis} activeId={activeKpiId} onSelect={onKpiSelect} />
      <div className="cb-clients-section-host" data-testid="clients-section-lead">
        {children}
      </div>
    </FirmModuleShell>
  )
}
