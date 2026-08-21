import { useMemo, useState } from 'react'
import type { FormChangeEvent } from '@/shared/types/react-events'
import { CalendarDays, Check, HelpCircle, Loader2, Pencil, Save, Search } from 'lucide-react'
import { toast } from 'sonner'
import { Link } from 'react-router-dom'

import { AgendaAvailabilityPanel } from '@/features/firm/agenda/AgendaAvailabilityPanel'
import { cloneBookingSchedule } from '@/features/firm/agenda/agendaCalendarUtils'
import { cloneDateOverrides } from '@/features/firm/agenda/bookingDateOverrides'
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
import { Input } from '@/shared/components/ui/input'
import { getErrorMessage } from '@/shared/utils/errors'
import { cn } from '@/shared/lib/utils'
import type {
  AccountingService,
  BookingDateOverrides,
  BookingDaySchedule,
} from '@/shared/types/contabil'

type Draft = {
  enabled: boolean
  schedule: BookingDaySchedule
  dateOverrides: BookingDateOverrides
}

type FilterKey = 'all' | 'general' | 'custom'

function draftFromService(service: AccountingService, firmSchedule: BookingDaySchedule): Draft {
  const enabled = hasCustomBookingHours(service.bookingOverrides)
  return {
    enabled,
    schedule: scheduleFromServiceOverrides(service.bookingOverrides, firmSchedule),
    dateOverrides: cloneDateOverrides(service.bookingOverrides?.dateOverrides),
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
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState<FilterKey>('all')

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
    const payload = bookingOverridesPayload(draft.enabled, draft.schedule, draft.dateOverrides)
    if (draft.enabled && (!payload || (payload.weekdays.length === 0 && !payload.dateOverrides))) {
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

  async function resetToGeneral(service: AccountingService) {
    setSavingId(service.id)
    try {
      await contabilAccountingServicesApi.patch(service.id, { bookingOverrides: null })
      toast.success(`«${service.name}» voltou ao horário geral do escritório.`)
      setDrafts((prev) => {
        const next = { ...prev }
        delete next[service.id]
        return next
      })
      setOpenId(null)
      await onReload()
    } catch (err) {
      toast.error('Não foi possível repor o horário geral', {
        description: getErrorMessage(err),
      })
    } finally {
      setSavingId(null)
    }
  }

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return bookable.filter((s) => {
      const draft = draftFor(s)
      if (filter === 'general' && draft.enabled) return false
      if (filter === 'custom' && !draft.enabled) return false
      if (q && !s.name.toLowerCase().includes(q)) return false
      return true
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps -- draftFor uses drafts/firmSchedule
  }, [bookable, query, filter, drafts, firmSchedule])

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
    <div className="cb-agenda-svc-layout" data-testid="agenda-service-hours">
      <div className="cb-agenda-svc-main">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e: FormChangeEvent) => setQuery(e.target.value)}
              placeholder="Pesquisar serviço…"
              className="h-10 rounded-xl pl-9"
              aria-label="Pesquisar serviço"
            />
          </div>
          <div className="flex flex-wrap gap-1.5" role="group" aria-label="Filtrar serviços">
            {(
              [
                { key: 'all' as const, label: 'Todos' },
                { key: 'general' as const, label: 'Horário geral' },
                { key: 'custom' as const, label: 'Horário próprio' },
              ] as const
            ).map((f) => (
              <button
                key={f.key}
                type="button"
                className={cn(
                  'rounded-full border px-3 py-1.5 text-xs font-semibold transition',
                  filter === f.key
                    ? 'border-[hsl(222_47%_16%)] bg-[hsl(222_47%_16%)] text-white'
                    : 'border-border/60 text-muted-foreground hover:border-sky-300',
                )}
                aria-pressed={filter === f.key}
                onClick={() => setFilter(f.key)}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        <div className="cb-agenda-svc-table mt-4">
          <div className="cb-agenda-svc-table-hd hidden sm:grid">
            <span>Serviço</span>
            <span>Estado</span>
            <span>Resumo</span>
            <span className="text-right">Acção</span>
          </div>
          {filtered.map((service) => {
            const draft = draftFor(service)
            const open = openId === service.id
            const duration = service.durationMinutes || 60
            const summary = draft.enabled
              ? summarizeBookingSchedule(draft.schedule) || 'Horário próprio'
              : 'Horário geral do escritório'
            return (
              <div key={service.id} className={cn('cb-agenda-svc-row', open && 'cb-agenda-svc-row-open')}>
                <div className="cb-agenda-svc-row-main">
                  <div>
                    <p className="font-medium text-foreground">{service.name}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground sm:hidden">{duration} min · {summary}</p>
                  </div>
                  <span
                    className={cn(
                      'cb-agenda-svc-pill',
                      draft.enabled ? 'cb-agenda-svc-pill-custom' : 'cb-agenda-svc-pill-general',
                    )}
                  >
                    {draft.enabled ? 'Horário próprio' : 'Horário geral'}
                  </span>
                  <p className="hidden text-xs text-muted-foreground sm:block">
                    {duration} min · {summary}
                  </p>
                  <div className="flex justify-end">
                    <Button
                      type="button"
                      size="sm"
                      variant={draft.enabled ? 'outline' : 'ghost'}
                      className="rounded-lg"
                      onClick={() => setOpenId(open ? null : service.id)}
                    >
                      {open ? 'Fechar' : draft.enabled ? 'Editar' : 'Personalizar'}
                    </Button>
                  </div>
                </div>
                {open ? (
                  <div className="cb-agenda-svc-expand">
                    <label className="flex items-start gap-2 text-sm">
                      <Checkbox
                        checked={draft.enabled}
                        onCheckedChange={(checked: boolean | 'indeterminate') => {
                          const on = Boolean(checked)
                          patchDraft(service.id, {
                            enabled: on,
                            schedule: on ? cloneBookingSchedule(firmSchedule) : draft.schedule,
                            dateOverrides: on ? draft.dateOverrides : {},
                          })
                        }}
                      />
                      <span>
                        <span className="font-medium">Personalizar horários deste serviço</span>
                        <span className="mt-0.5 block text-xs text-muted-foreground">
                          Por padrão herda o horário geral. Active para definir dias e excepções próprios.
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
                          dateOverrides={draft.dateOverrides}
                          onDateOverridesChange={(next) => patchDraft(service.id, { dateOverrides: next })}
                          slotMin={30}
                          horizon={14}
                          bookingTz="Europe/Lisbon"
                          onSlotMin={() => {}}
                          onHorizon={() => {}}
                          onBookingTz={() => {}}
                          onSaveAvailability={() => {}}
                        />
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <Button
                            type="button"
                            variant="ghost"
                            className="rounded-xl text-sky-700 hover:bg-sky-50 hover:text-sky-800"
                            disabled={savingId === service.id}
                            onClick={() => void resetToGeneral(service)}
                          >
                            Repor horário geral
                          </Button>
                          <Button
                            type="button"
                            className="rounded-xl bg-emerald-600 hover:bg-emerald-700"
                            disabled={savingId === service.id}
                            onClick={() => void saveService(service)}
                          >
                            {savingId === service.id ? (
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                              <Save className="mr-2 h-4 w-4" />
                            )}
                            Guardar
                          </Button>
                        </div>
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
          {filtered.length === 0 ? (
            <p className="px-3 py-6 text-center text-sm text-muted-foreground">Nenhum serviço neste filtro.</p>
          ) : null}
        </div>
        <div className="mt-3">
          <NonBookableHint count={others.length} />
        </div>
      </div>

      <aside className="cb-agenda-svc-help" aria-label="Como funciona">
        <div className="cb-agenda-svc-help-card">
          <div className="cb-agenda-svc-tip">
            <span className="cb-agenda-svc-tip-icon" aria-hidden>
              <HelpCircle className="h-3.5 w-3.5" />
            </span>
            <p>
              <span className="font-semibold text-foreground">Como funciona</span>
              <span className="mt-0.5 block">
                Defina a disponibilidade de cada serviço da sua agenda, independente do horário geral.
              </span>
            </p>
          </div>
          <div className="cb-agenda-svc-tip">
            <span className="cb-agenda-svc-tip-icon" aria-hidden>
              <CalendarDays className="h-3.5 w-3.5" />
            </span>
            <p>
              <span className="font-semibold text-foreground">Herda por defeito</span>
              <span className="mt-0.5 block">
                Cada serviço herda o horário geral do escritório até personalizar.
              </span>
            </p>
          </div>
          <div className="cb-agenda-svc-tip">
            <span className="cb-agenda-svc-tip-icon" aria-hidden>
              <Pencil className="h-3.5 w-3.5" />
            </span>
            <p>
              <span className="font-semibold text-foreground">Personalize só excepções</span>
              <span className="mt-0.5 block">
                Altere apenas quando o serviço precisa de dias ou horas diferentes.
              </span>
            </p>
          </div>
          <div className="cb-agenda-svc-tip">
            <span className="cb-agenda-svc-tip-icon" aria-hidden>
              <Check className="h-3.5 w-3.5" />
            </span>
            <p>
              <span className="font-semibold text-foreground">Marcações usam o serviço real</span>
              <span className="mt-0.5 block">
                Os clientes vêem e agendam com base nestes horários (incl. opções de uma oferta).
              </span>
            </p>
          </div>
          <div className="cb-agenda-svc-fase9">
            <div className="flex items-start gap-2">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-sky-600 text-white">
                <CalendarDays className="h-4 w-4" aria-hidden />
              </span>
              <div>
                <p className="text-sm font-semibold text-foreground">
                  Integração mais tarde{' '}
                  <span className="ml-1 rounded-md bg-sky-600 px-1.5 py-0.5 text-[10px] font-bold uppercase text-white">
                    Fase 9
                  </span>
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Vamos ligar ao Google Calendar numa fase futura.
                </p>
              </div>
            </div>
          </div>
        </div>
      </aside>
    </div>
  )
}
