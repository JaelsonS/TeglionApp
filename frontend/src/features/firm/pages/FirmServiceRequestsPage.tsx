import { Navigate, useSearchParams } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { ExternalLink } from 'lucide-react'

import { ServicesWorkspace } from '@/features/firm/services/ServicesWorkspace'
import { ServiceInquiriesWorkspace } from '@/features/firm/services/ServiceInquiriesWorkspace'
import { ServicesCatalogWorkspace } from '@/features/firm/services/ServicesCatalogWorkspace'
import { countServicePublishStats } from '@/features/firm/services/servicePublishState'
import { FirmWorkspacePage } from '@/features/firm/FirmPageLayout'
import { AskMayaButton } from '@/features/maya'
import { FirmModuleShell } from '@/shared/design-system/FirmModuleShell'
import { Button } from '@/shared/components/ui/button'
import { useAuth } from '@/shared/hooks/useAuth'
import { contabilAccountingServicesApi, contabilServiceInquiriesApi } from '@/infrastructure/api'
import { cn } from '@/shared/lib/utils'
import type { AccountingService } from '@/shared/types/contabil'

const TABS = [
  {
    id: 'catalog',
    label: 'Catálogo',
    title: 'Serviços',
    subtitle:
      'Apresente o que o escritório oferece e permita que potenciais clientes façam pedidos pela página pública.',
  },
  {
    id: 'inquiries',
    label: 'Solicitações',
    title: 'Solicitações',
    subtitle: 'Pedidos que chegam da página pública — contacte, peça documentos e avance o estado.',
  },
  {
    id: 'central',
    label: 'Central',
    title: 'Central de Serviços',
    subtitle: 'Pedidos de clientes que já usam a app Teglion (carteira). Captação pública fica em Solicitações.',
  },
] as const

type TabId = (typeof TABS)[number]['id']

function isIrsService(s: { name: string; catalogKey?: string | null; category?: string }) {
  if (s.category === 'IRS') return true
  const blob = `${s.name} ${s.catalogKey || ''}`
  return /\birs\b/i.test(blob) || /e-?fatura/i.test(blob) || /^irs-/.test(s.catalogKey || '')
}

export function FirmServiceRequestsPage() {
  const { user } = useAuth()
  const firmSlug = user?.tenant?.slug
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
  const inquiriesQuery = useQuery({
    queryKey: ['contabil-service-inquiries', 'services-hub-kpis'],
    queryFn: () => contabilServiceInquiriesApi.list({ status: 'NEW' }),
    staleTime: 30_000,
  })

  const allServices = (servicesQuery.data?.items ?? []) as AccountingService[]
  const nonIrs = allServices.filter((s) => !isIrsService(s))
  const stats = countServicePublishStats(nonIrs)
  const newInquiries = inquiriesQuery.data?.items?.length ?? 0
  const publicUrl =
    typeof window !== 'undefined' && firmSlug
      ? `${window.location.origin}/${encodeURIComponent(firmSlug)}`
      : firmSlug
        ? `/${firmSlug}`
        : null

  return (
    <FirmWorkspacePage className="cb-services-layout-page xl:min-h-0 xl:flex-1">
      <FirmModuleShell
        className="cb-firm-operational-panel min-h-0 flex-1 overflow-hidden"
        title={activeMeta.title}
        subtitle={activeMeta.subtitle}
        headerRight={
          <div className="flex flex-wrap items-center gap-2">
            <AskMayaButton intentId={activeTab === 'inquiries' || activeTab === 'central' ? 'requests' : 'service'} />
            {publicUrl ? (
              <Button type="button" size="sm" variant="outline" asChild>
                <a href={publicUrl} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-4 w-4" />
                  Ver página pública
                </a>
              </Button>
            ) : null}
          </div>
        }
        bodyClassName="flex min-h-0 flex-1 flex-col overflow-hidden"
      >
        <div className="shrink-0 border-b border-border/60 px-4 sm:px-5">
          <nav className="cb-tasks-tabs -mb-px overflow-x-auto" aria-label="Secções de serviços">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                data-testid={`firm-services-tab-${tab.id}`}
                onClick={() => setSearchParams(tab.id === 'catalog' ? {} : { tab: tab.id })}
                className={cn('cb-tasks-tab', activeTab === tab.id && 'cb-tasks-tab-active')}
              >
                {tab.label}
                {tab.id === 'inquiries' && newInquiries > 0 ? (
                  <span className="ml-1.5 rounded-full bg-brand/15 px-1.5 py-0.5 text-[10px] font-bold text-brand">
                    {newInquiries}
                  </span>
                ) : null}
              </button>
            ))}
          </nav>
        </div>

        {activeTab === 'catalog' ? (
          <div className="shrink-0 border-b border-border/40 bg-muted/15 px-3 py-3 sm:px-4">
            <p className="mb-2 text-caption text-muted-foreground">
              Activo = disponível no escritório · Publicado = visível na página pública · Pedidos do site =
              Solicitações
            </p>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4" data-testid="services-hub-kpis">
              {[
                { label: 'Activos', value: String(stats.active) },
                { label: 'Publicados', value: String(stats.published) },
                { label: 'Só internos', value: String(stats.internal) },
                { label: 'Pedidos novos', value: String(newInquiries) },
              ].map((kpi) => (
                <div key={kpi.label} className="rounded-lg border border-border/60 bg-card px-3 py-2">
                  <p className="text-caption font-medium text-muted-foreground">{kpi.label}</p>
                  <p className="text-lg font-semibold tabular-nums text-foreground">{kpi.value}</p>
                </div>
              ))}
            </div>
            {newInquiries > 0 ? (
              <p className="mt-2 text-sm text-muted-foreground">
                Tem pedidos novos da página pública —{' '}
                <button
                  type="button"
                  className="font-medium text-brand underline-offset-2 hover:underline"
                  onClick={() => setSearchParams({ tab: 'inquiries' })}
                >
                  abrir Solicitações
                </button>
                .
              </p>
            ) : null}
          </div>
        ) : null}

        <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto p-3 sm:p-4">
          {activeTab === 'catalog' ? (
            <ServicesCatalogWorkspace
              services={allServices}
              isLoading={servicesQuery.isLoading}
              onReload={() => qc.invalidateQueries({ queryKey: ['contabil-accounting-services'] })}
              excludeIrs
            />
          ) : activeTab === 'central' ? (
            <ServicesWorkspace />
          ) : (
            <ServiceInquiriesWorkspace />
          )}
        </div>
      </FirmModuleShell>
    </FirmWorkspacePage>
  )
}
