import { useCallback, useEffect, useMemo, useRef } from 'react'
import {
  AlertTriangle,
  Building2,
  CreditCard,
  Globe,
  HelpCircle,
  ImageIcon,
  Info,
  Shield,
  Lock,
  Tag,
  User,
  Users,
} from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { useSearchParams } from 'react-router-dom'

import { FirmLogoSettingsCard } from '@/shared/components/contabil/FirmLogoSettingsCard'
import { FirmBrandAccentSettingsCard } from '@/shared/components/contabil/FirmBrandAccentSettingsCard'
import { FirmScrollPage } from '@/features/firm/FirmPageLayout'
import { firmSettingsApi } from '@/infrastructure/api/contabil/firmSettings'
import { FirmSettingsDangerZone } from '@/features/firm/settings/FirmSettingsDangerZone'
import { FirmSettingsFirmSection } from '@/features/firm/settings/FirmSettingsFirmSection'
import { PublicSiteEditor } from '@/features/firm/public-site/PublicSiteEditor'
import { FirmSettingsProfileSection } from '@/features/firm/settings/FirmSettingsProfileSection'
import { FirmSettingsTeamSection } from '@/features/firm/settings/FirmSettingsTeamSection'
import { FirmSettingsTagsSection } from '@/features/firm/settings/FirmSettingsTagsSection'
import { FirmSettingsNotificationsSection } from '@/features/firm/settings/FirmSettingsNotificationsSection'
import { FirmSettingsSecuritySection } from '@/features/firm/settings/FirmSettingsSecuritySection'
import { FirmConnectPaymentsSection } from '@/features/firm/settings/FirmConnectPaymentsSection'
import { FirmAboutPanel, FirmHelpSupportPanel } from '@/features/firm/support/FirmSupportPanels'
import { AskMayaButton } from '@/features/maya'
import { PageHeader } from '@/shared/design-system'
import { cn } from '@/shared/lib/utils'

