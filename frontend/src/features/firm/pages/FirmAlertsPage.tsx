import { AlertsWorkspace } from '@/features/firm/alerts/AlertsWorkspace'
import { FirmWorkspacePage } from '@/features/firm/FirmPageLayout'

/** Central de alertas — page-scroll (lista + detalhe em fluxo de página). */
export function FirmAlertsPage() {
  return (
    <FirmWorkspacePage className="cb-alerts-page cb-alerts-layout-page">
      <div className="cb-firm-operational-panel cb-alerts-layout-panel flex w-full min-w-0 flex-col">
        <AlertsWorkspace />
      </div>
    </FirmWorkspacePage>
  )
}
