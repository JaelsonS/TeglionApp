import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import {
  ArrowRight,
  CalendarDays,
  Check,
  CreditCard,
  LayoutDashboard,
  Loader2,
  ReceiptText,
  ShieldCheck,
  Sparkles,
  Wallet,
} from 'lucide-react'

import { trialDaysRemaining } from '@/features/firm/billing/trialReminderUtils'
import { AskMayaButton } from '@/features/maya'
import { BRAND } from '@/shared/config/brand'
import { PRICING_FALLBACK, formatEurCents } from '@/shared/config/pricingConstants'
import { contabilPt as t } from '@/shared/i18n/contabilPt'
import { BILLING_STATUS_QUERY_KEY } from '@/infrastructure/api/contabil/billing'
import { contabilBillingApi, type BillingStatus } from '@/infrastructure/api'
import { Button } from '@/shared/components/ui/button'
import { PageHeader, PageLoading } from '@/shared/design-system'
import { useApiToast } from '@/shared/hooks/useApiToast'
import { cn } from '@/shared/lib/utils'
import { openExternalUrl } from '@/shared/utils/openExternalUrl'

type CheckoutInterval = 'month' | 'year'

function statusLabel(status: string | undefined, trialDays: number) {
  if (status === 'ACTIVE') return 'Plano pago'
  if (status === 'TRIAL') return `Teste (${trialDays} dias)`
  if (status === 'PAST_DUE') return 'Pagamento em atraso'
  if (status === 'CANCELED' || status === 'CANCELLED') return 'Cancelado'
  return status || 'Sem plano'
}

