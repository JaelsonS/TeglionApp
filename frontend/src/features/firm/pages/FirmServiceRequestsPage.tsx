import { useSearchParams } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'

import { ServicesWorkspace } from '@/features/firm/services/ServicesWorkspace'
import { ServiceInquiriesWorkspace } from '@/features/firm/services/ServiceInquiriesWorkspace'
import { AgendaServicesCatalogPanel } from '@/features/firm/agenda/AgendaServicesCatalogPanel'
import { FirmWorkspacePage } from '@/features/firm/FirmPageLayout'
import { contabilAccountingServicesApi } from '@/infrastructure/api'
import { cn } from '@/shared/lib/utils'

const TABS = [
  { id: 'catalog', label: 'Catálogo' },
  { id: 'irs', label: 'IRS' },
  { id: 'central', label: 'Central de Serviços' },
  { id: 'inquiries', label: 'Solicitações' },
] as const

type TabId = (typeof TABS)[number]['id']

export function FirmServiceRequestsPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const rawTab = searchParams.get('tab')
  const activeTab: TabId =
    rawTab === 'irs' || rawTab === 'central' || rawTab === 'inquiries' ? rawTab : 'catalog'

  const qc = useQueryClient()
  const servicesQuery = useQuery({
    queryKey: ['contabil-accounting-services', 'catalog-tab'],
    queryFn: () => contabilAccountingServicesApi.list(),
  })

  return (
    <FirmWorkspacePage className="cb-services-layout-page xl:min-h-0 xl:flex-1">
      <div className="mb-3 flex gap-1 rounded-full border border-border/50 bg-muted/20 p-1 w-fit">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setSearchParams(tab.id === 'catalog' ? {} : { tab: tab.id })}
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
        {activeTab === 'catalog' || activeTab === 'irs' ? (
          <AgendaServicesCatalogPanel
            key={activeTab}
            services={servicesQuery.data?.items ?? []}
            isLoading={servicesQuery.isLoading}
            onReload={() => qc.invalidateQueries({ queryKey: ['contabil-accounting-services', 'catalog-tab'] })}
            focusFilter={activeTab === 'irs' ? 'irs' : undefined}
            title={activeTab === 'irs' ? 'Serviços de IRS' : undefined}
            description={
              activeTab === 'irs'
                ? 'Simulação, entrega e outros serviços de IRS activos no escritório. Active mais a partir do catálogo nacional ou crie um novo.'
                : undefined
            }
          />
        ) : activeTab === 'central' ? (
          <ServicesWorkspace />
        ) : (
          <ServiceInquiriesWorkspace />
        )}
      </div>
    </FirmWorkspacePage>
  )
}
