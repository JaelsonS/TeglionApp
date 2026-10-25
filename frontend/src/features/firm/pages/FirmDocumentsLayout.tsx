import { Outlet } from 'react-router-dom'

import { DocumentsHubShell } from '@/features/firm/documents-hub/DocumentsHubShell'
import { FirmWorkspacePage } from '@/features/firm/FirmPageLayout'

export function FirmDocumentsLayout() {
  return (
    <FirmWorkspacePage className="cb-docs-layout-page min-h-0 flex-1">
      <div className="cb-firm-operational-panel cb-docs-layout-panel flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        <DocumentsHubShell>
          <Outlet />
        </DocumentsHubShell>
      </div>
    </FirmWorkspacePage>
  )
}
