import { AgendaWorkspace } from '@/features/firm/agenda/AgendaWorkspace'
import { FirmWorkspacePage } from '@/features/firm/FirmPageLayout'

export function FirmAgendaPage() {
  return (
    <FirmWorkspacePage className="cb-agenda-layout-page xl:min-h-0 xl:flex-1">
      <div className="cb-firm-operational-panel flex min-h-0 flex-1 flex-col overflow-hidden">
        <AgendaWorkspace />
      </div>
    </FirmWorkspacePage>
  )
}
