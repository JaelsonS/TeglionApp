import { RentalsWorkspace } from '@/features/firm/rentals/RentalsWorkspace'
import { FirmWorkspacePage } from '@/features/firm/FirmPageLayout'

/** Arrendamentos dos clientes — módulo separado dos custos do gabinete. */
export function FirmClientRentalsPage() {
  return (
    <FirmWorkspacePage className="cb-rentals-page cb-rentals-layout-page">
      <div className="cb-firm-operational-panel cb-rentals-layout-panel flex w-full min-w-0 flex-col">
        <RentalsWorkspace variant="client" />
      </div>
    </FirmWorkspacePage>
  )
}
