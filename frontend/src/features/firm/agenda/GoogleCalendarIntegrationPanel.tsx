import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { CalendarCheck2, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/shared/components/ui/button'
import { contabilGoogleCalendarApi } from '@/infrastructure/api'
import { getGoogleCalendarConnectUrl } from '@/infrastructure/http/apiClient'
import { getErrorMessage } from '@/shared/utils/errors'

const STATUS_QUERY_KEY = ['google-calendar-status']

/**
 * Ligar/desligar o Google Calendar (Fase Ha — ver plan file da sessão, v3
 * secção L). Só a ligação da conta, ainda sem sincronizar consultas — isso
 * é a próxima fase (Hb), propositadamente separada e testável à parte.
 */
export function GoogleCalendarIntegrationPanel() {
  const qc = useQueryClient()
  const [searchParams, setSearchParams] = useSearchParams()
  const [disconnecting, setDisconnecting] = useState(false)

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

  if (query.isLoading) {
    return <p className="text-sm text-muted-foreground">A verificar ligação…</p>
  }

  const status = query.data
  if (!status?.configured) {
    return <p className="text-sm text-muted-foreground">Integração Google Calendar não disponível neste momento.</p>
  }

  if (status.connected) {
    return (
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border/40 p-3">
        <div className="flex items-center gap-2 text-sm">
          <CalendarCheck2 className="h-4 w-4 text-emerald-600" />
          <span>
            Ligado como <span className="font-medium">{status.googleEmail}</span>
          </span>
        </div>
        <Button type="button" size="sm" variant="outline" className="rounded-full" disabled={disconnecting} onClick={() => void disconnect()}>
          {disconnecting ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : null}
          Desligar
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-2 rounded-lg border border-dashed border-border/50 p-3">
      <p className="text-sm text-muted-foreground">
        Ligue a sua conta Google para preparar o envio de consultas para o Google Calendar.
      </p>
      <Button
        type="button"
        size="sm"
        className="rounded-full"
        onClick={() => {
          window.location.href = getGoogleCalendarConnectUrl()
        }}
      >
        Ligar Google Calendar
      </Button>
    </div>
  )
}
