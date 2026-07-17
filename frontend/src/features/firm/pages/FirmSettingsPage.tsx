import { useCallback, useMemo } from 'react'
import {
  AlertTriangle,
  Building2,
  ImageIcon,
  Shield,
  User,
  Users,
} from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { useSearchParams } from 'react-router-dom'

import { FirmLogoSettingsCard } from '@/shared/components/contabil/FirmLogoSettingsCard'
import { FirmScrollPage } from '@/features/firm/FirmPageLayout'
import { firmSettingsApi } from '@/infrastructure/api/contabil/firmSettings'
import { FirmSettingsDangerZone } from '@/features/firm/settings/FirmSettingsDangerZone'
import { FirmSettingsFirmSection } from '@/features/firm/settings/FirmSettingsFirmSection'
import { FirmSettingsProfileSection } from '@/features/firm/settings/FirmSettingsProfileSection'
import { FirmSettingsTeamSection } from '@/features/firm/settings/FirmSettingsTeamSection'
import { FirmSettingsNotificationsSection } from '@/features/firm/settings/FirmSettingsNotificationsSection'
import { cn } from '@/shared/lib/utils'

const TABS = [
  { id: 'identidade', label: 'Identidade', icon: ImageIcon, danger: false },
  { id: 'escritorio', label: 'Escritório', icon: Building2, danger: false },
  { id: 'perfil', label: 'O seu perfil', icon: User, danger: false },
  { id: 'equipa', label: 'Equipa', icon: Users, danger: false },
  { id: 'notificacoes', label: 'Notificações', icon: Shield, danger: false },
  { id: 'encerrar', label: 'Encerrar conta', icon: AlertTriangle, danger: true },
] as const

type TabId = (typeof TABS)[number]['id']

function isTabId(value: string | null): value is TabId {
  return TABS.some((tab) => tab.id === value)
}

export function FirmSettingsPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const { data: bundle, isLoading, refetch } = useQuery({
    queryKey: ['firm-settings'],
    queryFn: () => firmSettingsApi.get(),
    staleTime: 30_000,
  })

  const onUpdated = useCallback(() => {
    void refetch()
  }, [refetch])

  const canEditLogo = bundle?.capabilities.canEditFirm ?? false
  const canCloseAccount = bundle?.capabilities.canCloseAccount ?? false

  const visibleTabs = useMemo(
    () => TABS.filter((tab) => (tab.id === 'encerrar' ? canCloseAccount : true)),
    [canCloseAccount],
  )

  const activeTab: TabId = useMemo(() => {
    const fromQuery = searchParams.get('tab')
    if (isTabId(fromQuery) && visibleTabs.some((tab) => tab.id === fromQuery)) {
      return fromQuery
    }
    // Compatibilidade com links antigos #equipa
    if (typeof window !== 'undefined') {
      const hash = window.location.hash.replace('#', '').trim()
      const hashMap: Record<string, TabId> = {
        identidade: 'identidade',
        escritorio: 'escritorio',
        perfil: 'perfil',
        equipa: 'equipa',
        notificacoes: 'notificacoes',
        'zona-perigo': 'encerrar',
      }
      const mapped = hashMap[hash]
      if (mapped && visibleTabs.some((tab) => tab.id === mapped)) return mapped
    }
    return 'identidade'
  }, [searchParams, visibleTabs])

  const setTab = useCallback(
    (tab: TabId) => {
      const next = new URLSearchParams(searchParams)
      next.set('tab', tab)
      setSearchParams(next, { replace: true })
      if (typeof window !== 'undefined' && window.location.hash) {
        window.history.replaceState(null, '', `${window.location.pathname}${window.location.search}`)
      }
    },
    [searchParams, setSearchParams],
  )

  const activeMeta = visibleTabs.find((tab) => tab.id === activeTab) || visibleTabs[0]

  return (
    <FirmScrollPage className="cb-settings-layout-page">
      <div className="cb-settings-page">
        <header className="cb-settings-page-hd">
          <h1 className="cb-settings-page-title">Definições</h1>
          <p className="cb-settings-page-sub">
            Identidade, dados do escritório, equipa e segurança da conta num único painel.
          </p>
        </header>

        {isLoading ? (
          <div className="cb-settings-skeleton" aria-busy="true">
            <div className="h-64 animate-pulse rounded-xl bg-muted/50" />
          </div>
        ) : bundle ? (
          <div className="cb-settings-hub">
            <nav className="cb-settings-side-nav" aria-label="Secções de configuração">
              {visibleTabs.map((item) => {
                const Icon = item.icon
                const active = item.id === activeTab
                return (
                  <button
                    key={item.id}
                    type="button"
                    className={cn(
                      'cb-settings-side-nav-item',
                      active && 'cb-settings-side-nav-item--active',
                      item.danger && 'cb-settings-side-nav-item--danger',
                    )}
                    aria-current={active ? 'page' : undefined}
                    onClick={() => setTab(item.id)}
                  >
                    <Icon className="h-4 w-4 shrink-0" aria-hidden />
                    <span>{item.label}</span>
                    {item.id === 'equipa' && bundle.team?.length ? (
                      <span className="cb-settings-side-nav-badge">{bundle.team.length}</span>
                    ) : null}
                  </button>
                )
              })}
            </nav>

            <div className="cb-settings-hub-main">
              <div className="cb-settings-hub-panel-hd">
                <h2 className="cb-settings-hub-panel-title">{activeMeta.label}</h2>
                <p className="cb-settings-hub-panel-sub">
                  {activeTab === 'identidade' && 'Logótipo no menu, portal do cliente e comunicações.'}
                  {activeTab === 'escritorio' && 'Nome e contactos do escritório.'}
                  {activeTab === 'perfil' && 'Os seus dados de acesso e segurança.'}
                  {activeTab === 'equipa' && 'Colaboradores, cargos e departamentos.'}
                  {activeTab === 'notificacoes' && 'Alertas push e preferências de aviso.'}
                  {activeTab === 'encerrar' && 'Acção irreversível — encerra o escritório.'}
                </p>
              </div>

              {activeTab === 'identidade' ? (
                <section className="cb-settings-panel">
                  <div className="cb-settings-panel-hd">
                    <span className="cb-settings-panel-icon">
                      <ImageIcon className="h-4 w-4" aria-hidden />
                    </span>
                    <div>
                      <h3 className="cb-settings-panel-title">Identidade visual</h3>
                      <p className="cb-settings-panel-sub">Logótipo no menu, portal do cliente e comunicações</p>
                    </div>
                  </div>
                  <FirmLogoSettingsCard readOnly={!canEditLogo} showContextPreview />
                </section>
              ) : null}

              {activeTab === 'escritorio' ? (
                <FirmSettingsFirmSection bundle={bundle} onUpdated={onUpdated} />
              ) : null}

              {activeTab === 'perfil' ? (
                <FirmSettingsProfileSection bundle={bundle} onUpdated={onUpdated} />
              ) : null}

              {activeTab === 'equipa' ? <FirmSettingsTeamSection bundle={bundle} /> : null}

              {activeTab === 'notificacoes' ? <FirmSettingsNotificationsSection /> : null}

              {activeTab === 'encerrar' ? <FirmSettingsDangerZone bundle={bundle} /> : null}
            </div>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Não foi possível carregar as configurações.</p>
        )}
      </div>
    </FirmScrollPage>
  )
}
