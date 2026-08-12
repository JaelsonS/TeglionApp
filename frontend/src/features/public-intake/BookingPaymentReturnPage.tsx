import { useEffect, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { CheckCircle2, Clock, Loader2, XCircle } from 'lucide-react'

import { Button } from '@/shared/components/ui/button'
import { contabilPublicApi } from '@/infrastructure/api'

/**
 * Retorno do Stripe Checkout — UX apenas.
 * O estado paid/confirmed vem do webhook (poll deste endpoint).
 */
export function BookingPaymentReturnPage() {
  const { firmSlug } = useParams<{ firmSlug: string }>()
  const [searchParams] = useSearchParams()
  const consultationId = searchParams.get('c') || ''
  const token = searchParams.get('t') || ''
  const uiStatus = searchParams.get('status') || 'success'
  const [pollMs] = useState(2000)

  const enabled = Boolean(consultationId && token)

  const query = useQuery({
    queryKey: ['public-booking-payment', consultationId, token],
    queryFn: () => contabilPublicApi.getBookingPaymentStatus(consultationId, token),
    enabled,
    refetchInterval: (q) => {
      const data = q.state.data
      if (!data) return pollMs
      if (data.confirmed || data.paymentStatus === 'expired' || data.paymentStatus === 'failed') {
        return false
      }
      if (data.paymentStatus === 'paid' && data.bookingStatus === 'SCHEDULED') return false
      return pollMs
    },
  })

  useEffect(() => {
    document.title = 'Confirmação de pagamento — Teglion'
  }, [])

  if (!enabled) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <p className="text-sm text-muted-foreground">Link de confirmação inválido.</p>
      </div>
    )
  }

  const data = query.data
  const confirmed = Boolean(data?.confirmed)
  const expired = data?.paymentStatus === 'expired' || data?.paymentStatus === 'failed'
  const waiting = !confirmed && !expired && uiStatus === 'success'

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-md space-y-4 rounded-2xl border border-border/50 bg-card p-8 text-center shadow-sm">
        {confirmed ? (
          <>
            <CheckCircle2 className="mx-auto h-10 w-10 text-emerald-600" aria-hidden />
            <h1 className="text-lg font-semibold">Pagamento confirmado</h1>
            <p className="text-sm text-muted-foreground">
              O seu agendamento está confirmado
              {data?.scheduledAt
                ? ` para ${new Date(data.scheduledAt).toLocaleString('pt-PT', {
                    weekday: 'long',
                    day: '2-digit',
                    month: 'long',
                    hour: '2-digit',
                    minute: '2-digit',
                    timeZone: 'Europe/Lisbon',
                  })}`
                : ''}
              .
            </p>
          </>
        ) : null}

        {waiting && !query.isError ? (
          <>
            <Loader2 className="mx-auto h-10 w-10 animate-spin text-muted-foreground" aria-hidden />
            <h1 className="text-lg font-semibold">A confirmar o pagamento…</h1>
            <p className="text-sm text-muted-foreground">
              Estamos a validar a confirmação segura da Stripe. Isto pode demorar alguns segundos.
              Não feche esta página.
            </p>
          </>
        ) : null}

        {(uiStatus === 'cancelled' || expired) && !confirmed ? (
          <>
            <Clock className="mx-auto h-10 w-10 text-amber-600" aria-hidden />
            <h1 className="text-lg font-semibold">
              {expired ? 'Pagamento expirado' : 'Pagamento não concluído'}
            </h1>
            <p className="text-sm text-muted-foreground">
              {expired
                ? 'O tempo para pagar este horário terminou. O horário foi libertado — pode escolher outro.'
                : 'O horário permanece reservado por alguns minutos. Pode voltar e concluir o pagamento, ou esperar que expire para libertar o slot.'}
            </p>
          </>
        ) : null}

        {query.isError ? (
          <>
            <XCircle className="mx-auto h-10 w-10 text-destructive" aria-hidden />
            <h1 className="text-lg font-semibold">Não foi possível verificar</h1>
            <p className="text-sm text-muted-foreground">
              Se já pagou, aguarde a confirmação por email. O estado final depende da Stripe, não
              desta página.
            </p>
          </>
        ) : null}

        {firmSlug ? (
          <Button asChild variant="outline" className="mt-2 rounded-full">
            <Link to={`/${firmSlug}`}>Voltar à página do escritório</Link>
          </Button>
        ) : null}
      </div>
    </div>
  )
}
