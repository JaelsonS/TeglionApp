import { WithholdingCalculatorWorkspace } from '@/features/firm/fiscal/WithholdingCalculatorWorkspace'
import { FirmWorkspacePage } from '@/features/firm/FirmPageLayout'

export function FirmWithholdingCalculatorPage() {
  return (
    <FirmWorkspacePage className="cb-wh-calc-layout-page xl:min-h-0 xl:flex-1">
      <div className="cb-firm-operational-panel flex min-h-0 flex-1 flex-col overflow-hidden">
        <WithholdingCalculatorWorkspace />
      </div>
    </FirmWorkspacePage>
  )
}
