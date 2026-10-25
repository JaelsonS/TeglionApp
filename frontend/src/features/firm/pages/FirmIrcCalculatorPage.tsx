import { IrcCalculatorWorkspace } from '@/features/firm/fiscal/IrcCalculatorWorkspace'
import { FirmWorkspacePage } from '@/features/firm/FirmPageLayout'

export function FirmIrcCalculatorPage() {
  return (
    <FirmWorkspacePage className="cb-irc-calc-layout-page xl:min-h-0 xl:flex-1">
      <div className="cb-firm-operational-panel flex min-h-0 flex-1 flex-col overflow-hidden">
        <IrcCalculatorWorkspace />
      </div>
    </FirmWorkspacePage>
  )
}
