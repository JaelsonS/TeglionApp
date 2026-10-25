import { PaymentsWorkspace } from '@/features/firm/payments/PaymentsWorkspace'
import { FirmWorkspacePage } from '@/features/firm/FirmPageLayout'

export function FirmPaymentsPage() {
  return (
    <FirmWorkspacePage className="cb-payments-page cb-payments-layout-page">
      <div className="cb-firm-operational-panel cb-payments-layout-panel flex w-full min-w-0 flex-col">
        <PaymentsWorkspace />
      </div>
    </FirmWorkspacePage>
  )
}
