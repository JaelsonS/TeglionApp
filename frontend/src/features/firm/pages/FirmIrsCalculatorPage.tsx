import { IrsCalculatorWorkspace } from '@/features/firm/fiscal/IrsCalculatorWorkspace'
import { FirmWorkspacePage } from '@/features/firm/FirmPageLayout'

export function FirmIrsCalculatorPage() {
  return (
    <FirmWorkspacePage className="cb-irs-calc-layout-page xl:min-h-0 xl:flex-1">
      <div className="cb-firm-operational-panel flex min-h-0 flex-1 flex-col overflow-hidden">
        <IrsCalculatorWorkspace />
      </div>
    </FirmWorkspacePage>
  )
}
