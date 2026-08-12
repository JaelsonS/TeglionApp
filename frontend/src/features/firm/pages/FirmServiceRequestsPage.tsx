import { Navigate, useSearchParams } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'

import { ServicesWorkspace } from '@/features/firm/services/ServicesWorkspace'
import { ServiceInquiriesWorkspace } from '@/features/firm/services/ServiceInquiriesWorkspace'
import { ServicesCatalogWorkspace } from '@/features/firm/services/ServicesCatalogWorkspace'
import { FirmWorkspacePage } from '@/features/firm/FirmPageLayout'
import { FirmModuleShell } from '@/shared/design-system/FirmModuleShell'
import { contabilAccountingServicesApi } from '@/infrastructure/api'
import { cn } from '@/shared/lib/utils'

const TABS = [
  {
    id: 'catalog',
    label: 'Catálogo',
    title: 'Catálogo',
    subtitle: 'Serviços activos do escritório e modelos Teglion',
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
    subtitle: 'Pedidos de clientes já no escritório (app Teglion)',
  },
] as const

type TabId = (typeof TABS)[number]['id']

export function FirmServiceRequestsPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const rawTab = searchParams.get('tab')
  if (rawTab === 'irs') return <Navigate to="/app/firm/irs" replace />

  const activeTab: TabId = rawTab === 'central' || rawTab === 'inquiries' ? rawTab : 'catalog'
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
        bodyClassName="flex min-h-0 flex-1 flex-col overflow-hidden"
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

        <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto p-3 sm:p-4">
          {activeTab === 'catalog' ? (
            <>
              <div className="shrink-0 rounded-xl border border-border/50 bg-muted/20 px-4 py-3 text-sm text-muted-foreground">
                <span className="font-semibold text-foreground">Catálogo</span>
                {' — '}à esquerda os serviços do escritório; à direita modelos Teglion para activar. O IRS tem ecrã
                próprio no menu.
              </div>
              <ServicesCatalogWorkspace
                services={servicesQuery.data?.items ?? []}
                isLoading={servicesQuery.isLoading}
                onReload={() => qc.invalidateQueries({ queryKey: ['contabil-accounting-services'] })}
                excludeIrs
              />
            </>
          ) : activeTab === 'central' ? (
            <>
              <div className="shrink-0 rounded-xl border border-border/50 bg-muted/20 px-4 py-3 text-sm text-muted-foreground">
                <span className="font-semibold text-foreground">Central de Serviços</span>
                {' — '}apenas clientes com acesso à <span className="font-semibold text-foreground">app Teglion</span>.
                Pedem e agendam serviços que o escritório activou. Captação pública fica em Solicitações.
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
