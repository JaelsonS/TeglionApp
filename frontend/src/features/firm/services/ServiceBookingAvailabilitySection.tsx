import { useEffect, useState } from 'react'
import { CalendarClock, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

import { AgendaAvailabilityPanel } from '@/features/firm/agenda/AgendaAvailabilityPanel'
import { cloneDateOverrides } from '@/features/firm/agenda/bookingDateOverrides'
import {
  defaultIntervalFromSchedule,
  hasCustomBookingHours,
  patchServiceBookingOverrides,
  scheduleFromFirmBooking,
  scheduleFromServiceOverrides,
  summarizeBookingSchedule,
} from '@/features/firm/services/serviceBookingAvailability'
import { cloneBookingSchedule } from '@/features/firm/agenda/agendaCalendarUtils'
import { contabilConsultationsApi } from '@/infrastructure/api'
import { getErrorMessage } from '@/shared/utils/errors'
import { cn } from '@/shared/lib/utils'
import type { BookingDaySchedule, FirmBookingSettings } from '@/shared/types/contabil'

type Props = {
  requiresBooking: boolean
  durationMinutes: number
  value: Partial<FirmBookingSettings> | null
  onChange: (next: Partial<FirmBookingSettings> | null) => void
}

type AvailabilityMode = 'inherit' | 'custom'

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
  const dateOverrides = cloneDateOverrides(value?.dateOverrides)

  const setMode = async (mode: AvailabilityMode) => {
    if (mode === 'inherit') {
      onChange(null)
      return
    }
    const seed = (await loadFirmSchedule()) ?? firmSchedule
    if (!seed || Object.keys(seed).length === 0) {
      if (!firmError) setFirmError('O escritório ainda não tem horário geral configurado.')
      return
    }
    onChange(patchServiceBookingOverrides(value, { schedule: cloneBookingSchedule(seed) }, seed))
  }

  if (!requiresBooking) {
    return (
      <div
        className="rounded-xl border border-dashed border-brand/20 px-3 py-3 text-sm text-muted-foreground"
        data-testid="service-booking-availability-inactive"
      >
        Active «Exige agendamento» para definir quando este serviço pode ser marcado. Enquanto estiver
        desligado, o serviço não aparece na marcação pública.
      </div>
    )
  }

  return (
    <section
      className="space-y-4 rounded-xl border border-brand/15 bg-muted/10 p-4"
      data-testid="service-booking-availability"
      aria-labelledby="service-booking-availability-title"
    >
      <div>
        <h4
          id="service-booking-availability-title"
          className="flex items-center gap-2 text-sm font-semibold text-foreground"
        >
          <CalendarClock className="h-4 w-4 text-brand" aria-hidden />
          Disponibilidade
        </h4>
        <p id="service-booking-availability-help" className="mt-1 text-xs text-muted-foreground">
          Quando este serviço pode ser agendado. A sessão dura {durationMinutes} min. Os horários entram em
          vigor assim que guardar o serviço — não é necessário republicar a página pública.
        </p>
      </div>

      <fieldset className="space-y-2" aria-describedby="service-booking-availability-help">
        <legend className="sr-only">Modo de disponibilidade do serviço</legend>
        <div className="grid gap-2 sm:grid-cols-2" role="radiogroup" aria-label="Disponibilidade do serviço">
          {(
            [
              {
                mode: 'inherit' as const,
                title: 'Usar horário do escritório',
                description: 'Este serviço seguirá os horários definidos na Agenda.',
              },
              {
                mode: 'custom' as const,
                title: 'Personalizar horário deste serviço',
                description: enabled
                  ? summarizeBookingSchedule(schedule) || 'Escolha pelo menos um dia.'
                  : 'Defina dias, horários e dias especiais só para este serviço.',
              },
            ] as const
          ).map((option) => {
            const selected = option.mode === 'custom' ? enabled : !enabled
            return (
              <button
                key={option.mode}
                type="button"
                role="radio"
                aria-checked={selected}
                disabled={loadingFirm && option.mode === 'custom'}
                className={cn(
                  'rounded-xl border px-3 py-2.5 text-left text-sm transition',
                  selected
                    ? 'border-brand bg-brand/[0.06] ring-1 ring-brand/30'
                    : 'border-border/60 bg-card hover:border-brand/30',
                )}
                onClick={() => {
                  void setMode(option.mode)
                }}
              >
                <span className="font-medium text-foreground">{option.title}</span>
                <span className="mt-0.5 block text-xs text-muted-foreground">{option.description}</span>
              </button>
            )
          })}
        </div>
      </fieldset>

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

      {!enabled ? (
        <p className="rounded-lg border border-dashed border-border/60 bg-card/50 px-3 py-2 text-xs text-muted-foreground">
          O horário do escritório é o padrão definido em Agenda → Definições. Use «Personalizar» apenas se este
          serviço precisar de dias ou horas diferentes.
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
            onChange(patchServiceBookingOverrides(value, { schedule: next }, firmSchedule))
          }}
          dateOverrides={dateOverrides}
          onDateOverridesChange={(next) => {
            onChange(patchServiceBookingOverrides(value, { dateOverrides: next }, firmSchedule))
          }}
          slotMin={30}
          horizon={14}
          bookingTz="Europe/Lisbon"
          onSlotMin={() => {}}
          onHorizon={() => {}}
          onBookingTz={() => {}}
          onSaveAvailability={() => {}}
          weeklyTitle="Horário semanal"
          weeklySubtitle="Define o horário normal deste serviço, dia a dia."
          exceptionsTitle="Dias especiais"
          exceptionsSubtitle="Algum dia com horário diferente ou fechado? Os dias especiais substituem o horário normal somente nessa data."
        />
      ) : null}
    </section>
  )
}
