import { IrsWorkspace } from '@/features/firm/irs/IrsWorkspace'
import { FirmWorkspacePage } from '@/features/firm/FirmPageLayout'

export function FirmIrsPage() {
  return (
    <FirmWorkspacePage className="cb-irs-page cb-irs-layout-page">
      <div className="cb-firm-operational-panel cb-irs-layout-panel flex w-full min-w-0 flex-col">
        <IrsWorkspace />
      </div>
    </FirmWorkspacePage>
  )
}