const TABS = [
  { id: 'identidade', label: 'Identidade', shortLabel: 'Logo', icon: ImageIcon, danger: false },
  { id: 'pagina-publica', label: 'Página pública', shortLabel: 'Página', icon: Globe, danger: false },
  { id: 'escritorio', label: 'Gabinete', shortLabel: 'Gabinete', icon: Building2, danger: false },
  { id: 'pagamentos', label: 'Receber dos clientes', shortLabel: 'Stripe', icon: CreditCard, danger: false },
  { id: 'perfil', label: 'O seu perfil', shortLabel: 'Perfil', icon: User, danger: false },
  { id: 'seguranca', label: 'Segurança', shortLabel: 'Segurança', icon: Lock, danger: false },
  { id: 'equipa', label: 'Equipa', shortLabel: 'Equipa', icon: Users, danger: false },
  { id: 'etiquetas', label: 'Etiquetas', shortLabel: 'Tags', icon: Tag, danger: false },
  { id: 'notificacoes', label: 'Notificações', shortLabel: 'Avisos', icon: Shield, danger: false },
  { id: 'ajuda', label: 'Ajuda e suporte', shortLabel: 'Ajuda', icon: HelpCircle, danger: false },
  { id: 'sobre', label: 'Sobre o Teglion', shortLabel: 'Sobre', icon: Info, danger: false },
  { id: 'encerrar', label: 'Encerrar conta', shortLabel: 'Encerrar', icon: AlertTriangle, danger: true },
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

  const legacyPublicSiteDeepLink =
    searchParams.get('coach') === '1' || searchParams.get('mayaSetup') === '1'

  useEffect(() => {
    if (!legacyPublicSiteDeepLink) return
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev)
        next.delete('mayaSetup')
        next.delete('coach')
        next.set('tab', 'pagina-publica')
        return next
      },
      { replace: true },
    )
  }, [legacyPublicSiteDeepLink, setSearchParams])

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

  const navRef = useRef<HTMLElement>(null)

  useEffect(() => {
    const nav = navRef.current
    if (!nav) return
    const active = nav.querySelector<HTMLElement>('[aria-current="page"]')
    active?.scrollIntoView({ inline: 'center', block: 'nearest', behavior: 'smooth' })
  }, [activeTab])

  useEffect(() => {
    try {
      window.localStorage.removeItem('teglion_settings_nav_collapsed')
    } catch {
      /* ignore */
    }
  }, [])

  const activeMeta = visibleTabs.find((tab) => tab.id === activeTab) || visibleTabs[0]

  return (
    <FirmScrollPage className="cb-settings-layout-page">
      <div className="cb-settings-page">
        <PageHeader
          title="Definições"
          subtitle="Doze áreas — cada separador explica o propósito em baixo. Página pública e Stripe Connect são produtos à parte do plano Teglion."
          testId="firm-settings-header"
          secondary={
            <AskMayaButton
              intentId={
                activeTab === 'pagina-publica'
                  ? 'public-page'
                  : activeTab === 'pagamentos'
                    ? 'payments'
                    : 'settings'
              }
            />
          }
        />

        {isLoading ? (
          <div className="cb-settings-skeleton" aria-busy="true">
            <div className="h-64 animate-pulse rounded-xl bg-muted/50" />
          </div>
        ) : bundle ? (
          <div className="cb-settings-hub cb-settings-hub--single">
            <nav ref={navRef} className="cb-settings-tabs" aria-label="Secções das Definições">
              {visibleTabs.map((item) => {
                const Icon = item.icon
                const active = item.id === activeTab
                return (
                  <button
                    key={item.id}
                    type="button"
                    data-tab={item.id}
                    className={cn(
                      'cb-settings-tab',
                      active && 'cb-settings-tab--active',
                      item.danger && 'cb-settings-tab--danger',
                    )}
                    aria-current={active ? 'page' : undefined}
                    onClick={() => setTab(item.id)}
                  >
                    <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden />
                    <span className="cb-settings-tab-label-full">{item.label}</span>
                    <span className="cb-settings-tab-label-short">{item.shortLabel}</span>
                    {item.id === 'equipa' && bundle.team?.length ? (
                      <span className="cb-settings-tab-badge">{bundle.team.length}</span>
                    ) : null}
                  </button>
                )
              })}
            </nav>

            <div
              className={cn(
                'cb-settings-hub-main',
                activeTab === 'pagina-publica' && 'cb-settings-hub-main--public-site',
              )}
            >
              <div className="cb-settings-hub-panel-hd">
                <div className="min-w-0">
                  <h2 className="cb-settings-hub-panel-title">{activeMeta.label}</h2>
                  <p className="cb-settings-hub-panel-sub">
                    {activeTab === 'identidade' &&
                      'Logótipo e cor de destaque — aparecem no menu do gabinete, portal do cliente e emails.'}
                    {activeTab === 'pagina-publica' &&
                      'Site teglion.com/… com serviços, marcação e contactos — edite secções, pré-visualize e publique quando estiver pronto.'}
                    {activeTab === 'escritorio' &&
                      'Razão social, morada, NIF e contactos — alimentam documentos, comunicações e dados legais da página pública.'}
                    {activeTab === 'pagamentos' &&
                      'Ligue Stripe Connect para cobranças online dos clientes — distinto da carteira (menu Pagamentos) e do plano SaaS (menu Plano).'}
                    {activeTab === 'perfil' &&
                      'Dados de login, palavra-passe e cofre pessoal de credenciais AT/SS (acesso protegido por MFA).'}
                    {activeTab === 'seguranca' &&
                      'MFA obrigatório por função, códigos de recuperação e políticas de acesso à app.'}
                    {activeTab === 'equipa' &&
                      'Convites, cargos e permissões — quem pode editar clientes, publicar ou gerir pagamentos.'}
                    {activeTab === 'etiquetas' &&
                      'Etiquetas reutilizáveis para clientes, leads, tarefas e equipa — filtros consistentes em toda a app.'}
                    {activeTab === 'notificacoes' &&
                      'Push e email: escolha o que recebe sobre documentos, mensagens, tarefas e pagamentos.'}
                    {activeTab === 'ajuda' &&
                      'Maya no produto, contactos AfDigital e atalhos para documentação — suporte humano em português.'}
                    {activeTab === 'sobre' &&
                      'Marca Teglion (produto AfDigital), versão da app e ligações legais — sem confundir com o seu gabinete.'}
                    {activeTab === 'encerrar' &&
                      'Exporte o que precisar antes — encerra o tenant e remove o acesso da equipa.'}
                  </p>
                </div>
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
                  <FirmBrandAccentSettingsCard
                    bundle={bundle}
                    readOnly={!canEditLogo}
                    onUpdated={onUpdated}
                  />
                </section>
              ) : null}

              {activeTab === 'pagina-publica' ? (
                <PublicSiteEditor bundle={bundle} onFirmUpdated={onUpdated} />
              ) : null}

              {activeTab === 'escritorio' ? (
                <FirmSettingsFirmSection bundle={bundle} onUpdated={onUpdated} />
              ) : null}

              {activeTab === 'pagamentos' ? <FirmConnectPaymentsSection /> : null}

              {activeTab === 'perfil' ? (
                <FirmSettingsProfileSection bundle={bundle} onUpdated={onUpdated} />
              ) : null}

              {activeTab === 'seguranca' ? <FirmSettingsSecuritySection /> : null}

              {activeTab === 'equipa' ? <FirmSettingsTeamSection bundle={bundle} /> : null}

              {activeTab === 'etiquetas' ? <FirmSettingsTagsSection /> : null}

              {activeTab === 'notificacoes' ? <FirmSettingsNotificationsSection /> : null}

              {activeTab === 'ajuda' ? <FirmHelpSupportPanel /> : null}

              {activeTab === 'sobre' ? <FirmAboutPanel /> : null}

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
