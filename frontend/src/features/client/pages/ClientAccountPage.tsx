import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Bell, LogOut, MessageSquare, UserRound } from 'lucide-react'

import { ClientPushOptIn } from '@/features/client/ClientPushOptIn'
import { useClientPortalContext } from '@/features/client/ClientPortalLayout'
import { AgencyCredit } from '@/shared/components/agency/AgencyCredit'
import { PwaInstallBanner } from '@/shared/components/pwa/PwaInstallBanner'
import { PageHeader } from '@/shared/components/portal-cliente/PageHeader'
import { Button } from '@/shared/components/ui/button'
import { useAuth } from '@/shared/hooks/useAuth'
import { BRAND } from '@/shared/config/brand'

export function ClientAccountPage() {
  const { user, logout } = useAuth()
  const { firm } = useClientPortalContext()
  const initials = useMemo(
    () => (user?.fullName || user?.email || '?').slice(0, 2).toUpperCase(),
    [user?.email, user?.fullName],
  )

  return (
    <div className="mx-auto max-w-xl space-y-6" data-testid="client-account-page">
      <PageHeader
        title="Conta"
        subtitle="Os seus dados neste portal e preferências do dispositivo"
      />

      <section className="cb-card-padded">
        <div className="flex items-start gap-4">
          <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-brand/10 text-base font-bold text-brand">
            {initials}
          </span>
          <div className="min-w-0 flex-1">
            <p className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              <UserRound className="h-3.5 w-3.5" aria-hidden />
              Cliente
            </p>
            <h2 className="mt-1 truncate font-display text-xl font-semibold text-foreground">
              {user?.fullName || 'Cliente'}
            </h2>
            <p className="truncate text-sm text-muted-foreground">{user?.email}</p>
            {firm?.name ? (
              <p className="mt-2 text-sm text-foreground">
                Escritório: <span className="font-medium">{firm.name}</span>
              </p>
            ) : null}
          </div>
        </div>
      </section>

      <section className="space-y-3">
        <p className="cb-text-label">Comunicação</p>
        <Button asChild variant="outline" className="h-auto w-full justify-start gap-3 rounded-2xl px-4 py-3">
          <Link to="/app/client/messages">
            <MessageSquare className="h-5 w-5 text-brand" aria-hidden />
            <span className="text-left">
              <span className="block text-sm font-semibold">Mensagens</span>
              <span className="block text-xs font-normal text-muted-foreground">
                Falar com o escritório dentro do {BRAND.name}
              </span>
            </span>
          </Link>
        </Button>
        <Button asChild variant="outline" className="h-auto w-full justify-start gap-3 rounded-2xl px-4 py-3">
          <Link to="/app/client/booking">
            <Bell className="h-5 w-5 text-brand" aria-hidden />
            <span className="text-left">
              <span className="block text-sm font-semibold">Agendar reunião</span>
              <span className="block text-xs font-normal text-muted-foreground">
                Pedir consultoria ou reunião com o escritório
              </span>
            </span>
          </Link>
        </Button>
      </section>

      <section className="space-y-3">
        <p className="cb-text-label">Dispositivo</p>
        <ClientPushOptIn />
        <PwaInstallBanner surface="client" />
      </section>

      <section className="cb-card-padded space-y-3">
        <AgencyCredit surface="client" className="text-left" />
        <Button
          type="button"
          variant="outline"
          className="w-full rounded-full text-destructive hover:text-destructive"
          onClick={() => void logout()}
        >
          <LogOut className="mr-2 h-4 w-4" aria-hidden />
          Terminar sessão
        </Button>
      </section>
    </div>
  )
}
