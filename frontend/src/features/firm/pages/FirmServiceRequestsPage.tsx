import { useSearchParams } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'

import { ServicesWorkspace } from '@/features/firm/services/ServicesWorkspace'
import { ServiceInquiriesWorkspace } from '@/features/firm/services/ServiceInquiriesWorkspace'
import { AgendaServicesCatalogPanel } from '@/features/firm/agenda/AgendaServicesCatalogPanel'
import { FirmWorkspacePage } from '@/features/firm/FirmPageLayout'
import { FirmModuleShell } from '@/shared/design-system/FirmModuleShell'
import { contabilAccountingServicesApi } from '@/infrastructure/api'
import { cn } from '@/shared/lib/utils'

const TABS = [
  {
    id: 'catalog',
    label: 'Catálogo',
    title: 'Catálogo',
    subtitle: 'Serviços da página pública e formulários de captação',
  },
  {
    id: 'irs',
    label: 'IRS',
    title: 'IRS',
    subtitle: 'Modelos e serviços de IRS activos no escritório',
  },
  {
    id: 'inquiries',
    label: 'Solicitações',
    title: 'Solicitações',
    subtitle: 'Pedidos da página pública — a equipa decide o próximo passo',
  },
  {
    id: 'central',
    label: 'Central de Serviços',
    title: 'Central de Serviços',
    subtitle: 'Pedidos de clientes já no escritório',
  },
] as const

type TabId = (typeof TABS)[number]['id']

export function FirmServiceRequestsPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const rawTab = searchParams.get('tab')
  const activeTab: TabId =
    rawTab === 'irs' || rawTab === 'central' || rawTab === 'inquiries' ? rawTab : 'catalog'
  const activeMeta = TABS.find((t) => t.id === activeTab) ?? TABS[0]

  const qc = useQueryClient()
  const servicesQuery = useQuery({
    queryKey: ['contabil-accounting-services', 'catalog-tab'],
    queryFn: () => contabilAccountingServicesApi.list(),
  })

  return (
    <FirmWorkspacePage className="cb-services-layout-page xl:min-h-0 xl:flex-1">
      <FirmModuleShell
        className="cb-firm-operational-panel min-h-0 flex-1 overflow-hidden"
        title={activeMeta.title}
        subtitle={activeMeta.subtitle}
        bodyClassName="min-h-0 flex-1 overflow-y-auto overflow-x-hidden"
      >
        <div className="shrink-0 border-b border-border/60 px-4 sm:px-5">
          <nav className="cb-tasks-tabs -mb-px" aria-label="Secções de serviços">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                data-testid={`firm-services-tab-${tab.id}`}
                onClick={() => setSearchParams(tab.id === 'catalog' ? {} : { tab: tab.id })}
                className={cn('cb-tasks-tab', activeTab === tab.id && 'cb-tasks-tab-active')}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="flex min-h-0 flex-1 flex-col gap-3 p-3 sm:p-4">
          {activeTab === 'catalog' || activeTab === 'irs' ? (
            <>
              <div className="shrink-0 rounded-xl border border-border/50 bg-muted/20 px-4 py-3">
                <p className="text-sm text-muted-foreground">
                  {activeTab === 'irs' ? (
                    <>
                      <span className="font-semibold text-foreground">IRS</span>
                      {' — '}modelos e serviços do escritório. O cliente preenche na página pública; as respostas
                      chegam em <span className="font-semibold text-foreground">Solicitações</span>.
                    </>
                  ) : (
                    <>
                      <span className="font-semibold text-foreground">Catálogo</span>
                      {' — '}publique serviços na página do escritório. Captação nova ≠ clientes já no escritório
                      (isso é a <span className="font-semibold text-foreground">Central</span>).
                    </>
                  )}
                </p>
              </div>
              <AgendaServicesCatalogPanel
                key={activeTab}
                services={servicesQuery.data?.items ?? []}
                isLoading={servicesQuery.isLoading}
                onReload={() => qc.invalidateQueries({ queryKey: ['contabil-accounting-services', 'catalog-tab'] })}
                focusFilter={activeTab === 'irs' ? 'irs' : undefined}
                title={activeTab === 'irs' ? 'Serviços de IRS' : undefined}
                description={
                  activeTab === 'irs'
                    ? 'Simulação, entrega e outros serviços de IRS activos no escritório.'
                    : 'Serviços publicados e formulários de captação.'
                }
              />
            </>
          ) : activeTab === 'central' ? (
            <>
              <div className="shrink-0 rounded-xl border border-border/50 bg-muted/20 px-4 py-3">
                <p className="text-sm text-muted-foreground">
                  <span className="font-semibold text-foreground">Central de Serviços</span>
                  {' — '}pedidos de <span className="font-semibold text-foreground">clientes já no escritório</span>.
                  Captação da página pública fica em Solicitações.
                </p>
              </div>
              <ServicesWorkspace />
            </>
          ) : (
            <ServiceInquiriesWorkspace />
          )}
        </div>
      </FirmModuleShell>
    </FirmWorkspacePage>
  )
}
