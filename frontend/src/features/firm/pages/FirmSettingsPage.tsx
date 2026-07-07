import { useCallback } from 'react'
import {
  Building2,
  CalendarCheck,
  ImageIcon,
  ReceiptText,
  Shield,
  User,
  Users,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'

import { FirmLogoSettingsCard } from '@/shared/components/contabil/FirmLogoSettingsCard'
import { FirmScrollPage } from '@/features/firm/FirmPageLayout'
import { firmSettingsApi } from '@/infrastructure/api/contabil/firmSettings'
import { FirmSettingsDangerZone } from '@/features/firm/settings/FirmSettingsDangerZone'
import { FirmSettingsFirmSection } from '@/features/firm/settings/FirmSettingsFirmSection'
import { FirmSettingsProfileSection } from '@/features/firm/settings/FirmSettingsProfileSection'
import { FirmSettingsTeamSection } from '@/features/firm/settings/FirmSettingsTeamSection'
import { PushNotificationSettings } from '@/shared/components/settings/PushNotificationSettings'
import { cn } from '@/shared/lib/utils'

const NAV = [
  { id: 'identidade', label: 'Identidade', icon: ImageIcon },
  { id: 'escritorio', label: 'Escritório', icon: Building2 },
  { id: 'perfil', label: 'O seu perfil', icon: User },
  { id: 'equipa', label: 'Equipa', icon: Users },
  { id: 'atalhos', label: 'Plano e agenda', icon: ReceiptText },
] as const

export function FirmSettingsPage() {
  const { data: bundle, isLoading, refetch } = useQuery({
    queryKey: ['firm-settings'],
    queryFn: () => firmSettingsApi.get(),
    staleTime: 30_000,
  })

  const onUpdated = useCallback(() => {
    void refetch()
  }, [refetch])

  const canEditLogo = bundle?.capabilities.canEditFirm ?? false

  return (
    <FirmScrollPage className="cb-settings-layout-page">
      <div className="cb-settings-page">
        <header className="cb-settings-page-hd">
          <h1 className="cb-settings-page-title">Definições</h1>
          <p className="cb-settings-page-sub">
            Identidade, dados do escritório, equipa e conta — estrutura preparada para novos módulos (faturação,
            integrações, permissões por departamento).
          </p>
        </header>

        {bundle ? (
          <nav className="cb-settings-nav" aria-label="Secções de configuração">
            {NAV.map((item) => {
              const Icon = item.icon
              return (
                <a key={item.id} href={`#${item.id}`} className="cb-settings-nav-link">
                  <Icon className="h-4 w-4 shrink-0" aria-hidden />
                  {item.label}
                </a>
              )
            })}
            {bundle.capabilities.canCloseAccount ? (
              <a href="#zona-perigo" className="cb-settings-nav-link cb-settings-nav-link--danger">
                <Shield className="h-4 w-4 shrink-0" aria-hidden />
                Encerrar conta
              </a>
            ) : null}
          </nav>
        ) : null}

        {isLoading ? (
          <div className="cb-settings-skeleton" aria-busy="true">
            <div className="h-32 animate-pulse rounded-xl bg-muted/50" />
            <div className="h-48 animate-pulse rounded-xl bg-muted/50" />
          </div>
        ) : bundle ? (
          <div className="cb-settings-sections">
            <section id="identidade" className="cb-settings-panel scroll-mt-24">
              <div className="cb-settings-panel-hd">
                <span className="cb-settings-panel-icon">
                  <ImageIcon className="h-4 w-4" aria-hidden />
                </span>
                <div>
                  <h2 className="cb-settings-panel-title">Identidade visual</h2>
                  <p className="cb-settings-panel-sub">Logótipo no menu, portal do cliente e comunicações</p>
                </div>
              </div>
              <FirmLogoSettingsCard readOnly={!canEditLogo} />
            </section>

            <FirmSettingsFirmSection bundle={bundle} onUpdated={onUpdated} />
            <FirmSettingsProfileSection bundle={bundle} onUpdated={onUpdated} />
            <FirmSettingsTeamSection bundle={bundle} />

            <section id="notificacoes" className="cb-settings-panel scroll-mt-24">
              <PushNotificationSettings scope="firm" />
            </section>

            <section id="atalhos" className="cb-settings-panel scroll-mt-24">
              <div className="cb-settings-panel-hd">
                <span className="cb-settings-panel-icon">
                  <ReceiptText className="h-4 w-4" aria-hidden />
                </span>
                <div>
                  <h2 className="cb-settings-panel-title">Plano e módulos</h2>
                  <p className="cb-settings-panel-sub">Subscrição e funcionalidades activas</p>
                </div>
              </div>
              <div className="cb-settings-links">
                <SettingsLinkCard
                  icon={ReceiptText}
                  title="Plano e subscrição"
                  description="Trial, preços e activação do plano TegLion"
                  to="/app/firm/billing"
                />
                <SettingsLinkCard
                  icon={CalendarCheck}
                  title="Agenda e consultorias"
                  description="Horários, dias de atendimento e catálogo de serviços"
                  to="/app/firm/agenda?panel=settings"
                />
              </div>
            </section>

            <FirmSettingsDangerZone bundle={bundle} />
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Não foi possível carregar as configurações.</p>
        )}
      </div>
    </FirmScrollPage>
  )
}

function SettingsLinkCard({
  icon: Icon,
  title,
  description,
  to,
}: {
  icon: typeof Building2
  title: string
  description: string
  to: string
}) {
  return (
    <Link to={to} className="cb-settings-link-card group">
      <span className="cb-settings-link-icon">
        <Icon className="h-5 w-5" aria-hidden />
      </span>
      <span className="min-w-0 flex-1">
        <span className="cb-settings-link-title">{title}</span>
        <span className="cb-settings-link-desc">{description}</span>
      </span>
      <span className={cn('text-muted-foreground transition group-hover:translate-x-0.5')} aria-hidden>
        →
      </span>
    </Link>
  )
}
