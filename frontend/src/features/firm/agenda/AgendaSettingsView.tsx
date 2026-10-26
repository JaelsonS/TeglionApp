import { ArrowRight, CalendarClock, CalendarDays, CheckCircle2, Clock3, Layers } from 'lucide-react'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'

import { AgendaAvailabilityPanel } from '@/features/firm/agenda/AgendaAvailabilityPanel'
import { AgendaServiceHoursPanel } from '@/features/firm/agenda/AgendaServiceHoursPanel'
import { GoogleCalendarIntegrationPanel } from '@/features/firm/agenda/GoogleCalendarIntegrationPanel'
import { contabilAccountingServicesApi, contabilConsultationsApi } from '@/infrastructure/api'
import { Button } from '@/shared/components/ui/button'
import { getErrorMessage } from '@/shared/utils/errors'
import type {
  AccountingService,
  BookingDateOverrides,
  BookingDaySchedule,
  FirmBookingSettings,
} from '@/shared/types/contabil'

type Props = {
  services: AccountingService[]
  servicesLoading: boolean
  booking: FirmBookingSettings | null
  schedule: BookingDaySchedule
  dateOverrides: NonNullable<FirmBookingSettings['dateOverrides']>
  slotMin: number
  horizon: number
  bookingTz: string
  onScheduleChange: (next: BookingDaySchedule) => void
  onDateOverridesChange: (next: NonNullable<FirmBookingSettings['dateOverrides']>) => void
  onSlotMin: (n: number) => void
  onHorizon: (n: number) => void
  onBookingTz: (tz: string) => void
  onSaveAvailability: () => void
  onReload: () => void | Promise<void>
}

const STEPS = [
  {
    id: 'agenda-horario-geral',
    n: 1,
    label: 'Horário geral',
    hint: 'Dias e horas do gabinete',
  },
  {
    id: 'agenda-por-servico',
    n: 2,
    label: 'Por serviço',
    hint: 'Excepções por oferta',
  },
  {
    id: 'agenda-servicos-gabinete',
    n: 3,
    label: 'Catálogo',
    hint: 'Criar / publicar serviços',
  },
  {
    id: 'agenda-google',
    n: 4,
    label: 'Google',
    hint: 'Sincronizar calendário',
  },
] as const

