import { useEffect, useState } from 'react'
import { CalendarClock, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

import { AgendaAvailabilityPanel } from '@/features/firm/agenda/AgendaAvailabilityPanel'
import {
  bookingOverridesPayload,
  defaultIntervalFromSchedule,
  hasCustomBookingHours,
  scheduleFromFirmBooking,
  scheduleFromServiceOverrides,
  summarizeBookingSchedule,
} from '@/features/firm/services/serviceBookingAvailability'
import { cloneBookingSchedule } from '@/features/firm/agenda/agendaCalendarUtils'
import { Checkbox } from '@/shared/components/ui/checkbox'
import { contabilConsultationsApi } from '@/infrastructure/api'
import { getErrorMessage } from '@/shared/utils/errors'
import type { BookingDaySchedule, FirmBookingSettings } from '@/shared/types/contabil'

type Props = {
  requiresBooking: boolean
  durationMinutes: number
  value: Partial<FirmBookingSettings> | null
  onChange: (next: Partial<FirmBookingSettings> | null) => void
}

export function ServiceBookingAvailabilitySection({
  requiresBooking,
  durationMinutes,
  value,
  onChange,
}: Props) {
  const enabled = hasCustomBookingHours(value)
  const [firmSchedule, setFirmSchedule] = useState<BookingDaySchedule>({})
  const [firmLoaded, setFirmLoaded] = useState(false)
  const [loadingFirm, setLoadingFirm] = useState(false)
  const [firmError, setFirmError] = useState<string | null>(null)

  const loadFirmSchedule = async (): Promise<BookingDaySchedule | null> => {
    if (firmLoaded) return firmSchedule
    setLoadingFirm(true)
    setFirmError(null)
    try {
      const res = (await contabilConsultationsApi.getBookingSettings()) as {
        booking?: FirmBookingSettings
      }
      const next = scheduleFromFirmBooking(res.booking ?? null)
      setFirmSchedule(next)
      setFirmLoaded(true)
      return next
    } catch (err) {
      const message = getErrorMessage(err)
      setFirmError(message)
      toast.error('Não foi possível carregar o horário geral do escritório', { description: message })
      return null
    } finally {
      setLoadingFirm(false)
    }
  }

  useEffect(() => {
    if (!requiresBooking) return
    void loadFirmSchedule()
    // Só no primeiro open com agendamento activo — o pai controla `value`.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [requiresBooking])

  const schedule = scheduleFromServiceOverrides(value, firmSchedule)

  const toggleEnabled = async (on: boolean) => {
    if (!on) {
      onChange(null)
      return
    }
    const seed = (await loadFirmSchedule()) ?? firmSchedule
    if (!seed || Object.keys(seed).length === 0) {
      if (!firmError) setFirmError('O escritório ainda não tem horário geral configurado.')
      return
    }
    onChange(bookingOverridesPayload(true, cloneBookingSchedule(seed)))
  }

  if (!requiresBooking) {
    return (
      <div
        className="rounded-xl border border-dashed border-brand/20 px-3 py-3 text-sm text-muted-foreground"
        data-testid="service-booking-availability-inactive"
      >
        Active «Exige agendamento» para definir dias e horários próprios deste serviço. Enquanto estiver
        desligado, o serviço não aparece na marcação pública.
      </div>
    )
  }

  return (
    <section
      className="space-y-3 rounded-xl border border-brand/15 bg-muted/10 p-4"
      data-testid="service-booking-availability"
      aria-labelledby="service-booking-availability-title"
    >
      <div>
        <h4
          id="service-booking-availability-title"
          className="flex items-center gap-2 text-sm font-semibold text-foreground"
        >
          <CalendarClock className="h-4 w-4 text-brand" aria-hidden />
          Disponibilidade para marcação
        </h4>
        <p id="service-booking-availability-help" className="mt-1 text-xs text-muted-foreground">
          Por padrão, este serviço utiliza o horário geral do escritório. Ative esta opção para definir
          dias e horários específicos em que este serviço pode ser marcado. A sessão dura {durationMinutes}{' '}
          min.
        </p>
      </div>

      <label className="flex items-start gap-2 text-sm">
        <Checkbox
          className="mt-0.5"
          checked={enabled}
          disabled={loadingFirm}
          aria-describedby="service-booking-availability-help"
          onCheckedChange={(checked: boolean | 'indeterminate') => {
            void toggleEnabled(Boolean(checked))
          }}
        />
        <span>
          <span className="font-medium">Personalizar horários deste serviço</span>
          <span className="mt-0.5 block text-xs text-muted-foreground">
            {enabled
              ? summarizeBookingSchedule(schedule) || 'Escolha pelo menos um dia.'
              : 'Usa o horário geral do escritório (Agenda → Definições).'}
          </span>
        </span>
      </label>

      {loadingFirm ? (
        <p className="flex items-center gap-2 text-xs text-muted-foreground" data-testid="service-booking-availability-loading">
          <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
          A carregar o horário geral do escritório…
        </p>
      ) : null}

      {firmError ? (
        <p className="text-xs text-destructive" role="alert" data-testid="service-booking-availability-error">
          {firmError}
        </p>
      ) : null}

      {enabled ? (
        <AgendaAvailabilityPanel
          booking={null}
          hideSaveButton
          showSlotSettings={false}
          defaultInterval={defaultIntervalFromSchedule(firmSchedule)}
          schedule={schedule}
          onScheduleChange={(next) => {
            onChange(bookingOverridesPayload(true, next))
          }}
          slotMin={30}
          horizon={14}
          bookingTz="Europe/Lisbon"
          onSlotMin={() => {}}
          onHorizon={() => {}}
          onBookingTz={() => {}}
          onSaveAvailability={() => {}}
        />
      ) : null}
    </section>
  )
}
