import { ClientsWorkspace } from '@/features/firm/clients/ClientsWorkspace'
import { FirmWorkspacePage } from '@/features/firm/FirmPageLayout'

export function FirmClientsPage() {
  return (
    <FirmWorkspacePage className="cb-clients-page cb-clients-layout-page">
      <div className="cb-firm-operational-panel cb-clients-layout-panel flex w-full min-w-0 flex-col">
        <ClientsWorkspace />
      </div>
    </FirmWorkspacePage>
  )
}
