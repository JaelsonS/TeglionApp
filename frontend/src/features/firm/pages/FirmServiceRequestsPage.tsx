import { ServicesWorkspace } from '@/features/firm/services/ServicesWorkspace'
import { FirmWorkspacePage } from '@/features/firm/FirmPageLayout'

export function FirmServiceRequestsPage() {
  return (
    <FirmWorkspacePage className="cb-services-layout-page xl:min-h-0 xl:flex-1">
      <div className="cb-firm-operational-panel flex min-h-0 flex-1 flex-col overflow-hidden">
        <ServicesWorkspace />
      </div>
    </FirmWorkspacePage>
  )
}
