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
        Activo
      </span>
    )
  }
  if (state === 'pending') {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-caption font-semibold text-amber-900">
        <AlertTriangle className="h-3 w-3" aria-hidden />
        Pendente
      </span>
    )
  }
  if (state === 'soon') {
    return (
      <span className="rounded-full bg-muted px-2 py-0.5 text-caption font-semibold text-muted-foreground">
        em breve
      </span>
    )
  }
  return (
    <span className="rounded-full bg-sky-100 px-2 py-0.5 text-caption font-semibold text-sky-900">
      Configurar
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
  const feePercent = query.data?.platformFeePercent || '2'
  const onlineSelected = paymentMethod === 'stripe_connect' || paymentRequired
  const pendingReason = query.data?.account?.requirementsDisabledReason

  const goConfigure = (reason?: string) => {
    toast.message(reason || 'Configure o Stripe Connect', {
      description: 'Definições → Pagamentos: ligue a conta e complete o KYC.',
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
      toast.success(kind === 'mbway' ? 'MB WAY disponível no Checkout' : 'Cartões activos', {
        description:
          kind === 'mbway'
            ? 'O MB WAY aparece no Checkout Stripe quando a Stripe o activar na sua conta Connect.'
            : 'O cliente paga com cartão (e Apple Pay / Google Pay quando disponíveis) no Checkout.',
      })
      return
    }
    goConfigure(
      connectState === 'pending'
        ? 'Stripe Connect ainda tem pendências'
        : 'Active o Stripe Connect para receber por este meio',
    )
  }

  const togglePaymentRequired = (on: boolean) => {
    if (!on) {
      onPaymentRequiredChange(false)
      return
    }
    if (!requiresBooking) {
      toast.error('Active primeiro “Exige agendamento”')
      return
    }
    if (connectState !== 'active') {
      goConfigure('Para exigir pagamento no agendamento, o Stripe Connect tem de estar activo')
      return
    }
    onPaymentRequiredChange(true)
    onPaymentMethodChange('stripe_connect')
  }

  return (
    <div className="space-y-3">
      <div className="rounded-xl border border-border/70 bg-muted/20 px-3 py-2.5 text-xs leading-relaxed text-muted-foreground">
        Meios <strong className="font-medium text-foreground">online</strong> usam Stripe Connect
        (dinheiro na conta do escritório). Taxa de serviço Teglion: {feePercent}% · taxas Stripe à
        parte.
        {connectState !== 'active' ? (
          <>
            {' '}
            <Link to={SETTINGS_PAYMENTS} className="font-medium text-brand underline-offset-2 hover:underline">
              Ir a Definições → Pagamentos
            </Link>
          </>
        ) : null}
      </div>

      {connectState === 'pending' ? (
        <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50/90 px-3 py-2.5 text-xs text-amber-950">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          <div>
            <p className="font-medium">Stripe Connect com pendências</p>
            <p className="mt-0.5">
              {pendingReason ||
                'Complete a configuração / KYC na Stripe para activar cobranças.'}
            </p>
            <Link
              to={SETTINGS_PAYMENTS}
              className="mt-1.5 inline-flex items-center gap-1 font-medium text-amber-950 underline-offset-2 hover:underline"
            >
              Continuar configuração
              <ExternalLink className="h-3 w-3" aria-hidden />
            </Link>
          </div>
        </div>
      ) : null}

      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Online</p>

      <OnlineMethodRow
        icon={<CreditCard className="h-4 w-4" aria-hidden />}
        title="Cartões"
        hint="Visa, Mastercard, Apple Pay e Google Pay (quando disponíveis no Checkout)"
        state={connectState === 'loading' ? 'loading' : connectState === 'active' ? 'active' : connectState === 'pending' ? 'pending' : 'not_started'}
        selected={onlineSelected && connectState === 'active'}
        onClick={() => selectOnline('cards')}
      />

      <OnlineMethodRow
        icon={<Smartphone className="h-4 w-4" aria-hidden />}
        title="MB WAY"
        hint="Pagamento instantâneo no telemóvel — aparece no Checkout se activo na Stripe"
        state={connectState === 'loading' ? 'loading' : connectState === 'active' ? 'active' : connectState === 'pending' ? 'pending' : 'not_started'}
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
          <span className="font-medium">Pagamento obrigatório no agendamento</span>
          <span className="mt-0.5 block text-xs text-muted-foreground">
            O cliente paga no Checkout (cartão / MB WAY) antes do horário ficar confirmado.
            {!requiresBooking ? ' Active “Exige agendamento” primeiro.' : null}
          </span>
        </span>
      </label>

      <p className="pt-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
        Outros / informação
      </p>

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
          <span className="block text-xs text-muted-foreground">Dados no orçamento / PDF</span>
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
            Referência automática — ainda não disponível com reserva de horário (confirmação pode
            demorar dias).
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
      ? 'Usar neste serviço'
      : state === 'pending'
        ? 'Resolver pendências'
        : 'Clique para activar'

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
