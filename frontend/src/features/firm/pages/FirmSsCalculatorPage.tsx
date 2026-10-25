import { SsCalculatorWorkspace } from '@/features/firm/fiscal/SsCalculatorWorkspace'
import { FirmWorkspacePage } from '@/features/firm/FirmPageLayout'

export function FirmSsCalculatorPage() {
  return (
    <FirmWorkspacePage className="cb-ss-calc-layout-page xl:min-h-0 xl:flex-1">
      <div className="cb-firm-operational-panel flex min-h-0 flex-1 flex-col overflow-hidden">
        <SsCalculatorWorkspace />
      </div>
    </FirmWorkspacePage>
  )
}
