import { AlertsWorkspace } from '@/features/firm/alerts/AlertsWorkspace'
import { FirmWorkspacePage } from '@/features/firm/FirmPageLayout'

export function FirmAlertsPage() {
  return (
    <FirmWorkspacePage className="cb-alerts-layout-page xl:min-h-0 xl:flex-1">
      <div className="cb-firm-operational-panel flex min-h-0 flex-1 flex-col overflow-hidden">
        <AlertsWorkspace />
      </div>
    </FirmWorkspacePage>
  )
}
