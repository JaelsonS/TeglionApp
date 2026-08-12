import { useQuery } from '@tanstack/react-query'
import { CheckCircle2, CreditCard, ExternalLink, Loader2, Smartphone, AlertTriangle } from 'lucide-react'
import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'

import {
  CONNECT_STATUS_QUERY_KEY,
  contabilConnectApi,
  type ConnectStatus,
} from '@/infrastructure/api'
import { connectPendingSummary } from '@/features/firm/settings/connectStatusCopy'
import { cn } from '@/shared/lib/utils'

export type ServicePaymentMethodId = 'bank_transfer' | 'multibanco' | 'stripe_connect'

type OnlineKind = 'cards' | 'mbway'

type Props = {
  paymentMethod: ServicePaymentMethodId
  paymentRequired: boolean
  requiresBooking: boolean
  onPaymentMethodChange: (method: ServicePaymentMethodId) => void
  onPaymentRequiredChange: (required: boolean) => void
}

const SETTINGS_PAYMENTS = '/app/firm/settings?tab=pagamentos'

function deriveConnectState(data: ConnectStatus | undefined) {
  if (!data) return 'loading' as const
  if (!data.configured) return 'env_off' as const
  if (!data.account) return 'not_started' as const
  if (data.account.readyForCharges || data.account.chargesEnabled) return 'active' as const
  return 'pending' as const
}

function StatusPill({
  state,
}: {
  state: 'loading' | 'env_off' | 'not_started' | 'pending' | 'active' | 'soon'
}) {
  if (state === 'loading') {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-caption font-semibold text-muted-foreground">
        <Loader2 className="h-3 w-3 animate-spin" aria-hidden />A verificar…
      </span>
    )
  }
  if (state === 'active') {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-caption font-semibold text-emerald-800">
        <CheckCircle2 className="h-3 w-3" aria-hidden />
        Pronto
      </span>
    )
  }
  if (state === 'pending') {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-caption font-semibold text-amber-900">
        <AlertTriangle className="h-3 w-3" aria-hidden />
        Quase lá
      </span>
    )
  }
  if (state === 'soon') {
    return (
      <span className="rounded-full bg-muted px-2 py-0.5 text-caption font-semibold text-muted-foreground">
        Em breve
      </span>
    )
  }
  return (
    <span className="rounded-full bg-sky-100 px-2 py-0.5 text-caption font-semibold text-sky-900">
      Por ligar
    </span>
  )
}

