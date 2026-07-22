import { useCallback, useEffect, useMemo, useState } from 'react'
import { Calendar, CheckCircle2, Clock, Euro } from 'lucide-react'
import { toast } from 'sonner'

import type { getClientHubCopy } from '@/features/client/clientHubI18n'
import { useClientPortalHub } from '@/shared/hooks/queries/useClientPortalHub'
import { clientPortalContabilApi } from '@/infrastructure/api'
import type { AccountingService, Consultation, FirmBookingSettings } from '@/shared/types/contabil'
import { formatDateTime } from '@/shared/utils/date'
import { getErrorMessage } from '@/shared/utils/errors'
import { cn } from '@/shared/lib/utils'
import { Button } from '@/shared/components/ui/button'
import { SkeletonCard } from '@/shared/design-system/Skeleton'

function formatSlot(iso: string, timezone?: string) {
  return new Intl.DateTimeFormat('pt-PT', {
    timeZone: timezone || 'Europe/Lisbon',
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(iso))
}

function formatEuro(cents: number) {
  return new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(cents / 100)
}

export function ClientBookingPanel({ t }: { t: ReturnType<typeof getClientHubCopy> }) {
  const hubQuery = useClientPortalHub()
  const upcoming = hubQuery.data?.upcomingConsultations || []

  const [services, setServices] = useState<AccountingService[]>([])
  const [loadingServices, setLoadingServices] = useState(true)
  const [serviceId, setServiceId] = useState('')
  const [slots, setSlots] = useState<string[]>([])
  const [bookingMeta, setBookingMeta] = useState<FirmBookingSettings | null>(null)
  const [loadingSlots, setLoadingSlots] = useState(false)
  const [booking, setBooking] = useState(false)
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null)

  const selectedService = useMemo(
    () => services.find((s) => s.id === serviceId) || null,
    [services, serviceId],
  )

  const loadServices = useCallback(async () => {
    setLoadingServices(true)
    try {
      const res = (await clientPortalContabilApi.listBookingServices()) as { items?: AccountingService[] }
      const items = (res.items || []).filter((s) => s.isActive !== false)
      setServices(items)
      if (items.length) setServiceId((prev) => prev || items[0].id)
    } catch (err) {
      toast.error('Não foi possível carregar serviços', { description: getErrorMessage(err) })
    } finally {
      setLoadingServices(false)
    }
  }, [])

  const loadSlots = useCallback(async (sid: string) => {
    if (!sid) return
    setLoadingSlots(true)
    setSelectedSlot(null)
    try {
      const from = new Date().toISOString()
      const to = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
      const res = (await clientPortalContabilApi.listBookingSlots({ serviceId: sid, from, to })) as {
        slots?: string[]
        booking?: FirmBookingSettings
      }
      setSlots(res.slots || [])
      setBookingMeta(res.booking || null)
    } catch (err) {
      setSlots([])
      toast.error('Não foi possível carregar horários', { description: getErrorMessage(err) })
    } finally {
      setLoadingSlots(false)
    }
  }, [])

  useEffect(() => {
    void loadServices()
  }, [loadServices])

  useEffect(() => {
    if (serviceId) void loadSlots(serviceId)
  }, [serviceId, loadSlots])

  async function confirmBooking() {
    if (!serviceId || !selectedSlot) return
    setBooking(true)
    try {
      await clientPortalContabilApi.bookConsultation({ serviceId, scheduledAt: selectedSlot })
      toast.success(t.booking.reserved)
      setSelectedSlot(null)
      void loadSlots(serviceId)
      void hubQuery.refetch()
    } catch (err) {
      toast.error(t.booking.confirmError, { description: getErrorMessage(err) })
    } finally {
      setBooking(false)
    }
  }

  if (loadingServices) {
    return (
      <div className="space-y-3">
        <SkeletonCard />
        <SkeletonCard />
      </div>
    )
  }

  if (!services.length) {
    return (
      <div className="cb-card-padded text-center">
        <Calendar className="mx-auto h-10 w-10 text-muted-foreground/60" />
        <p className="mt-3 text-sm text-muted-foreground">{t.booking.emptyServices}</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {upcoming.length > 0 ? (
        <section className="cb-card-padded">
          <h2 className="cb-text-label">{t.booking.myUpcoming}</h2>
          <ul className="mt-3 space-y-2">
            {upcoming.map((c: Consultation) => (
              <li
                key={c._id}
                className="flex items-center gap-3 rounded-xl border border-border/60 bg-muted/20 px-3 py-2.5 text-sm"
              >
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                <div className="min-w-0">
                  <p className="font-medium text-foreground">{c.title}</p>
                  <p className="text-xs text-muted-foreground">{formatDateTime(c.scheduledAt)}</p>
                </div>
              </li>
            ))}
          </ul>
        </section>
      ) : (
        <p className="text-sm text-muted-foreground">{t.booking.noMyUpcoming}</p>
      )}

      <section className="cb-card-padded space-y-4">
        <div>
          <label htmlFor="booking-service" className="cb-text-label">
            {t.booking.pickService}
          </label>
          <select
            id="booking-service"
            className="mt-2 w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm"
            value={serviceId}
            onChange={(e) => setServiceId(e.target.value)}
          >
            {services.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
                {s.priceCents ? ` — ${formatEuro(s.priceCents)}` : ''}
              </option>
            ))}
          </select>
          {selectedService?.description ? (
            <p className="mt-2 text-sm text-muted-foreground">{selectedService.description}</p>
          ) : null}
          {selectedService?.priceCents ? (
            <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
              <Euro className="h-3 w-3" />
              {t.booking.priceLabel}
            </p>
          ) : null}
        </div>

        <div>
          <h3 className="cb-text-label">{t.booking.slotsTitle}</h3>
          {loadingSlots ? (
            <p className="mt-3 text-sm text-muted-foreground">{t.booking.loadingSlots}</p>
          ) : slots.length === 0 ? (
            <p className="mt-3 text-sm text-muted-foreground">{t.booking.noSlots}</p>
          ) : (
            <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
              {slots.map((iso) => (
                <button
                  key={iso}
                  type="button"
                  className={cn(
                    'flex items-center gap-2 rounded-xl border px-3 py-2.5 text-left text-sm transition',
                    selectedSlot === iso
                      ? 'border-brand bg-brand/10 text-foreground'
                      : 'border-border/60 bg-muted/20 hover:border-brand/30',
                  )}
                  onClick={() => setSelectedSlot(iso)}
                >
                  <Clock className="h-3.5 w-3.5 shrink-0 text-brand" />
                  <span>{formatSlot(iso, bookingMeta?.timezone)}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        <Button
          className="w-full sm:w-auto"
          disabled={!selectedSlot || booking}
          onClick={() => void confirmBooking()}
        >
          {booking ? t.loading : 'Confirmar consultoria'}
        </Button>
      </section>
    </div>
  )
}
