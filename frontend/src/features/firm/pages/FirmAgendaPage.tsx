import { AgendaWorkspace } from '@/features/firm/agenda/AgendaWorkspace'
import { FirmWorkspacePage } from '@/features/firm/FirmPageLayout'

export function FirmAgendaPage() {
  return (
    <FirmWorkspacePage className="cb-agenda-page cb-agenda-layout-page">
      <div className="cb-firm-operational-panel cb-agenda-layout-panel flex w-full min-w-0 flex-col">
        <AgendaWorkspace />
      </div>
    </FirmWorkspacePage>
  )
}
