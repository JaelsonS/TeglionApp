import type { ReactNode } from 'react'

import {
  ClientsKpiStrip,
  type ClientsKpi,
  type ClientsKpiId,
} from '@/features/firm/clients/ClientsKpiStrip'
import { FirmModuleShell } from '@/shared/design-system/FirmModuleShell'

const PAGE_SUBTITLE =
  'Carteira do gabinete: filtrar, convidar ao portal e abrir o hub de cada empresa.'

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
      <p className="cb-clients-section-lead" data-testid="clients-section-lead">
        <span className="cb-clients-section-lead-title">Carteira do gabinete</span>
        Clique num KPI para filtrar. Ou use tipo, regime, estado e etiqueta — depois abra o hub do
        cliente.
      </p>
      <div className="cb-clients-section-host">{children}</div>
    </FirmModuleShell>
  )
}
