import { NewsWorkspace } from '@/features/firm/news/NewsWorkspace'
import { FirmWorkspacePage } from '@/features/firm/FirmPageLayout'

export function FirmNewsPage() {
  return (
    <FirmWorkspacePage className="cb-alerts-layout-page xl:min-h-0 xl:flex-1">
      <div className="cb-firm-operational-panel flex min-h-0 flex-1 flex-col overflow-hidden">
        <NewsWorkspace />
      </div>
    </FirmWorkspacePage>
  )
}
