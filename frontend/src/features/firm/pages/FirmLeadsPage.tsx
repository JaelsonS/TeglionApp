import { LeadsWorkspace } from '@/features/firm/leads/LeadsWorkspace'
import { FirmWorkspacePage } from '@/features/firm/FirmPageLayout'

export function FirmLeadsPage() {
  return (
    <FirmWorkspacePage className="cb-leads-layout-page xl:min-h-0 xl:flex-1">
      <div className="cb-firm-operational-panel flex min-h-0 flex-1 flex-col overflow-hidden">
        <LeadsWorkspace />
      </div>
    </FirmWorkspacePage>
  )
}
