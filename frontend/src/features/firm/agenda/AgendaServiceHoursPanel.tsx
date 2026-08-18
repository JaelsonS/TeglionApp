import { useMemo, useState } from 'react'
import { Loader2, Save } from 'lucide-react'
import { toast } from 'sonner'
import { Link } from 'react-router-dom'

import { AgendaAvailabilityPanel } from '@/features/firm/agenda/AgendaAvailabilityPanel'
import { cloneBookingSchedule } from '@/features/firm/agenda/agendaCalendarUtils'
import {
  bookingOverridesPayload,
  defaultIntervalFromSchedule,
  hasCustomBookingHours,
  scheduleFromServiceOverrides,
  summarizeBookingSchedule,
} from '@/features/firm/services/serviceBookingAvailability'
import { contabilAccountingServicesApi } from '@/infrastructure/api'
import { Button } from '@/shared/components/ui/button'
import { Checkbox } from '@/shared/components/ui/checkbox'
import { getErrorMessage } from '@/shared/utils/errors'
import type { AccountingService, BookingDaySchedule } from '@/shared/types/contabil'

type Draft = {
  enabled: boolean
  schedule: BookingDaySchedule
}

function draftFromService(service: AccountingService, firmSchedule: BookingDaySchedule): Draft {
  const enabled = hasCustomBookingHours(service.bookingOverrides)
  return {
    enabled,
    schedule: scheduleFromServiceOverrides(service.bookingOverrides, firmSchedule),
  }
}

type Props = {
  services: AccountingService[]
  servicesLoading: boolean
  onReload: () => void | Promise<void>
  firmSchedule: BookingDaySchedule
}

function NonBookableHint({ count }: { count: number }) {
  if (count <= 0) return null
  return (
    <p className="cb-agenda-nonbookable-hint" data-testid="agenda-nonbookable-hint">
      {count === 1
        ? '1 serviço do catálogo não exige marcação.'
        : `${count} serviços do catálogo não exigem marcação.`}{' '}
      Active a marcação em{' '}
      <Link to="/app/firm/services" className="font-medium text-brand hover:underline">
        Serviços
      </Link>{' '}
      se quiser horários próprios.
    </p>
  )
}