export function ServicePaymentMethodsPanel({
  paymentMethod,
  paymentRequired,
  requiresBooking,
  onPaymentMethodChange,
  onPaymentRequiredChange,
}: Props) {
  const query = useQuery({
    queryKey: CONNECT_STATUS_QUERY_KEY,
    queryFn: () => contabilConnectApi.getStatus(),
    staleTime: 30_000,
  })

  const connectState = deriveConnectState(query.data)
  const onlineSelected = paymentMethod === 'stripe_connect' || paymentRequired
  const pendingMessage = connectPendingSummary({
    disabledReason: query.data?.account?.requirementsDisabledReason,
    currentlyDue: query.data?.account?.requirementsCurrentlyDue,
  })

  const goConfigure = (title: string, description: string) => {
    toast.message(title, {
      description,
      action: {
        label: 'Abrir Pagamentos',
        onClick: () => {
          window.location.assign(SETTINGS_PAYMENTS)
        },
      },
    })
  }

  const selectOnline = (kind: OnlineKind) => {
    if (connectState === 'loading') return
    if (connectState === 'active') {
      onPaymentMethodChange('stripe_connect')
      toast.success(kind === 'mbway' ? 'MB WAY seleccionado' : 'Cartões seleccionados', {
        description:
          kind === 'mbway'
            ? 'No Checkout, o cliente pode pagar com MB WAY quando a Stripe o mostrar na sua conta.'
            : 'No Checkout, o cliente pode pagar com cartão (e carteiras digitais, quando disponíveis).',
      })
      return
    }
    if (connectState === 'pending') {
      goConfigure(
        'Falta só terminar na Stripe',
        'Abra Pagamentos, continue o processo e volte aqui — depois fica verde e pronto a receber.',
      )
      return
    }
    goConfigure(
      'Ligue os pagamentos online',
      'Em Pagamentos, associe a conta Stripe do escritório. Depois pode receber por cartão e MB WAY.',
    )
  }

  const togglePaymentRequired = (on: boolean) => {
    if (!on) {
      onPaymentRequiredChange(false)
      return
    }
    if (!requiresBooking) {
      toast.error('Primeiro active “Exige agendamento” neste serviço')
      return
    }
    if (connectState !== 'active') {
      goConfigure(
        'Ainda não dá para exigir pagamento',
        'Termine a ligação Stripe em Pagamentos. Quando estiver pronta, volte e marque esta opção.',
      )
      return
    }
    onPaymentRequiredChange(true)
    onPaymentMethodChange('stripe_connect')
  }

  return (
    <div className="space-y-3">
      <p className="text-xs leading-relaxed text-muted-foreground">
        Online, o cliente paga no Checkout da Stripe e o valor fica na conta do escritório. Detalhes
        e condições estão em Definições → Pagamentos.
        {connectState !== 'active' ? (
          <>
            {' '}
            <Link to={SETTINGS_PAYMENTS} className="font-medium text-brand underline-offset-2 hover:underline">
              Abrir Pagamentos
            </Link>
          </>
        ) : null}
      </p>

      {connectState === 'pending' ? (
        <div className="flex items-start gap-2 rounded-xl border border-amber-200/80 bg-amber-50/70 px-3 py-2.5 text-xs text-amber-950">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          <div>
            <p className="font-medium">Quase a receber online</p>
            <p className="mt-1 leading-relaxed">{pendingMessage}</p>
            <Link
              to={SETTINGS_PAYMENTS}
              className="mt-2 inline-flex items-center gap-1 font-medium text-amber-950 underline-offset-2 hover:underline"
            >
              Continuar em Pagamentos
              <ExternalLink className="h-3 w-3" aria-hidden />
            </Link>
          </div>
        </div>
      ) : null}

      {connectState === 'not_started' || connectState === 'env_off' ? (
        <div className="rounded-xl border border-border/60 bg-muted/15 px-3 py-2.5 text-xs leading-relaxed text-muted-foreground">
          Ainda não ligou a conta Stripe do escritório.{' '}
          <Link to={SETTINGS_PAYMENTS} className="font-medium text-brand underline-offset-2 hover:underline">
            Começar em Pagamentos
          </Link>{' '}
          — depois estes meios ficam prontos.
        </div>
      ) : null}

      <p className="text-xs font-medium text-muted-foreground">Receber online</p>

      <OnlineMethodRow
        icon={<CreditCard className="h-4 w-4" aria-hidden />}
        title="Cartões"
        hint="O cliente paga com cartão no Checkout seguro da Stripe"
        state={
          connectState === 'loading'
            ? 'loading'
            : connectState === 'active'
              ? 'active'
              : connectState === 'pending'
                ? 'pending'
                : 'not_started'
        }
        selected={onlineSelected && connectState === 'active'}
        onClick={() => selectOnline('cards')}
      />

      <OnlineMethodRow
        icon={<Smartphone className="h-4 w-4" aria-hidden />}
        title="MB WAY"
        hint="O cliente confirma no telemóvel — rápido e habitual em Portugal"
        state={
          connectState === 'loading'
            ? 'loading'
            : connectState === 'active'
              ? 'active'
              : connectState === 'pending'
                ? 'pending'
                : 'not_started'
        }
        selected={onlineSelected && connectState === 'active'}
        onClick={() => selectOnline('mbway')}
      />

      <label
        className={cn(
          'flex cursor-pointer items-start gap-3 rounded-xl border px-3 py-2.5 transition',
          paymentRequired && connectState === 'active'
            ? 'border-brand bg-brand/[0.06]'
            : 'border-border/60 hover:bg-muted/20',
          !requiresBooking && 'opacity-70',
        )}
      >
        <input
          type="checkbox"
          className="mt-1 accent-[var(--cb-brand,#0F2942)]"
          checked={paymentRequired}
          disabled={!requiresBooking}
          onChange={(e) => togglePaymentRequired(e.target.checked)}
        />
        <span className="min-w-0 text-sm">
          <span className="font-medium">Pedir pagamento ao marcar o horário</span>
          <span className="mt-0.5 block text-xs text-muted-foreground">
            O cliente paga (cartão ou MB WAY) e só depois o horário fica confirmado.
            {!requiresBooking ? ' Active primeiro “Exige agendamento”.' : null}
          </span>
        </span>
      </label>

      <p className="pt-1 text-xs font-medium text-muted-foreground">Outras formas</p>

      <label
        className={cn(
          'flex cursor-pointer items-start gap-3 rounded-xl border px-3 py-2.5 transition',
          paymentMethod === 'bank_transfer' && !paymentRequired
            ? 'border-brand bg-brand/[0.06]'
            : 'border-border/60 hover:bg-muted/20',
        )}
      >
        <input
          type="radio"
          name="service-payment-method-offline"
          className="mt-1 accent-[var(--cb-brand,#0F2942)]"
          checked={paymentMethod === 'bank_transfer' && !paymentRequired}
          onChange={() => {
            onPaymentRequiredChange(false)
            onPaymentMethodChange('bank_transfer')
          }}
        />
        <span className="min-w-0">
          <span className="text-sm font-medium">Transferência bancária</span>
          <span className="block text-xs text-muted-foreground">
            Indica os dados no orçamento ou no PDF — fora do Checkout online
          </span>
        </span>
      </label>

      <div className="flex items-start gap-3 rounded-xl border border-border/50 px-3 py-2.5 opacity-70">
        <input type="radio" className="mt-1" disabled aria-disabled />
        <span className="min-w-0">
          <span className="flex flex-wrap items-center gap-2 text-sm font-medium">
            Multibanco
            <StatusPill state="soon" />
          </span>
          <span className="block text-xs text-muted-foreground">
            Em breve. Ainda não encaixa bem com reserva de horário (o pagamento pode demorar dias a
            confirmar).
          </span>
        </span>
      </div>
    </div>
  )
}

