import { Link, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { CalendarClock, Loader2 } from 'lucide-react'

import { contabilPublicApi } from '@/infrastructure/api'

function formatPrice(cents: number) {
  return (cents / 100).toLocaleString('pt-PT', { style: 'currency', currency: 'EUR' })
}

/**
 * Página pública unificada de um escritório — lista todos os serviços
 * publicados num único link partilhável (`/:firmSlug`), em vez de um link
 * por serviço. Convive com `/:firmSlug/servicos/:serviceSlug` — o
 * escritório escolhe qual link partilhar, ou os dois.
 */
export function FirmPublicServicesPage() {
  const { firmSlug = '' } = useParams()

  const query = useQuery({
    queryKey: ['public-firm-services', firmSlug],
    queryFn: () => contabilPublicApi.getPublicFirmServices(firmSlug),
    retry: false,
  })

  if (query.isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (query.isError || !query.data) {
    return (
      <div className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center px-4 text-center">
        <h1 className="text-lg font-semibold">Página não encontrada</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Verifique o link recebido — pode estar incompleto ou já não existir.
        </p>
      </div>
    )
  }

  const { firmName, items } = query.data

  return (
    <div className="mx-auto min-h-screen max-w-xl px-4 py-10">
      <header className="mb-6 space-y-1">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{firmName}</p>
        <h1 className="text-2xl font-bold">Os nossos serviços</h1>
        <p className="text-sm text-muted-foreground">Escolha o serviço que precisa para começar.</p>
      </header>

      {items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border/60 p-8 text-center text-sm text-muted-foreground">
          Ainda não há serviços disponíveis aqui.
        </div>
      ) : (
        <ul className="space-y-3">
          {items.map((s) => (
            <li key={s.slug}>
              <Link
                to={`/${encodeURIComponent(firmSlug)}/servicos/${encodeURIComponent(s.slug)}`}
                className="block rounded-2xl border border-border/50 bg-card p-5 shadow-sm transition hover:border-brand/40 hover:shadow-md"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h2 className="font-semibold">{s.name}</h2>
                    {s.description ? (
                      <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{s.description}</p>
                    ) : null}
                  </div>
                  <span className="shrink-0 text-sm font-semibold text-brand">{formatPrice(s.priceCents)}</span>
                </div>
                {s.requiresBooking ? (
                  <p className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
                    <CalendarClock className="h-3.5 w-3.5" /> {s.durationMinutes} min · com agendamento
                  </p>
                ) : null}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
