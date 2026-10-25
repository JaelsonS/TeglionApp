import type { ReactNode } from 'react'

import { ClientsKpiStrip, type ClientsKpi } from '@/features/firm/clients/ClientsKpiStrip'
import { FirmModuleShell } from '@/shared/design-system/FirmModuleShell'

const PAGE_SUBTITLE =
  'Carteira do gabinete: filtrar, convidar ao portal e abrir o hub de cada empresa.'

export function ClientsWorkspaceShell({
  headerRight,
  kpis,
  children,
}: {
  headerRight?: ReactNode
  kpis: ClientsKpi[]
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
      <ClientsKpiStrip items={kpis} />
      <p className="cb-clients-section-lead" data-testid="clients-section-lead">
        <span className="cb-clients-section-lead-title">Carteira do gabinete</span>
        Filtre por tipo, regime, estado ou etiqueta. Clique numa linha para abrir o hub do cliente.
      </p>
      <div className="cb-clients-section-host">{children}</div>
    </FirmModuleShell>
  )
}