function OnlineMethodRow({
  icon,
  title,
  hint,
  state,
  selected,
  onClick,
}: {
  icon: ReactNode
  title: string
  hint: string
  state: 'loading' | 'env_off' | 'not_started' | 'pending' | 'active' | 'soon'
  selected: boolean
  onClick: () => void
}) {
  const cta =
    state === 'active'
      ? 'Seleccionar para este serviço'
      : state === 'pending'
        ? 'Terminar configuração'
        : 'Ligar para activar'

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex w-full items-start gap-3 rounded-xl border px-3 py-2.5 text-left transition',
        selected
          ? 'border-emerald-300 bg-emerald-50/80'
          : state === 'active'
            ? 'border-border/60 hover:border-emerald-200 hover:bg-emerald-50/40'
            : 'border-border/60 hover:bg-muted/20',
      )}
    >
      <span
        className={cn(
          'mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg',
          state === 'active' ? 'bg-emerald-100 text-emerald-800' : 'bg-muted text-muted-foreground',
        )}
      >
        {icon}
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex flex-wrap items-center gap-2 text-sm font-medium">
          {title}
          <StatusPill state={state === 'env_off' ? 'not_started' : state} />
        </span>
        <span className="mt-0.5 block text-xs text-muted-foreground">{hint}</span>
        <span
          className={cn(
            'mt-1.5 inline-flex items-center gap-1 text-xs font-medium',
            state === 'active' ? 'text-emerald-800' : 'text-brand',
          )}
        >
          {cta}
          {state !== 'active' ? <ExternalLink className="h-3 w-3" aria-hidden /> : null}
        </span>
      </span>
    </button>
  )
}