export function AgendaServiceHoursPanel({ services, servicesLoading, onReload, firmSchedule }: Props) {
  const bookable = useMemo(
    () => services.filter((s) => s.isActive !== false && s.requiresBooking),
    [services],
  )
  const others = useMemo(
    () => services.filter((s) => s.isActive !== false && !s.requiresBooking),
    [services],
  )

  const [drafts, setDrafts] = useState<Record<string, Draft>>({})
  const [savingId, setSavingId] = useState<string | null>(null)
  const [openId, setOpenId] = useState<string | null>(null)

  function draftFor(service: AccountingService): Draft {
    return drafts[service.id] ?? draftFromService(service, firmSchedule)
  }

  function patchDraft(id: string, patch: Partial<Draft>) {
    setDrafts((prev) => {
      const service = services.find((s) => s.id === id)
      const current = prev[id] ?? (service ? draftFromService(service, firmSchedule) : null)
      if (!current) return prev
      return { ...prev, [id]: { ...current, ...patch } }
    })
  }

  async function saveService(service: AccountingService) {
    const draft = draftFor(service)
    const payload = bookingOverridesPayload(draft.enabled, draft.schedule)
    if (draft.enabled && (!payload || payload.weekdays.length === 0)) {
      toast.error('Escolha pelo menos um dia para este serviço.')
      return
    }
    setSavingId(service.id)
    try {
      await contabilAccountingServicesApi.patch(service.id, { bookingOverrides: payload })
      toast.success(
        draft.enabled
          ? `Horários de «${service.name}» guardados.`
          : `«${service.name}» voltou ao horário geral do escritório.`,
      )
      setDrafts((prev) => {
        const next = { ...prev }
        delete next[service.id]
        return next
      })
      await onReload()
    } catch (err) {
      toast.error('Não foi possível guardar os horários deste serviço', {
        description: getErrorMessage(err),
      })
    } finally {
      setSavingId(null)
    }
  }

  if (servicesLoading) {
    return (
      <p className="text-sm text-muted-foreground" data-testid="agenda-service-hours-loading">
        A carregar serviços…
      </p>
    )
  }

  if (bookable.length === 0) {
    return (
      <div
        className="rounded-xl border border-dashed border-border/70 bg-muted/10 px-4 py-4 text-sm text-muted-foreground"
        data-testid="agenda-service-hours-empty"
      >
        <p>
          Ainda não há serviços com agendamento activo. Em Serviços, active «Exige agendamento» — depois
          volta aqui para definir os dias de cada um, ou herda o horário geral acima.
        </p>
        <Link to="/app/firm/services" className="mt-2 inline-block font-medium text-brand hover:underline">
          Ir para Serviços
        </Link>
        <div className="mt-3">
          <NonBookableHint count={others.length} />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-3" data-testid="agenda-service-hours">
      <p className="text-sm leading-relaxed text-muted-foreground">
        O horário geral é a predefinição. Personalize só os serviços que precisam de outros dias — por
        exemplo Consultoria à segunda e Acompanhamento à terça.
      </p>
      {bookable.map((service) => {
        const draft = draftFor(service)
        const open = openId === service.id
        const duration = service.durationMinutes || 60
        const label = draft.enabled ? 'custom' : 'inherited'
        const summary = draft.enabled ? summarizeBookingSchedule(draft.schedule) : 'Horário geral do escritório'
        return (
          <div key={service.id} className="cb-agenda-service-card">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-medium text-foreground">{service.name}</p>
                  <span
                    className={
                      label === 'custom'
                        ? 'rounded-full bg-brand/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-brand'
                        : 'rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground'
                    }
                  >
                    {label === 'custom' ? 'Horário próprio' : 'Horário geral'}
                  </span>
                </div>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {duration} min{summary ? ` · ${summary}` : ''}
                </p>
              </div>
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="rounded-full"
                onClick={() => setOpenId(open ? null : service.id)}
              >
                {open ? 'Fechar' : 'Configurar disponibilidade'}
              </Button>
            </div>
            {open ? (
              <div className="mt-4 space-y-4">
                <label className="flex items-start gap-2 text-sm">
                  <Checkbox
                    checked={draft.enabled}
                    onCheckedChange={(checked: boolean | 'indeterminate') => {
                      const on = Boolean(checked)
                      patchDraft(service.id, {
                        enabled: on,
                        schedule: on ? cloneBookingSchedule(firmSchedule) : draft.schedule,
                      })
                    }}
                  />
                  <span>
                    <span className="font-medium">Personalizar horários deste serviço</span>
                    <span className="mt-0.5 block text-xs text-muted-foreground">
                      Por padrão, este serviço utiliza o horário geral do escritório. Ative esta opção para
                      definir dias e horários específicos em que este serviço pode ser marcado.
                    </span>
                  </span>
                </label>
                {draft.enabled ? (
                  <>
                    <AgendaAvailabilityPanel
                      booking={null}
                      hideSaveButton
                      showSlotSettings={false}
                      defaultInterval={defaultIntervalFromSchedule(firmSchedule)}
                      schedule={draft.schedule}
                      onScheduleChange={(next) => patchDraft(service.id, { schedule: next })}
                      slotMin={30}
                      horizon={14}
                      bookingTz="Europe/Lisbon"
                      onSlotMin={() => {}}
                      onHorizon={() => {}}
                      onBookingTz={() => {}}
                      onSaveAvailability={() => {}}
                    />
                    <Button
                      type="button"
                      className="rounded-full"
                      disabled={savingId === service.id}
                      onClick={() => void saveService(service)}
                    >
                      {savingId === service.id ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Save className="mr-2 h-4 w-4" />
                      )}
                      Guardar horários de {service.name}
                    </Button>
                  </>
                ) : (
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm text-muted-foreground">
                      Sem horário próprio. Os clientes vêem os mesmos dias do horário geral.
                    </p>
                    {service.bookingOverrides ? (
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        disabled={savingId === service.id}
                        onClick={() => void saveService(service)}
                      >
                        Confirmar: usar horário geral
                      </Button>
                    ) : null}
                  </div>
                )}
              </div>
            ) : null}
          </div>
        )
      })}
      <NonBookableHint count={others.length} />
    </div>
  )
}
