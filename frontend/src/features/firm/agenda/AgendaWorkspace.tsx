import { useCallback, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { ChevronLeft, ChevronRight, Plus, Settings2 } from 'lucide-react'
import { toast } from 'sonner'

import { AgendaCalendarGrid } from '@/features/firm/agenda/AgendaCalendarGrid'
import { AgendaCreatePanel } from '@/features/firm/agenda/AgendaCreatePanel'
import { AgendaMonthGrid } from '@/features/firm/agenda/AgendaMonthGrid'
import { AgendaSettingsView } from '@/features/firm/agenda/AgendaSettingsView'
import { AgendaSidebar } from '@/features/firm/agenda/AgendaSidebar'
import { AgendaWeekGrid } from '@/features/firm/agenda/AgendaWeekGrid'
import {
  addDays,
  addMonths,
  consultationStatusLabel,
  dateRangeForView,
  formatNavLabel,
  normalizeAnchor,
  startOfDay,
  startOfWeekMonday,
  visibleAgendaItems,
  type AgendaViewMode,
} from '@/features/firm/agenda/agendaCalendarUtils'
import { Button } from '@/shared/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/shared/components/ui/dialog'
import { ConfirmDialog } from '@/shared/components/modals/ConfirmDialog'
import { AskMayaButton } from '@/features/maya'
import { PageHeader } from '@/shared/design-system'
import { cn } from '@/shared/lib/utils'
import { contabilConsultationsApi, contabilFirmApi } from '@/infrastructure/api'
import { useFirmClientsDirectory } from '@/shared/hooks/queries/useFirmClientsDirectory'
import { getErrorMessage } from '@/shared/utils/errors'
import type { AccountingService, BookingDaySchedule, Consultation, FirmBookingSettings } from '@/shared/types/contabil'

type Tab = 'calendar' | 'settings'

export function AgendaWorkspace() {
  const [searchParams, setSearchParams] = useSearchParams()
  const tab: Tab = searchParams.get('panel') === 'settings' ? 'settings' : 'calendar'

  const [view, setView] = useState<AgendaViewMode>('week')
  const [anchor, setAnchor] = useState(() => startOfWeekMonday(new Date()))
  const [items, setItems] = useState<Consultation[]>([])
  /** Próximas reuniões (14 dias) — independente da semana/mês no grelha. */
  const [upcomingItems, setUpcomingItems] = useState<Consultation[]>([])
  const clientsQuery = useFirmClientsDirectory({ limit: 500 })
  const clients = clientsQuery.data?.items || []
  const [selectedEvent, setSelectedEvent] = useState<Consultation | null>(null)
  const [confirmCancelEvent, setConfirmCancelEvent] = useState(false)
  const [cancellingEvent, setCancellingEvent] = useState(false)
  const [staff, setStaff] = useState<{ id: string; fullName?: string; email?: string }[]>([])
  const [services, setServices] = useState<AccountingService[]>([])
  const [booking, setBooking] = useState<FirmBookingSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [showForm, setShowForm] = useState(false)

  const [clientId, setClientId] = useState('')
  const [title, setTitle] = useState('Consulta fiscal')
  const [scheduledAt, setScheduledAt] = useState('')
  const [notes, setNotes] = useState('')
  const [selectedServiceId, setSelectedServiceId] = useState('')
  const [assigneeId, setAssigneeId] = useState('')

  const [slotMin, setSlotMin] = useState(30)
  const [horizon, setHorizon] = useState(14)
  const [bookingTz, setBookingTz] = useState('Europe/Lisbon')
  const [schedule, setSchedule] = useState<BookingDaySchedule>({
    1: [{ start: '09:00', end: '17:00' }],
    2: [{ start: '09:00', end: '17:00' }],
    3: [{ start: '09:00', end: '17:00' }],
    4: [{ start: '09:00', end: '17:00' }],
    5: [{ start: '09:00', end: '17:00' }],
  })
  const [dateOverrides, setDateOverrides] = useState<FirmBookingSettings['dateOverrides']>({})

  const range = useMemo(() => dateRangeForView(view, anchor), [view, anchor])

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const upcomingFrom = new Date().toISOString()
      const upcomingTo = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString()
      const [consRes, upcomingRes, cfgRes, staffRes] = await Promise.all([
        contabilConsultationsApi.list({ from: range.from, to: range.to }) as Promise<{
          items?: Consultation[]
        }>,
        contabilConsultationsApi.list({ from: upcomingFrom, to: upcomingTo }) as Promise<{
          items?: Consultation[]
        }>,
        contabilConsultationsApi.getBookingSettings() as Promise<{
          services?: AccountingService[]
          booking?: FirmBookingSettings
        }>,
        contabilFirmApi.listStaff() as Promise<{ items?: { id: string; fullName?: string; email?: string }[] }>,
      ])
      setItems(consRes.items || [])
      setUpcomingItems(upcomingRes.items || [])
      setStaff(staffRes.items || [])
      setServices(cfgRes.services || [])
      const b = cfgRes.booking
      if (b) {
        setBooking(b)
        setSlotMin(b.slotMinutes)
        setHorizon(b.horizonDays)
        setBookingTz(b.timezone && typeof b.timezone === 'string' ? b.timezone : 'Europe/Lisbon')
        if (b.schedule && Object.keys(b.schedule).length) {
          setSchedule(b.schedule)
        } else {
          const days = b.weekdays?.length ? b.weekdays : [1, 2, 3, 4, 5]
          const next: BookingDaySchedule = {}
          for (const d of days) next[d] = [{ start: b.dayStart || '09:00', end: b.dayEnd || '17:00' }]
          setSchedule(next)
        }
        setDateOverrides(b.dateOverrides || {})
      }
    } catch (err) {
      toast.error('Não foi possível carregar a agenda', { description: getErrorMessage(err) })
    } finally {
      setLoading(false)
    }
  }, [range.from, range.to])

  useEffect(() => {
    void load()
  }, [load])

  const clientName = useCallback(
    (item: Consultation) => {
      if (item.holderName) return item.holderName
      const c = clients.find((x) => x._id === item.clientId)
      return c?.fullName || c?.displayName || c?.name || 'Cliente'
    },
    [clients],
  )

  const staffName = useCallback(
    (id?: string | null) => {
      if (!id) return 'Equipa'
      const u = staff.find((x) => x.id === id)
      if (!u) return 'Equipa'
      const parts = (u.fullName || '').trim().split(/\s+/).filter(Boolean)
      if (parts.length >= 2) return `${parts[0][0]}. ${parts[parts.length - 1]}`
      return u.fullName || u.email || 'Equipa'
    },
    [staff],
  )

  const setTab = (next: Tab) => {
    setSearchParams(
      (prev) => {
        const p = new URLSearchParams(prev)
        if (next === 'settings') p.set('panel', 'settings')
        else p.delete('panel')
        return p
      },
      { replace: true },
    )
  }

  const goToday = () => setAnchor(normalizeAnchor(view, new Date()))

  const shift = (delta: number) => {
    setAnchor((a) => {
      const base = normalizeAnchor(view, a)
      if (view === 'day') return addDays(base, delta)
      if (view === 'month') return addMonths(base, delta)
      return addDays(base, delta * 7)
    })
  }

  const onChangeView = (v: AgendaViewMode) => {
    setView(v)
    setAnchor((a) => normalizeAnchor(v, a))
  }

  const pickDayFromMonth = (d: Date) => {
    setView('day')
    setAnchor(startOfDay(d))
  }

  const create = async () => {
    if (creating) return
    if (!clientId || !scheduledAt) {
      toast.error('Selecione cliente e data')
      return
    }
    setCreating(true)
    try {
      await contabilConsultationsApi.create({
        clientId,
        title,
        scheduledAt: new Date(scheduledAt).toISOString(),
        notes: notes || undefined,
        accountingServiceId: selectedServiceId || undefined,
        staffId: assigneeId || undefined,
      })
      toast.success('Evento agendado')
      setShowForm(false)
      await load()
    } catch (err) {
      toast.error('Erro ao agendar', { description: getErrorMessage(err) })
    } finally {
      setCreating(false)
    }
  }

  const openEvent = useCallback((ev: Consultation) => {
    setSelectedEvent(ev)
    const when = new Date(ev.scheduledAt)
    setView('day')
    setAnchor(startOfDay(when))
  }, [])

  const cancelSelectedEvent = async () => {
    if (!selectedEvent) return
    setCancellingEvent(true)
    try {
      await contabilConsultationsApi.update(selectedEvent._id, {
        status: 'CANCELLED',
        cancelReason: 'cancelled_by_firm',
      })
      toast.success('Agendamento cancelado')
      setConfirmCancelEvent(false)
      setSelectedEvent(null)
      await load()
    } catch (err) {
      toast.error('Erro ao cancelar', { description: getErrorMessage(err) })
    } finally {
      setCancellingEvent(false)
    }
  }

  const calendarItems = useMemo(() => visibleAgendaItems(items), [items])

  const saveAvailability = async () => {
    const openDays = Object.keys(schedule)
      .map(Number)
      .filter((d) => (schedule[d] || []).length > 0)
    if (openDays.length === 0) {
      toast.error('Seleccione pelo menos um dia de atendimento')
      return
    }
    try {
      const res = (await contabilConsultationsApi.patchBookingSettings({
        slotMinutes: slotMin,
        horizonDays: horizon,
        schedule,
        dateOverrides: dateOverrides || {},
        weekdays: openDays.sort((a, b) => a - b),
        leadTimeHours: booking?.leadTimeHours ?? 2,
        timezone: bookingTz,
      })) as { booking?: FirmBookingSettings }
      if (res.booking) setBooking(res.booking)
      toast.success('Disponibilidade guardada')
    } catch (err) {
      toast.error('Erro ao guardar', { description: getErrorMessage(err) })
    }
  }

  const staffForSidebar = staff.map((u) => ({ ...u, role: 'Equipa' }))
  const dayAnchor = normalizeAnchor('day', anchor)

  return (
    <div className="cb-agenda-page">
      <div className="cb-agenda-page-hd space-y-0">
        <div className="px-4 pt-4 sm:px-5">
          <PageHeader
            title="Agenda"
            subtitle="Marque reuniões, configure disponibilidade e sincronize com o Google Calendar — e a disponibilidade para agendamento na página pública."
            testId="firm-agenda-header"
            secondary={
              <AskMayaButton intentId="agenda" />
            }
            right={
              <>
                <Button
                  type="button"
                  variant={tab === 'settings' ? 'primary' : 'outline'}
                  size="sm"
                  onClick={() => setTab(tab === 'settings' ? 'calendar' : 'settings')}
                >
                  <Settings2 className="h-4 w-4" />
                  {tab === 'settings' ? 'Calendário' : 'Definições'}
                </Button>
                {tab === 'calendar' ? (
                  <Button type="button" size="sm" variant="primary" onClick={() => setShowForm(true)}>
                    <Plus className="h-4 w-4" />
                    Novo evento
                  </Button>
                ) : null}
              </>
            }
          />
        </div>

        {tab === 'calendar' ? (
          <div className="cb-agenda-toolbar">
            <div className="flex items-center gap-1">
              <Button type="button" variant="ghost" size="icon" className="h-8 w-8" aria-label="Período anterior" onClick={() => shift(-1)}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="min-w-[10rem] max-w-[18rem] truncate text-center text-xs font-medium capitalize text-foreground sm:min-w-[12rem] sm:text-sm">
                {formatNavLabel(view, normalizeAnchor(view, anchor))}
              </span>
              <Button type="button" variant="ghost" size="icon" className="h-8 w-8" aria-label="Período seguinte" onClick={() => shift(1)}>
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button type="button" variant="outline" size="sm" className="ml-1 h-8" onClick={goToday}>
                Hoje
              </Button>
            </div>

            <div className="cb-agenda-view-toggle" role="group" aria-label="Vista do calendário">
              {(['day', 'week', 'month'] as AgendaViewMode[]).map((v) => (
                <button
                  key={v}
                  type="button"
                  className={cn('cb-agenda-view-btn', view === v && 'cb-agenda-view-btn-active')}
                  onClick={() => onChangeView(v)}
                >
                  {v === 'day' ? 'Dia' : v === 'week' ? 'Semana' : 'Mês'}
                </button>
              ))}
            </div>
          </div>
        ) : null}
      </div>

      {tab === 'settings' ? (
        <AgendaSettingsView
          services={services}
          servicesLoading={loading}
          booking={booking}
          schedule={schedule}
          dateOverrides={dateOverrides || {}}
          slotMin={slotMin}
          horizon={horizon}
          bookingTz={bookingTz}
          onScheduleChange={setSchedule}
          onDateOverridesChange={setDateOverrides}
          onSlotMin={setSlotMin}
          onHorizon={setHorizon}
          onBookingTz={setBookingTz}
          onSaveAvailability={() => void saveAvailability()}
          onReload={load}
        />
      ) : (
        <div className="cb-agenda-body">
          {showForm ? (
            <div className="border-b border-border/60 p-4 sm:px-5">
              <AgendaCreatePanel
                clients={clients}
                services={services}
                clientId={clientId}
                onClientId={setClientId}
                selectedServiceId={selectedServiceId}
                onServiceId={setSelectedServiceId}
                title={title}
                onTitle={setTitle}
                scheduledAt={scheduledAt}
                onScheduledAt={setScheduledAt}
                notes={notes}
                onNotes={setNotes}
                submitting={creating}
                onSubmit={() => void create()}
                onClose={() => setShowForm(false)}
              />
            </div>
          ) : null}

          <div className="cb-agenda-main">
            {loading ? (
              <p className="p-8 text-sm text-muted-foreground">A carregar agenda…</p>
            ) : view === 'week' ? (
              <AgendaWeekGrid
                anchor={anchor}
                items={calendarItems}
                staffName={staffName}
                clientName={clientName}
                onSelectEvent={openEvent}
              />
            ) : view === 'day' ? (
              <AgendaCalendarGrid
                days={[dayAnchor]}
                items={calendarItems}
                staffName={staffName}
                clientName={clientName}
                onSelectEvent={openEvent}
              />
            ) : (
              <AgendaMonthGrid
                anchor={anchor}
                items={calendarItems}
                onSelectDay={pickDayFromMonth}
                onSelectEvent={openEvent}
              />
            )}
          </div>

          {view !== 'month' ? (
            <AgendaSidebar
              anchor={anchor}
              items={calendarItems}
              upcomingItems={visibleAgendaItems(upcomingItems)}
              staff={staffForSidebar}
              clientName={clientName}
              onPickDay={(d) => {
                setView('day')
                setAnchor(startOfDay(d))
              }}
              onSelectEvent={openEvent}
              onViewAllUpcoming={() => {
                setView('week')
                setAnchor(normalizeAnchor('week', new Date()))
              }}
              onViewAllTeam={() => setTab('settings')}
            />
          ) : null}
        </div>
      )}

      <Dialog open={Boolean(selectedEvent)} onOpenChange={(open: boolean) => !open && setSelectedEvent(null)}>
        <DialogContent className="sm:max-w-md" aria-describedby={undefined}>
          <DialogHeader>
            <DialogTitle>{selectedEvent?.title || 'Evento'}</DialogTitle>
          </DialogHeader>
          {selectedEvent ? (
            <div className="space-y-2 text-sm">
              <p>
                <span className="text-muted-foreground">Estado: </span>
                <span className="font-medium">{consultationStatusLabel(selectedEvent.status)}</span>
              </p>
              <p>
                <span className="text-muted-foreground">Quando: </span>
                {new Date(selectedEvent.scheduledAt).toLocaleString('pt-PT', {
                  weekday: 'long',
                  day: '2-digit',
                  month: 'long',
                  hour: '2-digit',
                  minute: '2-digit',
                  timeZone: 'Europe/Lisbon',
                })}
              </p>
              <p>
                <span className="text-muted-foreground">Cliente: </span>
                {clientName(selectedEvent)}
              </p>
              {selectedEvent.priceCents != null && selectedEvent.priceCents > 0 ? (
                <p>
                  <span className="text-muted-foreground">Valor: </span>
                  {(selectedEvent.priceCents / 100).toLocaleString('pt-PT', {
                    style: 'currency',
                    currency: selectedEvent.currency || 'EUR',
                  })}
                </p>
              ) : null}
              {selectedEvent.status === 'PENDING_PAYMENT' && selectedEvent.holdExpiresAt ? (
                <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-amber-950">
                  Reserva temporária até{' '}
                  {new Date(selectedEvent.holdExpiresAt).toLocaleString('pt-PT', {
                    hour: '2-digit',
                    minute: '2-digit',
                    day: '2-digit',
                    month: 'short',
                    timeZone: 'Europe/Lisbon',
                  })}
                  . Se o pagamento não for concluído, o horário é libertado.
                </p>
              ) : null}
              {selectedEvent.status === 'SCHEDULED' &&
              selectedEvent.priceCents != null &&
              selectedEvent.priceCents > 0 ? (
                <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-emerald-950">
                  Pagamento confirmado via Stripe (o dinheiro foi para a conta Connect do escritório).
                </p>
              ) : null}
              {selectedEvent.status === 'PENDING_PAYMENT' || selectedEvent.status === 'SCHEDULED' ? (
                <div className="pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full rounded-full border-destructive/40 text-destructive hover:bg-destructive/10 hover:text-destructive"
                    disabled={cancellingEvent}
                    onClick={() => setConfirmCancelEvent(true)}
                  >
                    Cancelar agendamento
                  </Button>
                </div>
              ) : null}
            </div>
          ) : null}
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={confirmCancelEvent}
        onOpenChange={(open) => !open && setConfirmCancelEvent(false)}
        variant="destructive"
        testId="agenda-cancel-event"
        title="Cancelar este agendamento?"
        description="O horário fica livre na agenda. Esta acção não apaga o histórico — o evento passa a Cancelado."
        confirmLabel={cancellingEvent ? 'A cancelar…' : 'Sim, cancelar'}
        onConfirm={cancelSelectedEvent}
      />

      <p className="cb-agenda-foot">Teglion — Consultorias / Agenda</p>
    </div>
  )
}
