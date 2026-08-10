import { useSearchParams } from 'react-router-dom'

import { ServicesWorkspace } from '@/features/firm/services/ServicesWorkspace'
import { ServiceInquiriesWorkspace } from '@/features/firm/services/ServiceInquiriesWorkspace'
import { FirmWorkspacePage } from '@/features/firm/FirmPageLayout'
import { cn } from '@/shared/lib/utils'

const TABS = [
  { id: 'central', label: 'Central de Serviços' },
  { id: 'inquiries', label: 'Solicitações' },
] as const

type TabId = (typeof TABS)[number]['id']

export function FirmServiceRequestsPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const activeTab: TabId = searchParams.get('tab') === 'inquiries' ? 'inquiries' : 'central'

  return (
    <FirmWorkspacePage className="cb-services-layout-page xl:min-h-0 xl:flex-1">
      <div className="mb-3 flex gap-1 rounded-full border border-border/50 bg-muted/20 p-1 w-fit">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setSearchParams(tab.id === 'central' ? {} : { tab: tab.id })}
            className={cn(
              'rounded-full px-3.5 py-1.5 text-sm font-semibold transition',
              activeTab === tab.id ? 'bg-brand text-primary-foreground shadow-sm' : 'text-muted-foreground',
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div className="cb-firm-operational-panel flex min-h-0 flex-1 flex-col overflow-hidden">
        {activeTab === 'central' ? <ServicesWorkspace /> : <ServiceInquiriesWorkspace />}
      </div>
    </FirmWorkspacePage>
  )
}
