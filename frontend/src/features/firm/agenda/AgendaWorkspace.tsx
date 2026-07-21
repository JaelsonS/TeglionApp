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
  dateRangeForView,
  formatNavLabel,
  normalizeAnchor,
  startOfDay,
  startOfWeekMonday,
  type AgendaViewMode,
} from '@/features/firm/agenda/agendaCalendarUtils'
import { Button } from '@/shared/components/ui/button'
import { cn } from '@/shared/lib/utils'
import { contabilConsultationsApi, contabilClientsApi, contabilFirmApi } from '@/infrastructure/api'
import { getErrorMessage } from '@/shared/utils/errors'
import type { AccountingService, Consultation, FirmBookingSettings } from '@/shared/types/contabil'
import type { Client } from '@/shared/types/clients'

type Tab = 'calendar' | 'settings'

export function AgendaWorkspace() {
  const [searchParams, setSearchParams] = useSearchParams()
  const tab: Tab = searchParams.get('panel') === 'settings' ? 'settings' : 'calendar'

  const [view, setView] = useState<AgendaViewMode>('week')
  const [anchor, setAnchor] = useState(() => startOfWeekMonday(new Date()))
  const [items, setItems] = useState<Consultation[]>([])
  const [clients, setClients] = useState<Client[]>([])
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
  const [dayStart, setDayStart] = useState('09:00')
  const [dayEnd, setDayEnd] = useState('17:00')
  const [wd, setWd] = useState<number[]>([1, 2, 3, 4, 5])

  const range = useMemo(() => dateRangeForView(view, anchor), [view, anchor])

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [consRes, clientRes, cfgRes, staffRes] = await Promise.all([
        contabilConsultationsApi.list({ from: range.from, to: range.to }) as Promise<{
          items?: Consultation[]
        }>,
        contabilClientsApi.list({ page: 1, limit: 200 }) as Promise<{ items?: Client[] }>,
        contabilConsultationsApi.getBookingSettings() as Promise<{
          services?: AccountingService[]
          booking?: FirmBookingSettings
        }>,
        contabilFirmApi.listStaff() as Promise<{ items?: { id: string; fullName?: string; email?: string }[] }>,
      ])
      setItems(consRes.items || [])
      setClients(clientRes.items || [])
      setStaff(staffRes.items || [])
      setServices(cfgRes.services || [])
      const b = cfgRes.booking
      if (b) {
        setBooking(b)
        setSlotMin(b.slotMinutes)
        setHorizon(b.horizonDays)
        setDayStart(b.dayStart)
        setDayEnd(b.dayEnd)
        setWd(b.weekdays?.length ? b.weekdays : [1, 2, 3, 4, 5])
        setBookingTz(b.timezone && typeof b.timezone === 'string' ? b.timezone : 'Europe/Lisbon')
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
    (id: string) => {
      const c = clients.find((x) => x._id === id)
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
    const when = new Date(ev.scheduledAt)
    setView('day')
    setAnchor(startOfDay(when))
  }, [])

  const saveAvailability = async () => {
    if (wd.length === 0) {
      toast.error('Seleccione pelo menos um dia de atendimento')
      return
    }
    try {
      const res = (await contabilConsultationsApi.patchBookingSettings({
        slotMinutes: slotMin,
        horizonDays: horizon,
        weekdays: wd,
        dayStart,
        dayEnd,
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
      <div className="cb-agenda-page-hd">
        <div className="flex flex-wrap items-start justify-between gap-3 px-4 pt-4 sm:px-5">
          <div>
            <h1 className="cb-agenda-page-title">Agenda</h1>
            <p className="cb-agenda-page-sub">Reuniões, chamadas e eventos da equipa</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant={tab === 'settings' ? 'default' : 'outline'}
              size="sm"
              className={cn('h-8 rounded-md text-xs', tab === 'settings' && 'bg-brand hover:bg-brand/90')}
              onClick={() => setTab(tab === 'settings' ? 'calendar' : 'settings')}
            >
              <Settings2 className="mr-1.5 h-3.5 w-3.5" />
              {tab === 'settings' ? 'Calendário' : 'Definições'}
            </Button>
            {tab === 'calendar' ? (
              <Button type="button" size="sm" className="h-8 rounded-md text-xs" onClick={() => setShowForm(true)}>
                <Plus className="mr-1.5 h-3.5 w-3.5" />
                Novo evento
              </Button>
            ) : null}
          </div>
        </div>

        {tab === 'calendar' ? (
          <div className="cb-agenda-toolbar">
            <div className="flex items-center gap-1">
              <Button type="button" variant="ghost" size="icon" className="h-8 w-8" onClick={() => shift(-1)}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="min-w-[10rem] max-w-[18rem] truncate text-center text-xs font-medium capitalize text-foreground sm:min-w-[12rem] sm:text-sm">
                {formatNavLabel(view, normalizeAnchor(view, anchor))}
              </span>
              <Button type="button" variant="ghost" size="icon" className="h-8 w-8" onClick={() => shift(1)}>
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button type="button" variant="outline" size="sm" className="ml-1 h-8 rounded-md text-xs" onClick={goToday}>
                Hoje
              </Button>
            </div>

            <div className="cb-agenda-view-toggle">
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
          booking={booking}
          wd={wd}
          slotMin={slotMin}
          horizon={horizon}
          bookingTz={bookingTz}
          dayStart={dayStart}
          dayEnd={dayEnd}
          onToggleWeekday={(n) =>
            setWd((prev) => (prev.includes(n) ? prev.filter((x) => x !== n) : [...prev, n].sort((a, b) => a - b)))
          }
          onSlotMin={setSlotMin}
          onHorizon={setHorizon}
          onBookingTz={setBookingTz}
          onDayStart={setDayStart}
          onDayEnd={setDayEnd}
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
                items={items}
                staffName={staffName}
                clientName={clientName}
                onSelectEvent={openEvent}
              />
            ) : view === 'day' ? (
              <AgendaCalendarGrid
                days={[dayAnchor]}
                items={items}
                staffName={staffName}
                clientName={clientName}
                onSelectEvent={openEvent}
              />
            ) : (
              <AgendaMonthGrid
                anchor={anchor}
                items={items}
                onSelectDay={pickDayFromMonth}
                onSelectEvent={openEvent}
              />
            )}
          </div>

          {view !== 'month' ? (
            <AgendaSidebar
              anchor={anchor}
              items={items}
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

      <p className="cb-agenda-foot">Teglion — Consultorias / Agenda</p>
    </div>
  )
}
