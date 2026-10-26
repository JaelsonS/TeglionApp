import { RentalsWorkspace } from '@/features/firm/rentals/RentalsWorkspace'
import { FirmWorkspacePage } from '@/features/firm/FirmPageLayout'

export function FirmRentalsPage() {
  return (
    <FirmWorkspacePage className="cb-rentals-page cb-rentals-layout-page">
      <div className="cb-firm-operational-panel cb-rentals-layout-panel flex w-full min-w-0 flex-col">
        <RentalsWorkspace />
      </div>
    </FirmWorkspacePage>
  )
}
