import { useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ArrowLeft, Briefcase, CalendarCheck, Clock, MessageSquare } from 'lucide-react'
import { toast } from 'sonner'

import { ClientBookingPanel } from '@/features/client/ClientBookingPanel'
import { clusterPortalServices } from '@/features/client/clusterPortalServices'
import { getClientHubCopy, toClientHubLocale } from '@/features/client/clientHubI18n'
import { AskMayaButton } from '@/features/maya'
import { PageHeader } from '@/shared/components/portal-cliente/PageHeader'
import { SafeImage } from '@/shared/components/ui/SafeImage'
import { Button } from '@/shared/components/ui/button'
import { Skeleton } from '@/shared/design-system'
import { isContabilMode } from '@/shared/config/productMode'
import { clientPortalContabilApi } from '@/infrastructure/api'
import { getInitialAppLocale } from '@/shared/i18n/appLocale'
import type { AccountingService } from '@/shared/types/contabil'
import { getErrorMessage } from '@/shared/utils/errors'

function formatEuro(cents: number) {
  return new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(cents / 100)
}

function requestBodyFor(service: AccountingService) {
  return `Gostaria de pedir o serviço «${service.name}». Podem indicar os próximos passos?`
}

export function ClientServicesPage() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const locale = useMemo(
    () => (isContabilMode() ? 'pt-PT' : toClientHubLocale(getInitialAppLocale())),
    [],
  )
  const t = useMemo(() => getClientHubCopy(locale), [locale])
  const [requestingId, setRequestingId] = useState<string | null>(null)

  const bookId = searchParams.get('book') || ''

  const servicesQuery = useQuery({
    queryKey: ['client', 'booking-services'],
    queryFn: () => clientPortalContabilApi.listBookingServices() as Promise<{ items?: AccountingService[] }>,
    staleTime: 60_000,
  })

  const items = (servicesQuery.data?.items || []).filter((s) => s.isActive !== false)
  const clusters = clusterPortalServices(items)
  const bookingService = items.find((s) => s.id === bookId) || null

  async function requestService(service: AccountingService) {
    setRequestingId(service.id)
    try {
      await clientPortalContabilApi.sendMessage({ body: requestBodyFor(service) })
      toast.success('Pedido enviado ao escritório')
      navigate('/app/client/messages')
    } catch (err) {
      toast.error('Não foi possível enviar o pedido', { description: getErrorMessage(err) })
    } finally {
      setRequestingId(null)
    }
  }

  function openBooking(serviceId: string) {
    setSearchParams(
      (prev) => {
        const p = new URLSearchParams(prev)
        p.set('book', serviceId)
        return p
      },
      { replace: true },
    )
  }

  function closeBooking() {
    setSearchParams(
      (prev) => {
        const p = new URLSearchParams(prev)
        p.delete('book')
        return p
      },
      { replace: true },
    )
  }

  return (
    <div className="space-y-6" data-testid="client-services-page">
      {bookingService ? (
        <>
          <PageHeader
            title={`Agendar · ${bookingService.name}`}
            subtitle="Escolha um horário livre. Se não houver vaga, escreva ao escritório."
            actions={
              <Button type="button" variant="outline" className="rounded-full" onClick={closeBooking}>
                <ArrowLeft className="mr-1.5 h-4 w-4" />
                Voltar aos serviços
              </Button>
            }
          />
          <ClientBookingPanel t={t} initialServiceId={bookingService.id} />
        </>
      ) : (
        <>
          <PageHeader
            title="Serviços"
            subtitle="O que o seu escritório oferece. Agende um horário ou peça por mensagem."
            actions={<AskMayaButton intentId="portal-services" />}
          />

          {servicesQuery.isLoading ? (
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              <Skeleton className="h-40 rounded-2xl" />
              <Skeleton className="h-40 rounded-2xl" />
              <Skeleton className="h-40 rounded-2xl" />
            </div>
          ) : null}

          {!servicesQuery.isLoading && items.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border bg-card/70 px-5 py-10 text-center">
              <Briefcase className="mx-auto h-8 w-8 text-muted-foreground/70" />
              <p className="mt-3 font-display text-lg font-semibold text-foreground">Ainda sem serviços neste portal</p>
              <p className="mt-1 text-sm text-muted-foreground">
                O escritório ainda não publicou o catálogo aqui. Escreva à equipa se precisar de alguma coisa.
              </p>
              <Button type="button" className="mt-4 rounded-full" onClick={() => navigate('/app/client/messages')}>
                <MessageSquare className="mr-1.5 h-4 w-4" />
                Enviar mensagem
              </Button>
            </div>
          ) : null}

          {clusters.map((cluster, index) => (
            <details
              key={cluster.heading || `ungrouped-${index}`}
              className="group rounded-2xl border border-border/60 bg-card/60 open:bg-card"
              open={index === 0 || clusters.length <= 2}
            >
              <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 marker:content-none">
                <h2 className="font-display text-base font-semibold text-foreground">
                  {cluster.heading
                    ? cluster.heading
                    : clusters.length > 1
                      ? 'Outros serviços'
                      : 'Catálogo'}
                </h2>
                <span className="text-xs font-medium tabular-nums text-muted-foreground">
                  {cluster.items.length} {cluster.items.length === 1 ? 'serviço' : 'serviços'}
                </span>
              </summary>
              <div className="grid gap-3 px-4 pb-4 sm:grid-cols-2 xl:grid-cols-3">
                {cluster.items.map((service) => (
                  <article key={service.id} className="pc-service-card">
                    {service.imageUrl ? (
                      <SafeImage
                        src={service.imageUrl}
                        alt=""
                        className="mb-3 h-28 w-full rounded-xl object-cover"
                      />
                    ) : (
                      <span className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-brand/10 text-brand">
                        <Briefcase className="h-5 w-5" aria-hidden />
                      </span>
                    )}
                    <h3 className="font-display text-base font-semibold text-foreground">{service.name}</h3>
                    {service.description ? (
                      <p className="mt-1 line-clamp-3 text-sm leading-relaxed text-muted-foreground">
                        {service.description}
                      </p>
                    ) : null}
                    <p className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
                      {service.durationMinutes ? (
                        <span className="inline-flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {service.durationMinutes} min
                        </span>
                      ) : null}
                      {service.priceCents ? <span>{formatEuro(service.priceCents)}</span> : null}
                    </p>
                    <div className="mt-auto flex flex-wrap gap-2 pt-4">
                      {service.requiresBooking !== false ? (
                        <Button
                          type="button"
                          size="sm"
                          className="rounded-full"
                          onClick={() => openBooking(service.id)}
                        >
                          <CalendarCheck className="mr-1 h-3.5 w-3.5" />
                          Agendar
                        </Button>
                      ) : null}
                      <Button
                        type="button"
                        size="sm"
                        variant={service.requiresBooking === false ? 'primary' : 'outline'}
                        className="rounded-full"
                        disabled={requestingId === service.id}
                        onClick={() => void requestService(service)}
                      >
                        <MessageSquare className="mr-1 h-3.5 w-3.5" />
                        {requestingId === service.id ? 'A enviar…' : 'Pedir'}
                      </Button>
                    </div>
                  </article>
                ))}
              </div>
            </details>
          ))}
        </>
      )}
    </div>
  )
}