export function BillingWorkspace() {
  const [params] = useSearchParams()
  const toast = useApiToast()
  const queryClient = useQueryClient()
  const [loadingCheckout, setLoadingCheckout] = useState<CheckoutInterval | null>(null)
  const [loadingPortal, setLoadingPortal] = useState(false)

  const checkoutResult = params.get('checkout')

  const { data: billing, isLoading } = useQuery({
    queryKey: BILLING_STATUS_QUERY_KEY,
    queryFn: () => contabilBillingApi.getStatus() as Promise<BillingStatus>,
  })

  useEffect(() => {
    if (checkoutResult === 'success') {
      toast.success('Pagamento recebido. A activar o plano…')
      void queryClient.invalidateQueries({ queryKey: BILLING_STATUS_QUERY_KEY })
      void queryClient.invalidateQueries({ queryKey: ['firm'] })
    } else if (checkoutResult === 'cancelled') {
      toast.success('Checkout cancelado. Pode tentar outra vez quando quiser.')
    }
  }, [checkoutResult, queryClient, toast])

  const p = t.pricing
  const trialEnd = billing?.trialEndsAt ? new Date(billing.trialEndsAt) : null
  const daysLeft = useMemo(
    () => (trialEnd && !Number.isNaN(trialEnd.getTime()) ? trialDaysRemaining(trialEnd) : null),
    [trialEnd],
  )
  const trialExpired =
    billing?.status === 'TRIAL' && trialEnd && !Number.isNaN(trialEnd.getTime()) && trialEnd <= new Date()

  async function startCheckout(interval: CheckoutInterval) {
    setLoadingCheckout(interval)
    try {
      const { url } = await contabilBillingApi.createCheckout(interval)
      if (url) {
        openExternalUrl(url)
        toast.success('Checkout aberto noutra aba')
      } else toast.error('Não foi possível abrir o checkout.')
    } catch (e: unknown) {
      toast.error(e, 'Erro ao iniciar pagamento')
    } finally {
      setLoadingCheckout(null)
    }
  }

  async function openPortal() {
    setLoadingPortal(true)
    try {
      const { url } = await contabilBillingApi.createPortal()
      if (url) {
        openExternalUrl(url)
        toast.success('Portal Stripe aberto noutra aba')
      }
    } catch (e: unknown) {
      toast.error(e, 'Erro ao abrir portal de pagamento')
    } finally {
      setLoadingPortal(false)
    }
  }

  const planLocked = billing?.status === 'ACTIVE'
  const monthlyReady = billing?.plans?.monthly?.configured !== false
  const yearlyReady = billing?.plans?.yearly?.configured === true
  const trialDays = billing?.trialDays ?? PRICING_FALLBACK.trialDays
  const monthlyCents = billing?.plans?.monthly?.amountCents ?? PRICING_FALLBACK.monthly.amountCents
  const yearlyCents = billing?.plans?.yearly?.amountCents ?? PRICING_FALLBACK.yearly.amountCents
  const yearlyMonthlyCents =
    billing?.plans?.yearly?.equivalentMonthlyCents ?? PRICING_FALLBACK.yearly.equivalentMonthlyCents
  const monthlyLabel = formatEurCents(monthlyCents)
  const yearlyLabel = formatEurCents(yearlyCents)
  const yearlyMonthlyLabel = formatEurCents(yearlyMonthlyCents)

  const heroTone = !billing
    ? 'muted'
    : billing.hasAccess
      ? billing.status === 'TRIAL' && daysLeft != null && daysLeft <= 5
        ? 'amber'
        : 'ok'
      : 'warn'

  const kpis = [
    {
      id: 'access',
      label: 'Acesso',
      value: billing?.hasAccess ? 'Activo' : 'Em pausa',
      tone: billing?.hasAccess ? ('emerald' as const) : ('rose' as const),
      icon: ShieldCheck,
    },
    {
      id: 'status',
      label: 'Estado',
      value: statusLabel(billing?.status, trialDays),
      tone: 'brand' as const,
      icon: Sparkles,
    },
    {
      id: 'trial',
      label: billing?.status === 'TRIAL' ? 'Dias de teste' : 'Intervalo',
      value:
        billing?.status === 'TRIAL'
          ? daysLeft != null
            ? String(daysLeft)
            : '—'
          : billing?.billingPlan === 'year' || billing?.billingPlan === 'yearly'
            ? 'Anual'
            : billing?.status === 'ACTIVE'
              ? 'Mensal / Stripe'
              : '—',
      tone: 'amber' as const,
      icon: CalendarDays,
    },
    {
      id: 'price',
      label: 'Referência',
      value: planLocked ? yearlyMonthlyLabel + '/mês*' : `${monthlyLabel} · ${yearlyMonthlyLabel}`,
      tone: 'muted' as const,
      icon: CreditCard,
    },
  ]

  return (
    <div className="cb-billing-page" data-testid="firm-billing-workspace">
      <PageHeader
        title="Plano Teglion"
        subtitle={`Subscrição SaaS à AfDigital — ${trialDays} dias de teste, depois mensal (${monthlyLabel}) ou anual (${yearlyLabel}). Não é a carteira de honorários dos clientes.`}
        testId="firm-billing-header"
        secondary={<AskMayaButton intentId="billing" />}
        right={
          <div className="flex flex-wrap items-center gap-2">
            {billing?.hasSubscription ? (
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={loadingPortal}
                onClick={() => void openPortal()}
              >
                {loadingPortal ? (
                  <Loader2 className="mr-1.5 h-4 w-4 animate-spin" aria-hidden />
                ) : (
                  <ReceiptText className="mr-1.5 h-4 w-4" aria-hidden />
                )}
                Portal Stripe
              </Button>
            ) : null}
            {billing?.hasAccess ? (
              <Button type="button" size="sm" variant="ghost" asChild>
                <Link to="/app/firm/dashboard">
                  <LayoutDashboard className="mr-1.5 h-4 w-4" aria-hidden />
                  Painel
                </Link>
              </Button>
            ) : null}
          </div>
        }
      />

      {isLoading ? <PageLoading label="A carregar o plano…" /> : null}

      {!isLoading && billing ? (
        <>
          <div className="cb-billing-kpi-strip" data-testid="firm-billing-kpis">
            {kpis.map((kpi) => {
              const Icon = kpi.icon
              return (
                <div key={kpi.id} className={cn('cb-billing-kpi', `cb-billing-kpi--${kpi.tone}`)}>
                  <span className="cb-billing-kpi-icon" aria-hidden>
                    <Icon className="h-4 w-4" />
                  </span>
                  <div className="min-w-0">
                    <p className="cb-billing-kpi-value">{kpi.value}</p>
                    <p className="cb-billing-kpi-label">{kpi.label}</p>
                  </div>
                </div>
              )
            })}
          </div>

          <div
            className={cn('cb-billing-hero', `cb-billing-hero--${heroTone}`)}
            data-testid="firm-billing-hero"
            role="status"
          >
            <span className="cb-billing-hero-icon" aria-hidden>
              {heroTone === 'ok' ? (
                <ShieldCheck className="h-5 w-5" />
              ) : heroTone === 'amber' ? (
                <CalendarDays className="h-5 w-5" />
              ) : (
                <Wallet className="h-5 w-5" />
              )}
            </span>
            <div className="min-w-0 flex-1">
              {billing.hasAccess ? (
                <>
                  <p className="cb-billing-hero-title">Acesso activo</p>
                  <p className="cb-billing-hero-detail">
                    {billing.status === 'TRIAL' && trialEnd
                      ? `Teste gratuito até ${trialEnd.toLocaleDateString('pt-PT')}${
                          daysLeft != null ? ` · ${daysLeft} dia${daysLeft === 1 ? '' : 's'} restantes` : ''
                        }.`
                      : 'Subscrição em vigor. Cartão, faturas e cancelamento no portal Stripe.'}
                  </p>
                </>
              ) : (
                <>
                  <p className="cb-billing-hero-title">Acesso em pausa</p>
                  <p className="cb-billing-hero-detail">
                    {trialExpired
                      ? `Os ${trialDays} dias de teste terminaram. Active o plano mensal ou anual para voltar ao gabinete.`
                      : 'Regularize a subscrição para a equipa e os clientes voltarem a ter acesso.'}
                  </p>
                </>
              )}
            </div>
            {planLocked && billing.hasSubscription ? (
              <Button type="button" size="sm" className="shrink-0" disabled={loadingPortal} onClick={() => void openPortal()}>
                {loadingPortal ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <ReceiptText className="mr-1.5 h-4 w-4" />}
                Gerir
              </Button>
            ) : null}
          </div>
        </>
      ) : null}

      <div className="cb-billing-flows" data-testid="firm-billing-disambiguation" role="note">
        <p className="cb-billing-flows-title">Três fluxos distintos</p>
        <ul className="cb-billing-flows-grid">
          <li>
            <Link to="/app/firm/payments" className="cb-billing-flow-card">
              <Wallet className="h-4 w-4 text-brand" aria-hidden />
              <span>
                <span className="cb-billing-flow-label">Pagamentos (carteira)</span>
                <span className="cb-billing-flow-desc">Honorários que os clientes pagam ao gabinete</span>
              </span>
              <ArrowRight className="ml-auto h-4 w-4 shrink-0 opacity-50" aria-hidden />
            </Link>
          </li>
          <li>
            <Link to="/app/firm/settings?tab=pagamentos" className="cb-billing-flow-card">
              <CreditCard className="h-4 w-4 text-brand" aria-hidden />
              <span>
                <span className="cb-billing-flow-label">Receber dos clientes</span>
                <span className="cb-billing-flow-desc">Stripe Connect — cobranças online (opcional)</span>
              </span>
              <ArrowRight className="ml-auto h-4 w-4 shrink-0 opacity-50" aria-hidden />
            </Link>
          </li>
          <li>
            <div className="cb-billing-flow-card cb-billing-flow-card--current">
              <Sparkles className="h-4 w-4 text-brand" aria-hidden />
              <span>
                <span className="cb-billing-flow-label">Esta página</span>
                <span className="cb-billing-flow-desc">Subscrição Teglion (SaaS) à AfDigital</span>
              </span>
            </div>
          </li>
        </ul>
      </div>

      <div className="cb-billing-section-lead">
        <p className="cb-billing-section-lead-title">
          {planLocked ? 'O seu plano' : 'Escolher intervalo'}
        </p>
        <p className="cb-billing-section-lead-detail">
          {planLocked
            ? 'O gabinete já tem plano pago. Altere intervalo, cartão ou faturas no portal Stripe.'
            : `Teste sem cartão · depois mensal (${monthlyLabel}) ou anual (${yearlyLabel}, ~${yearlyMonthlyLabel}/mês).`}
        </p>
      </div>

      <div className="cb-billing-cards">
        <article className={cn('cb-billing-card', billing?.status === 'TRIAL' && 'cb-billing-card--current')}>
          {billing?.status === 'TRIAL' ? <p className="cb-billing-card-using">A usar agora</p> : null}
          <p className="cb-billing-card-label">{p.trial.name}</p>
          <p className="cb-billing-card-price">
            0 €
            <span className="cb-billing-card-period"> / {trialDays} dias</span>
          </p>
          <p className="cb-billing-card-desc">{p.trial.description}</p>
          <ul className="cb-billing-card-features">
            {p.trial.features.map((f) => (
              <li key={f}>
                <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brand" aria-hidden />
                {f}
              </li>
            ))}
          </ul>
        </article>

        <article className="cb-billing-card">
          <p className="cb-billing-card-label">{p.plan.monthly.name}</p>
          <p className="cb-billing-card-price">
            {monthlyLabel}
            <span className="cb-billing-card-period"> / mês</span>
          </p>
          <p className="cb-billing-card-desc">{p.plan.monthly.note} · por gabinete</p>
          <ul className="cb-billing-card-features">
            {p.plan.features.map((f) => (
              <li key={f}>
                <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brand" aria-hidden />
                {f}
              </li>
            ))}
          </ul>
          {billing?.stripeConfigured !== false && !planLocked ? (
            <div className="cb-billing-card-cta">
              <Button
                type="button"
                variant="outline"
                className={cn('w-full', !monthlyReady && 'opacity-60')}
                disabled={loadingCheckout !== null || !monthlyReady}
                onClick={() => void startCheckout('month')}
              >
                {loadingCheckout === 'month' ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />
                ) : (
                  <CreditCard className="mr-2 h-4 w-4" aria-hidden />
                )}
                Activar mensal
              </Button>
            </div>
          ) : null}
        </article>

        <article className="cb-billing-card cb-billing-card-featured">
          <p className="cb-billing-card-badge">{p.plan.yearly.badge}</p>
          <p className="cb-billing-card-label">{p.plan.yearly.name}</p>
          <p className="cb-billing-card-price">
            {yearlyMonthlyLabel}
            <span className="cb-billing-card-period"> / mês</span>
          </p>
          <p className="cb-billing-card-desc">{yearlyLabel} cobrados uma vez por ano</p>
          <ul className="cb-billing-card-features">
            {p.plan.features.map((f) => (
              <li key={`y-${f}`}>
                <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brand" aria-hidden />
                {f}
              </li>
            ))}
          </ul>
          {billing?.stripeConfigured !== false && !planLocked ? (
            <div className="cb-billing-card-cta">
              <Button
                type="button"
                className="w-full"
                disabled={loadingCheckout !== null || !yearlyReady}
                onClick={() => void startCheckout('year')}
              >
                {loadingCheckout === 'year' ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />
                ) : (
                  <CreditCard className="mr-2 h-4 w-4" aria-hidden />
                )}
                Activar anual
              </Button>
            </div>
          ) : null}
        </article>
      </div>

      {planLocked ? (
        <div className="cb-billing-manage">
          <div className="min-w-0 flex-1">
            <p className="cb-billing-manage-title">Gestão da subscrição</p>
            <p className="cb-billing-manage-detail">
              Mudar intervalo, actualizar cartão, descarregar faturas ou cancelar — tudo no portal Stripe seguro.
            </p>
          </div>
          {billing?.hasSubscription ? (
            <Button type="button" disabled={loadingPortal} onClick={() => void openPortal()}>
              {loadingPortal ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ReceiptText className="mr-2 h-4 w-4" />}
              Abrir portal Stripe
            </Button>
          ) : null}
        </div>
      ) : null}

      <p className="cb-billing-vat">{p.plan.vatNote}</p>
      {planLocked ? (
        <p className="cb-billing-vat-hint">* Referência do equivalente mensal do plano anual; o valor cobrado depende do intervalo activo no Stripe.</p>
      ) : null}

      {billing?.stripeConfigured === false ? (
        <p className="cb-billing-config-warn">
          Pagamentos ainda a configurar. Escreva para{' '}
          <a href={`mailto:${BRAND.emails.hello}`} className="font-medium text-brand hover:underline">
            {BRAND.emails.hello}
          </a>
          .
        </p>
      ) : null}

      {billing?.stripeConfigured !== false && !yearlyReady ? (
        <p className="cb-billing-config-warn">
          Plano anual: falta configurar <code>STRIPE_PRICE_ID_EUR_YEARLY</code> no ambiente.
        </p>
      ) : null}

      <section className="cb-billing-faq" aria-labelledby="billing-faq-title">
        <h2 id="billing-faq-title" className="cb-billing-faq-title">
          Perguntas frequentes
        </h2>
        <ul className="cb-billing-faq-list">
          {p.faq.map((item) => (
            <li key={item.q} className="cb-billing-faq-item">
              <p className="cb-billing-faq-q">{item.q}</p>
              <p className="cb-billing-faq-a">{item.a}</p>
            </li>
          ))}
        </ul>
      </section>

      <div className="cb-billing-notice">
        <ReceiptText className="mb-2 h-5 w-5 text-brand" aria-hidden />
        <p>
          Pagamento seguro via Stripe. Cancela quando quiser — sem fidelização. Dúvidas:{' '}
          <a href={`mailto:${BRAND.emails.support}`} className="font-medium text-brand hover:underline">
            {BRAND.emails.support}
          </a>
          .
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Button asChild variant="outline" size="sm">
            <Link to="/#precos">Ver preços no site</Link>
          </Button>
          {billing?.hasAccess ? (
            <Button asChild variant="ghost" size="sm">
              <Link to="/app/firm/dashboard">Voltar ao painel</Link>
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  )
}