export function AgendaSettingsView(props: Props) {
  const bookable = props.services.filter((s) => s.isActive !== false && s.requiresBooking)
  const activeServices = props.services.filter((s) => s.isActive !== false).length

  async function persistDay(payload: {
    date: string
    dateOverrides: BookingDateOverrides
    servicePatches: Array<{ id: string; bookingOverrides: Partial<FirmBookingSettings> | null }>
  }) {
    const openDays = Object.keys(props.schedule)
      .map(Number)
      .filter((d) => (props.schedule[d] || []).length > 0)

    try {
      const res = (await contabilConsultationsApi.patchBookingSettings({
        slotMinutes: props.slotMin,
        horizonDays: props.horizon,
        schedule: props.schedule,
        dateOverrides: payload.dateOverrides || {},
        weekdays: openDays.sort((a, b) => a - b),
        leadTimeHours: props.booking?.leadTimeHours ?? 2,
        timezone: props.bookingTz,
      })) as { booking?: FirmBookingSettings }

      if (res.booking?.dateOverrides) {
        props.onDateOverridesChange(res.booking.dateOverrides)
      } else {
        props.onDateOverridesChange(payload.dateOverrides)
      }

      for (const patch of payload.servicePatches) {
        await contabilAccountingServicesApi.patch(patch.id, {
          bookingOverrides: patch.bookingOverrides,
        })
      }

      if (payload.servicePatches.length) {
        await props.onReload()
      }

      toast.success(
        payload.servicePatches.length
          ? `Dia ${payload.date} guardado (gabinete + ${payload.servicePatches.length} serviço(s)).`
          : `Dia ${payload.date} guardado no horário do gabinete.`,
      )
    } catch (err) {
      toast.error('Não foi possível guardar o dia', { description: getErrorMessage(err) })
      throw err
    }
  }

  return (
    <div className="cb-agenda-settings-view">
      <div className="cb-agenda-settings-intro">
        <p className="cb-agenda-settings-intro-title">Como ensinar o site a aceitar marcações</p>
        <ol className="cb-agenda-settings-intro-list">
          <li>
            <Clock3 className="h-3.5 w-3.5 shrink-0 text-brand" aria-hidden />
            Em baixo: <strong>horário semanal</strong>, excepções e duração do slot — depois Guarde.
          </li>
          <li>
            <CalendarClock className="h-3.5 w-3.5 shrink-0 text-brand" aria-hidden />
            Só use «por serviço» se uma oferta (ex. IRS) tiver horas diferentes do gabinete.
          </li>
          <li>
            <Layers className="h-3.5 w-3.5 shrink-0 text-brand" aria-hidden />
            Em <strong>Serviços</strong>, active «Exige agendamento» e publique — senão o visitante não vê slots.
          </li>
        </ol>
      </div>

      <nav className="cb-agenda-stepper" aria-label="Secções das definições de agenda">
        {STEPS.map((step) => (
          <a key={step.id} className="cb-agenda-stepper-item" href={`#${step.id}`}>
            <span className="cb-agenda-stepper-n">{step.n}</span>
            <span className="cb-agenda-stepper-label">
              <span className="block">{step.label}</span>
              <span className="cb-agenda-stepper-hint">{step.hint}</span>
            </span>
          </a>
        ))}
      </nav>

      <section id="agenda-horario-geral" className="scroll-mt-24">
        <div className="cb-agenda-settings-block-hd mb-3">
          <span className="cb-agenda-settings-block-icon">
            <Clock3 className="h-4 w-4" aria-hidden />
          </span>
          <div>
            <h3 className="cb-agenda-settings-block-title">1. Horário geral do gabinete</h3>
            <p className="cb-agenda-settings-block-sub">
              Base para a página pública e o portal do cliente. Guarde no fim desta secção.
            </p>
          </div>
        </div>
        <AgendaAvailabilityPanel
          booking={props.booking}
          schedule={props.schedule}
          onScheduleChange={props.onScheduleChange}
          dateOverrides={props.dateOverrides}
          onDateOverridesChange={props.onDateOverridesChange}
          slotMin={props.slotMin}
          horizon={props.horizon}
          bookingTz={props.bookingTz}
          onSlotMin={props.onSlotMin}
          onHorizon={props.onHorizon}
          onBookingTz={props.onBookingTz}
          onSaveAvailability={props.onSaveAvailability}
          bookableServices={bookable}
          onPersistDay={persistDay}
        />
      </section>

      <section id="agenda-por-servico" className="cb-agenda-settings-block scroll-mt-24 mt-6">
        <div className="cb-agenda-settings-block-hd">
          <span className="cb-agenda-settings-block-icon">
            <CalendarClock className="h-4 w-4" aria-hidden />
          </span>
          <div>
            <h3 className="cb-agenda-settings-block-title">2. Disponibilidade por serviço</h3>
            <p className="cb-agenda-settings-block-sub">
              Opcional. Use só se um serviço (ex.: IRS) tiver horários diferentes do geral. Cada
              serviço guarda à parte.
            </p>
          </div>
        </div>
        {bookable.length === 0 && !props.servicesLoading ? (
          <div className="cb-agenda-settings-empty">
            <p className="text-sm text-muted-foreground">
              Ainda não há serviços com marcação activa. Active «requer marcação» no editor do
              serviço em Serviços.
            </p>
            <Link to="/app/firm/services">
              <Button type="button" size="sm" variant="outline" className="mt-3">
                Ir para Serviços <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
              </Button>
            </Link>
          </div>
        ) : (
          <AgendaServiceHoursPanel
            services={props.services}
            servicesLoading={props.servicesLoading}
            onReload={props.onReload}
            firmSchedule={props.schedule}
          />
        )}
      </section>

      <div className="cb-agenda-settings-lower mt-4">
        <section id="agenda-servicos-gabinete" className="cb-agenda-settings-block scroll-mt-24">
          <div className="cb-agenda-settings-block-hd">
            <span className="cb-agenda-settings-block-icon">
              <Layers className="h-4 w-4" aria-hidden />
            </span>
            <div>
              <h3 className="cb-agenda-settings-block-title">3. Catálogo de serviços</h3>
              <p className="cb-agenda-settings-block-sub">
                Criar, editar e publicar ofertas fica em Serviços — não nesta página.
              </p>
            </div>
          </div>
          <div className="cb-agenda-settings-cta">
            <div className="min-w-0">
              <p className="text-sm font-medium text-foreground">
                {props.services.length > 0
                  ? `${activeServices} de ${props.services.length} serviço(s) activo(s)`
                  : 'Ainda sem serviços configurados'}
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {bookable.length > 0
                  ? `${bookable.length} com marcação online.`
                  : 'Active marcação no editor do serviço para aparecer na agenda pública.'}
              </p>
            </div>
            <Link to="/app/firm/services">
              <Button type="button" size="sm">
                Ir para Serviços <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
              </Button>
            </Link>
          </div>
        </section>

        <section id="agenda-google" className="cb-agenda-settings-block scroll-mt-24">
          <div className="cb-agenda-settings-block-hd">
            <span className="cb-agenda-settings-block-icon">
              <CalendarDays className="h-4 w-4" aria-hidden />
            </span>
            <div>
              <h3 className="cb-agenda-settings-block-title">4. Google Calendar</h3>
              <p className="cb-agenda-settings-block-sub">
                Opcional. Sincronize marcações do Teglion com o Google Calendar da equipa.
              </p>
            </div>
          </div>
          <GoogleCalendarIntegrationPanel />
        </section>
      </div>

      <p className="cb-agenda-settings-foot">
        <CheckCircle2 className="mr-1.5 inline h-3.5 w-3.5 text-emerald-600" aria-hidden />
        Distinto do Calendário fiscal (prazos AT) e de Tarefas → Calendário (operações internas).
      </p>
    </div>
  )
}
