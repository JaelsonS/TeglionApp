import { Link, Navigate, useSearchParams } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { ExternalLink, FileText, Globe, Inbox, Landmark, Package } from 'lucide-react'

import { ServicesCatalogWorkspace } from '@/features/firm/services/ServicesCatalogWorkspace'
import { ServiceInquiriesWorkspace } from '@/features/firm/services/ServiceInquiriesWorkspace'
import { ServicesWorkspace } from '@/features/firm/services/ServicesWorkspace'
import { countServicePublishStats } from '@/features/firm/services/servicePublishState'
import { isIrsService } from '@/features/firm/services/servicesFormat'
import { AskMayaButton } from '@/features/maya'
import { useFirmServiceInquiriesUnseen } from '@/features/firm/FirmSidebar'
import { FirmModuleShell } from '@/shared/design-system/FirmModuleShell'
import { Button } from '@/shared/components/ui/button'
import { useAuth } from '@/shared/hooks/useAuth'
import { contabilAccountingServicesApi } from '@/infrastructure/api'
import { cn } from '@/shared/lib/utils'
import type { AccountingService } from '@/shared/types/contabil'

const TABS = [
  {
    id: 'catalog',
    label: 'Catálogo',
    title: 'Serviços',
    subtitle:
      'Catálogo geral do gabinete (exclui IRS). Publique para a página pública; pedidos chegam em Solicitações.',
    leadTitle: 'Catálogo do gabinete',
    leadDetail:
      'Activo = na equipa · Publicado = na página pública · IRS = Área IRS · Pedidos do site = Solicitações.',
  },
  {
    id: 'inquiries',
    label: 'Solicitações',
    title: 'Solicitações',
    subtitle: 'Pedidos da página pública — contacte, peça documentos e avance o estado.',
    leadTitle: 'Captação pública',
    leadDetail:
      'Leads e formulários do site. Distinto da Central (clientes da app / carteira).',
  },
  {
    id: 'central',
    label: 'Central',
    title: 'Central de Serviços',
    subtitle: 'Pedidos de clientes da app Teglion (carteira). Captação pública fica em Solicitações.',
    leadTitle: 'Pipeline interno',
    leadDetail:
      'Kanban de pedidos da carteira — orçamentos, PDF e estados. Solicitações são da página pública.',
  },
] as const

type TabId = (typeof TABS)[number]['id']

export function ServicesHubWorkspace() {
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
  const unseenInquiries = useFirmServiceInquiriesUnseen()

  const allServices = (servicesQuery.data?.items ?? []) as AccountingService[]
  const nonIrs = allServices.filter((s) => !isIrsService(s))
  const stats = countServicePublishStats(nonIrs)

  const publicUrl =
    typeof window !== 'undefined' && firmSlug
      ? `${window.location.origin}/${encodeURIComponent(firmSlug)}`
      : firmSlug
        ? `/${firmSlug}`
        : null

  const catalogKpis = [
    { id: 'active', label: 'Activos', value: String(stats.active), tone: 'brand' as const, icon: Package },
    {
      id: 'published',
      label: 'Publicados',
      value: String(stats.published),
      tone: 'emerald' as const,
      icon: Globe,
    },
    {
      id: 'internal',
      label: 'Só internos',
      value: String(stats.internal),
      tone: 'amber' as const,
      icon: FileText,
    },
    {
      id: 'unseen',
      label: 'Por ver',
      value: String(unseenInquiries),
      tone: unseenInquiries > 0 ? ('rose' as const) : ('muted' as const),
      icon: Inbox,
    },
  ]

  return (
    <FirmModuleShell
      className="cb-services-shell cb-services-page-scroll"
      title={activeMeta.title}
      subtitle={activeMeta.subtitle}
      headerRight={
        <div className="flex flex-wrap items-center gap-2">
          <AskMayaButton
            intentId={activeTab === 'inquiries' || activeTab === 'central' ? 'requests' : 'service'}
          />
          {publicUrl ? (
            <Button type="button" size="sm" variant="outline" asChild>
              <a href={publicUrl} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="mr-1 h-4 w-4" aria-hidden />
                Página pública
              </a>
            </Button>
          ) : null}
          {activeTab === 'catalog' ? (
            <Button type="button" size="sm" variant="outline" asChild>
              <Link to="/app/firm/irs">
                <Landmark className="mr-1 h-4 w-4" aria-hidden />
                Área IRS
              </Link>
            </Button>
          ) : null}
        </div>
      }
      bodyClassName="gap-0 cb-services-body-hub"
    >
      <div className="cb-services-panel-hd shrink-0 px-4 pt-1 sm:px-5">
        <nav className="cb-services-tabs" aria-label="Secções de serviços">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              data-testid={`firm-services-tab-${tab.id}`}
              onClick={() => setSearchParams(tab.id === 'catalog' ? {} : { tab: tab.id })}
              className={cn('cb-services-tab', activeTab === tab.id && 'cb-services-tab-active')}
            >
              {tab.label}
              {tab.id === 'inquiries' && unseenInquiries > 0 ? (
                <span
                  className="cb-firm-nav-item-badge ml-1.5"
                  aria-label={`${unseenInquiries} solicitações por ver`}
                >
                  {unseenInquiries > 99 ? '99+' : unseenInquiries}
                </span>
              ) : null}
            </button>
          ))}
        </nav>
      </div>

      {activeTab === 'catalog' ? (
        <div className="cb-services-kpi-strip" data-testid="services-hub-kpis">
          {catalogKpis.map((item) => {
            const Icon = item.icon
            return (
              <button
                key={item.id}
                type="button"
                className={cn(
                  'cb-services-kpi',
                  `cb-services-kpi--${item.tone}`,
                  item.id === 'unseen' && unseenInquiries > 0 && 'cb-services-kpi--clickable',
                )}
                onClick={
                  item.id === 'unseen' && unseenInquiries > 0
                    ? () => setSearchParams({ tab: 'inquiries' })
                    : undefined
                }
              >
                <span className="cb-services-kpi-icon" aria-hidden>
                  <Icon className="h-4 w-4" />
                </span>
                <div className="min-w-0 text-left">
                  <p className="cb-services-kpi-value">{item.value}</p>
                  <p className="cb-services-kpi-label">{item.label}</p>
                </div>
              </button>
            )
          })}
        </div>
      ) : null}

      {activeTab === 'inquiries' && unseenInquiries > 0 ? (
        <div className="cb-services-campaign cb-services-campaign--pending" data-testid="services-unseen-banner">
          <div className="min-w-0 flex-1">
            <p className="cb-services-campaign-title">
              {unseenInquiries} solicitação{unseenInquiries === 1 ? '' : 'ões'} por ver
            </p>
            <p className="cb-services-campaign-detail">
              Abra um pedido para marcar como visto e avançar o contacto.
            </p>
          </div>
          <Inbox className="h-5 w-5 shrink-0 text-amber-800" aria-hidden />
        </div>
      ) : null}

      <p className="cb-services-section-lead">
        <span className="cb-services-section-lead-title">{activeMeta.leadTitle}</span>
        {activeMeta.leadDetail}
      </p>

      <div className="cb-services-section-host">
        {activeTab === 'catalog' ? (
          <ServicesCatalogWorkspace
            services={allServices}
            isLoading={servicesQuery.isLoading}
            onReload={() => qc.invalidateQueries({ queryKey: ['contabil-accounting-services'] })}
            excludeIrs
          />
        ) : activeTab === 'central' ? (
          <ServicesWorkspace embedded />
        ) : (
          <ServiceInquiriesWorkspace embedded />
        )}
      </div>
    </FirmModuleShell>
  )
}
