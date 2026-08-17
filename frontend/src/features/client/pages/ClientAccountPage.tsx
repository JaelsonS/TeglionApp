import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Bell, HelpCircle, LogOut, MessageSquare, Smartphone, UserRound } from 'lucide-react'

import { ClientPushOptIn } from '@/features/client/ClientPushOptIn'
import { useClientPortalContext } from '@/features/client/ClientPortalLayout'
import { AskMayaButton } from '@/features/maya'
import { PwaInstallBanner } from '@/shared/components/pwa/PwaInstallBanner'
import { PageHeader } from '@/shared/components/portal-cliente/PageHeader'
import { Button } from '@/shared/components/ui/button'
import { useAuth } from '@/shared/hooks/useAuth'

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
        title="Conta e ajuda"
        subtitle="O seu perfil neste portal, avisos no telemóvel, e a Maya."
        actions={<AskMayaButton intentId="portal-account" />}
      />

      <section className="cb-card-padded">
        <div className="flex items-start gap-4">
          <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-brand/10 font-display text-base font-bold text-brand">
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
        <p className="cb-text-label">Ajuda</p>
        <div className="rounded-2xl border border-brand/20 bg-gradient-to-br from-brand/[0.06] to-card p-4">
          <div className="flex items-start gap-3">
            <HelpCircle className="mt-0.5 h-5 w-5 text-brand" aria-hidden />
            <div className="min-w-0 flex-1">
              <p className="font-display text-sm font-semibold text-foreground">A Maya explica este portal</p>
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                Pedidos, serviços, prazos e mensagens — sem ver os seus documentos. Para o seu caso concreto, fale com
                o escritório.
              </p>
              <div className="mt-3">
                <AskMayaButton intentId="portal-maya" />
              </div>
            </div>
          </div>
        </div>
        <Button asChild variant="outline" className="h-auto w-full justify-start gap-3 rounded-2xl px-4 py-3">
          <Link to="/app/client/messages">
            <MessageSquare className="h-5 w-5 text-brand" aria-hidden />
            <span className="text-left">
              <span className="block text-sm font-semibold">Escrever ao escritório</span>
              <span className="block text-xs font-normal text-muted-foreground">
                A AfDigital opera o Teglion; a sua contabilidade é com o escritório.
              </span>
            </span>
          </Link>
        </Button>
        <Button asChild variant="outline" className="h-auto w-full justify-start gap-3 rounded-2xl px-4 py-3">
          <Link to="/app/client/services">
            <Bell className="h-5 w-5 text-brand" aria-hidden />
            <span className="text-left">
              <span className="block text-sm font-semibold">Pedir ou agendar um serviço</span>
              <span className="block text-xs font-normal text-muted-foreground">
                Catálogo do escritório, com horário ou por mensagem
              </span>
            </span>
          </Link>
        </Button>
      </section>

      <section className="space-y-3">
        <p className="cb-text-label">Neste dispositivo</p>
        <div className="rounded-2xl border border-border/70 bg-card p-4">
          <p className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <Smartphone className="h-4 w-4 text-brand" aria-hidden />
            Notificações e atalho
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Receba avisos no telemóvel e, se quiser, instale o portal no ecrã inicial.
          </p>
          <div className="mt-3 space-y-3">
            <ClientPushOptIn />
            <PwaInstallBanner surface="client" />
          </div>
        </div>
      </section>

      <section className="cb-card-padded space-y-3">
        <p className="text-xs leading-relaxed text-muted-foreground">
          Teglion é o produto. A AfDigital — Soluções Tecnológicas desenvolve e opera a plataforma. O contrato e os
          dados fiscais são com o seu escritório.
        </p>
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
