import { Outlet } from 'react-router-dom'

import { DocumentsHubShell } from '@/features/firm/documents-hub/DocumentsHubShell'
import { FirmWorkspacePage } from '@/features/firm/FirmPageLayout'

export function FirmDocumentsLayout() {
  return (
    <FirmWorkspacePage className="cb-docs-layout-page">
      <div className="cb-firm-operational-panel cb-docs-layout-panel">
        <DocumentsHubShell>
          <Outlet />
        </DocumentsHubShell>
      </div>
    </FirmWorkspacePage>
  )
}
