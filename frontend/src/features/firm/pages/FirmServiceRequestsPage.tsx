import { Navigate, useSearchParams } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'

import { ServicesWorkspace } from '@/features/firm/services/ServicesWorkspace'
import { ServiceInquiriesWorkspace } from '@/features/firm/services/ServiceInquiriesWorkspace'
import { ServicesCatalogWorkspace } from '@/features/firm/services/ServicesCatalogWorkspace'
import { FirmWorkspacePage } from '@/features/firm/FirmPageLayout'
import { FirmModuleShell } from '@/shared/design-system/FirmModuleShell'
import { ModuleHelpDialog } from '@/shared/design-system/ModuleHelpDialog'
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

const HELP_BY_TAB: Record<
  TabId,
  { title: string; intro: string; steps: { title: string; description: string }[] }
> = {
  catalog: {
    title: 'Catálogo de serviços',
    intro:
      'Aqui gere o que o escritório oferece: serviços activos à esquerda e modelos Teglion à direita. O IRS tem ecrã próprio no menu lateral.',
    steps: [
      {
        title: 'Os vossos serviços',
        description:
          'À esquerda: filtre e abra o editor completo (caneta) — banner, formulário, logótipo, publicação, pré-visualização e apagar.',
      },
      {
        title: 'Modelos Teglion',
        description: 'À direita: «Activar e editar» cria o serviço a partir do modelo e abre o editor para personalizar.',
      },
      {
        title: 'Criar do zero',
        description: 'Use «Criar serviço» para um serviço novo sem modelo, com o mesmo editor completo.',
      },
    ],
  },
  inquiries: {
    title: 'Solicitações',
    intro:
      'Pedidos que chegam da página pública (captação). A equipa contacta, pede documentos e avança o estado até concluir.',
    steps: [
      {
        title: 'Abrir um pedido',
        description: 'Seleccione na lista para ver contacto, respostas do formulário e histórico.',
      },
      {
        title: 'Actualizar o estado',
        description: 'Marque contactado, peça documentos ou conclua — o cliente acompanha o progresso quando aplicável.',
      },
      {
        title: 'Etiquetas e follow-up',
        description: 'Organize com etiquetas e use as acções do painel para não perder leads.',
      },
    ],
  },
  central: {
    title: 'Central de Serviços',
    intro:
      'Só para clientes com acesso à app Teglion. Pedem e agendam serviços que o escritório activou. Captação pública fica em Solicitações.',
    steps: [
      {
        title: 'Ver pedidos internos',
        description: 'Acompanhe pedidos feitos por clientes já na carteira, dentro da app.',
      },
      {
        title: 'Agendamentos e confirmações',
        description: 'Confirme ou trate o pedido conforme o fluxo do serviço (com ou sem pagamento online).',
      },
      {
        title: 'Catálogo activo',
        description: 'Só aparecem serviços que o escritório activou e publicou para esses clientes.',
      },
    ],
  },
}

export function FirmServiceRequestsPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const rawTab = searchParams.get('tab')
  if (rawTab === 'irs') return <Navigate to="/app/firm/irs" replace />

  const activeTab: TabId = rawTab === 'central' || rawTab === 'inquiries' ? rawTab : 'catalog'
  const activeMeta = TABS.find((t) => t.id === activeTab) ?? TABS[0]
  const help = HELP_BY_TAB[activeTab]

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
        headerRight={
          <ModuleHelpDialog title={help.title} intro={help.intro} triggerLabel="Guia" steps={help.steps} />
        }
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
            <ServicesCatalogWorkspace
              services={servicesQuery.data?.items ?? []}
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
