import { SaftWorkspace } from '@/features/firm/saft/SaftWorkspace'
import { FirmWorkspacePage } from '@/features/firm/FirmPageLayout'

export function FirmSaftPage() {
  return (
    <FirmWorkspacePage className="cb-saft-page cb-saft-layout-page">
      <div className="cb-firm-operational-panel cb-saft-layout-panel flex w-full min-w-0 flex-col">
        <SaftWorkspace />
      </div>
    </FirmWorkspacePage>
  )
}
