import { ImtCalculatorWorkspace } from '@/features/firm/fiscal/ImtCalculatorWorkspace'
import { FirmWorkspacePage } from '@/features/firm/FirmPageLayout'

export function FirmImtCalculatorPage() {
  return (
    <FirmWorkspacePage className="cb-imt-calc-layout-page xl:min-h-0 xl:flex-1">
      <div className="cb-firm-operational-panel flex min-h-0 flex-1 flex-col overflow-hidden">
        <ImtCalculatorWorkspace />
      </div>
    </FirmWorkspacePage>
  )
}
