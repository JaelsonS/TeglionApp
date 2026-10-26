import { ServicesHubWorkspace } from '@/features/firm/services/ServicesHubWorkspace'
import { FirmWorkspacePage } from '@/features/firm/FirmPageLayout'

export function FirmServiceRequestsPage() {
  return (
    <FirmWorkspacePage className="cb-services-page cb-services-layout-page">
      <div className="cb-firm-operational-panel cb-services-layout-panel flex w-full min-w-0 flex-col">
        <ServicesHubWorkspace />
      </div>
    </FirmWorkspacePage>
  )
}
