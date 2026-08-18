import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { AlertTriangle, CalendarCheck2, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/shared/components/ui/button'
import { contabilGoogleCalendarApi } from '@/infrastructure/api'
import { getGoogleCalendarConnectUrl } from '@/infrastructure/http/apiClient'
import { getErrorMessage } from '@/shared/utils/errors'
import { openExternalUrl } from '@/shared/utils/openExternalUrl'
import type { GoogleCalendarListItem } from '@/infrastructure/api/contabil/googleCalendar'

const STATUS_QUERY_KEY = ['google-calendar-status']

/**
 * Ligação Google Calendar — estados humanos: desligado / ligado / precisa reconectar.
 */
export function GoogleCalendarIntegrationPanel() {
  const qc = useQueryClient()
  const [searchParams, setSearchParams] = useSearchParams()
  const [disconnecting, setDisconnecting] = useState(false)
  const [savingCalendar, setSavingCalendar] = useState(false)
  const [savingPublicSync, setSavingPublicSync] = useState(false)
  const [calendars, setCalendars] = useState<GoogleCalendarListItem[] | null>(null)
  const [loadingCalendars, setLoadingCalendars] = useState(false)

  const query = useQuery({
    queryKey: STATUS_QUERY_KEY,
    queryFn: () => contabilGoogleCalendarApi.getStatus(),
  })

  useEffect(() => {
    const calendarParam = searchParams.get('calendar')
    if (!calendarParam) return
    if (calendarParam === 'connected') {
      toast.success('Google Calendar ligado')
      void qc.invalidateQueries({ queryKey: STATUS_QUERY_KEY })
    } else if (calendarParam === 'error') {
      toast.error('Não foi possível ligar o Google Calendar', {
        description: 'Verifique se a API do Calendar está activada no Google Cloud Console e tente novamente.',
      })
    }
    setSearchParams(
      (prev) => {
        const p = new URLSearchParams(prev)
        p.delete('calendar')
        return p
      },
      { replace: true },
    )
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams])

  const status = query.data
  const needsReconnect = status?.connected && status.authStatus === 'needs_reconnect'
  const healthy = status?.connected && status.authStatus === 'ok'

  useEffect(() => {
    if (!healthy) {
      setCalendars(null)
      return
    }
    let cancelled = false
    setLoadingCalendars(true)
    void contabilGoogleCalendarApi
      .listCalendars()
      .then((res) => {
        if (!cancelled) setCalendars(res.calendars || [])
      })
      .catch(() => {
        if (!cancelled) setCalendars([])
      })
      .finally(() => {
        if (!cancelled) setLoadingCalendars(false)
      })
    return () => {
      cancelled = true
    }
  }, [healthy, status?.calendarId])

  const disconnect = async () => {
    setDisconnecting(true)
    try {
      await contabilGoogleCalendarApi.disconnect()
      toast.success('Google Calendar desligado')
      await qc.invalidateQueries({ queryKey: STATUS_QUERY_KEY })
    } catch (err) {
      toast.error('Erro ao desligar', { description: getErrorMessage(err) })
    } finally {
      setDisconnecting(false)
    }
  }

  const onSelectCalendar = async (calendarId: string) => {
    const selected = calendars?.find((c) => c.id === calendarId)
    setSavingCalendar(true)
    try {
      await contabilGoogleCalendarApi.selectCalendar({
        calendarId,
        calendarSummary: selected?.summary || null,
      })
      toast.success('Calendário actualizado')
      await qc.invalidateQueries({ queryKey: STATUS_QUERY_KEY })
    } catch (err) {
      toast.error('Não foi possível guardar o calendário', { description: getErrorMessage(err) })
    } finally {
      setSavingCalendar(false)
    }
  }

  const onTogglePublicSync = async (enabled: boolean) => {
    setSavingPublicSync(true)
    try {
      await contabilGoogleCalendarApi.setPublicSync(enabled)
      toast.success(enabled ? 'Agendamentos públicos serão sincronizados' : 'Sincronização pública desactivada')
      await qc.invalidateQueries({ queryKey: STATUS_QUERY_KEY })
    } catch (err) {
      toast.error('Não foi possível actualizar', { description: getErrorMessage(err) })
    } finally {
      setSavingPublicSync(false)
    }
  }

  if (query.isLoading) {
    return <p className="text-sm text-muted-foreground">A verificar ligação…</p>
  }

  if (!status?.configured) {
    return <p className="text-sm text-muted-foreground">Integração Google Calendar não disponível neste momento.</p>
  }

  if (needsReconnect) {
    return (
      <div className="space-y-3 rounded-lg border border-amber-500/40 bg-amber-500/5 p-3">
        <div className="flex items-start gap-2 text-sm">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
          <div>
            <p className="font-medium text-foreground">Google Calendar precisa ser reconectado.</p>
            <p className="mt-1 text-muted-foreground">
              A autorização expirou ou foi revogada. Os agendamentos no Teglion continuam a funcionar; a sincronização
              com o Google fica pausada até reconectar.
            </p>
          </div>
        </div>
        <Button
          type="button"
          size="sm"
          className="rounded-full"
          onClick={() => {
            openExternalUrl(getGoogleCalendarConnectUrl())
            toast.message('Google aberto noutra aba', {
              description: 'Autorize o calendário na nova aba. O Teglion mantém-se aberto.',
            })
          }}
        >
          Reconectar Google Calendar
        </Button>
      </div>
    )
  }

  if (healthy) {
    return (
      <div className="space-y-3 rounded-2xl border border-border/40 p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-start gap-2 text-sm">
            <CalendarCheck2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
            <div>
              <p className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-semibold text-emerald-800">
                  Ligado
                </span>
                <span>
                  como <span className="font-medium">{status.googleEmail}</span>
                </span>
              </p>
              <p className="mt-1 text-muted-foreground">
                O seu Google Calendar está conectado. Os agendamentos do Teglion serão sincronizados automaticamente com
                o calendário selecionado.
              </p>
            </div>
          </div>
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="rounded-full"
            disabled={disconnecting}
            onClick={() => void disconnect()}
          >
            {disconnecting ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : null}
            Desligar
          </Button>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground" htmlFor="gcal-select">
            Calendário a utilizar
          </label>
          {loadingCalendars ? (
            <p className="text-sm text-muted-foreground">A carregar calendários…</p>
          ) : (
            <select
              id="gcal-select"
              className="w-full max-w-md rounded-md border border-border/60 bg-background px-3 py-2 text-sm"
              disabled={savingCalendar || !calendars?.length}
              value={status.calendarId || 'primary'}
              onChange={(e) => void onSelectCalendar(e.target.value)}
            >
              {(calendars || []).map((cal) => (
                <option key={cal.id} value={cal.id}>
                  {cal.summary}
                  {cal.primary ? ' (principal)' : ''}
                </option>
              ))}
              {!calendars?.some((c) => c.id === (status.calendarId || 'primary')) ? (
                <option value={status.calendarId || 'primary'}>
                  {status.calendarSummary || status.calendarId || 'Principal'}
                </option>
              ) : null}
            </select>
          )}
        </div>

        <label className="flex items-start gap-2 text-sm">
          <input
            type="checkbox"
            className="mt-1"
            checked={Boolean(status.publicSyncEnabled)}
            disabled={savingPublicSync}
            onChange={(e) => void onTogglePublicSync(e.target.checked)}
          />
          <span>
            <span className="font-medium">Sincronizar agendamentos da página pública</span>
            <span className="mt-0.5 block text-muted-foreground">
              Quando um cliente marca horário na página pública, o evento também aparece neste calendário.
            </span>
          </span>
        </label>
      </div>
    )
  }

  return (
    <div className="space-y-2 rounded-lg border border-dashed border-border/50 p-3">
      <p className="text-sm text-muted-foreground">
        Ligue a sua conta Google para sincronizar automaticamente os agendamentos do Teglion com o Google Calendar.
      </p>
      <Button
        type="button"
        size="sm"
        className="rounded-full"
        onClick={() => {
          openExternalUrl(getGoogleCalendarConnectUrl())
          toast.message('Google aberto noutra aba', {
            description: 'Autorize o calendário na nova aba. O Teglion mantém-se aberto.',
          })
        }}
      >
        Ligar Google Calendar
      </Button>
    </div>
  )
}
