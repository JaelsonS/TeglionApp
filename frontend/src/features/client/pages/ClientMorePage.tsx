import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'

import { CLIENT_NAV_MORE, clientNavBadgeFor } from '@/features/client/clientPortalNav'
import { useClientNavBadges } from '@/features/client/useClientNavBadges'
import { AskMayaButton } from '@/features/maya'
import { AgencyCredit } from '@/shared/components/agency/AgencyCredit'
import { PageHeader } from '@/shared/components/portal-cliente/PageHeader'
import { cn } from '@/shared/lib/utils'

export function ClientMorePage() {
  const badges = useClientNavBadges()

  return (
    <div className="mx-auto max-w-2xl space-y-6" data-testid="client-more-page">
      <PageHeader
        title="Mais"
        subtitle="Prazos, documentos, avisos e a sua conta — o que não cabe na barra principal."
        actions={<AskMayaButton intentId="portal-home" />}
      />

      <nav className="grid gap-2 sm:grid-cols-2" aria-label="Mais destinos do portal">
        {CLIENT_NAV_MORE.map((item) => {
          const Icon = item.icon
          const badge = clientNavBadgeFor(item, badges)
          return (
            <Link
              key={item.to}
              to={item.to}
              className="group flex items-center gap-3 rounded-2xl border border-border/70 bg-card p-4 shadow-[var(--cb-shadow-card)] transition hover:border-brand/30 hover:shadow-[var(--cb-shadow-elevated)]"
            >
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand/10 text-brand">
                <Icon className="h-5 w-5" strokeWidth={1.75} aria-hidden />
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-2">
                  <span className="font-display text-sm font-semibold text-foreground">{item.label}</span>
                  {badge ? (
                    <span className="rounded-full bg-red-500 px-1.5 py-0.5 text-[10px] font-bold text-white">
                      {badge > 9 ? '9+' : badge}
                    </span>
                  ) : null}
                </span>
                <span className="mt-0.5 block text-xs text-muted-foreground">
                  {item.to === '/app/client/agenda'
                    ? 'Em atraso, esta semana, mais tarde'
                    : item.to === '/app/client/documents'
                      ? 'Enviar e ver ficheiros do escritório'
                      : item.to === '/app/client/updates'
                        ? 'Alertas e novidades publicadas para si'
                        : 'Perfil, notificações, app e a Maya'}
                </span>
              </span>
              <ArrowRight className="h-4 w-4 text-muted-foreground transition group-hover:text-brand" />
            </Link>
          )
        })}
      </nav>

      <p className={cn('pt-4 text-center')}>
        <AgencyCredit surface="client" nameOnly />
      </p>
    </div>
  )
}
