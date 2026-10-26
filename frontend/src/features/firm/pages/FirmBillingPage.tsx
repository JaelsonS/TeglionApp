import { BillingWorkspace } from '@/features/firm/billing/BillingWorkspace'
import { FirmWorkspacePage } from '@/features/firm/FirmPageLayout'

/** Plano Teglion — page-scroll (KPIs + cartões + FAQ). */
export function FirmBillingPage() {
  return (
    <FirmWorkspacePage className="cb-billing-page-root cb-billing-layout-page">
      <div className="cb-firm-operational-panel cb-billing-layout-panel flex w-full min-w-0 flex-col">
        <BillingWorkspace />
      </div>
    </FirmWorkspacePage>
  )
}
