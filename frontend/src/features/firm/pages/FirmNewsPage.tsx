import { NewsWorkspace } from '@/features/firm/news/NewsWorkspace'
import { FirmWorkspacePage } from '@/features/firm/FirmPageLayout'

/** Blog / Notícias do gabinete — page-scroll (lista + detalhe em fluxo de página). */
export function FirmNewsPage() {
  return (
    <FirmWorkspacePage className="cb-news-page cb-news-layout-page">
      <div className="cb-firm-operational-panel cb-news-layout-panel flex w-full min-w-0 flex-col">
        <NewsWorkspace />
      </div>
    </FirmWorkspacePage>
  )
}
