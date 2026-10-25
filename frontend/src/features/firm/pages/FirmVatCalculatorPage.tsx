import { VatCalculatorWorkspace } from '@/features/firm/fiscal/VatCalculatorWorkspace'
import { FirmWorkspacePage } from '@/features/firm/FirmPageLayout'

export function FirmVatCalculatorPage() {
  return (
    <FirmWorkspacePage className="cb-vat-calc-layout-page xl:min-h-0 xl:flex-1">
      <div className="cb-firm-operational-panel flex min-h-0 flex-1 flex-col overflow-hidden">
        <VatCalculatorWorkspace />
      </div>
    </FirmWorkspacePage>
  )
}
