import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Check, CreditCard, Loader2, ReceiptText } from 'lucide-react'

import { FirmScrollPage } from '@/features/firm/FirmPageLayout'
import { BRAND } from '@/shared/config/brand'
import { contabilPt as t } from '@/shared/i18n/contabilPt'
import { BILLING_STATUS_QUERY_KEY } from '@/infrastructure/api/contabil/billing'
import { contabilBillingApi, type BillingStatus } from '@/infrastructure/api'
import { Button } from '@/shared/components/ui/button'
import { PageHeader, PageLoading } from '@/shared/design-system'
import { AskMayaButton } from '@/features/maya'
import { useApiToast } from '@/shared/hooks/useApiToast'
import { cn } from '@/shared/lib/utils'
import { PRICING_FALLBACK, formatEurCents } from '@/shared/config/pricingConstants'
import { openExternalUrl } from '@/shared/utils/openExternalUrl'

type CheckoutInterval = 'month' | 'year'

export function FirmBillingPage() {
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
      toast.success('Checkout cancelado. Podes tentar outra vez quando quiseres.')
    }
  }, [checkoutResult, queryClient, toast])

  const p = t.pricing
  const trialEnd = billing?.trialEndsAt ? new Date(billing.trialEndsAt) : null
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

  return (
    <FirmScrollPage className="cb-billing-layout-page">
      <div className="cb-billing-page">
        <PageHeader
          title="Plano e subscrição"
          subtitle={`${trialDays} dias de teste · depois mensal (${monthlyLabel}) ou anual (${yearlyLabel} — ~${yearlyMonthlyLabel}/mês). Sem alteração à lógica de pagamento.`}
          testId="firm-billing-header"
          secondary={<AskMayaButton intentId="billing" />}
        />

        {isLoading ? <PageLoading label="A carregar o plano…" /> : null}

        {!isLoading && billing ? (
          <div className="cb-billing-status-grid">
            <div className="cb-settings-fieldset">
              <p className="cb-settings-fieldset-title">A subscrição está activa?</p>
              <p className="cb-settings-fieldset-sub mt-1">
                {billing.hasAccess
                  ? billing.status === 'TRIAL'
                    ? `Sim — teste até ${trialEnd ? trialEnd.toLocaleDateString('pt-PT') : '—'}.`
                    : 'Sim — plano em vigor.'
                  : trialExpired
                    ? 'Não — o teste terminou.'
                    : 'Não — regularize para continuar.'}
              </p>
            </div>
            <div className="cb-settings-fieldset">
              <p className="cb-settings-fieldset-title">Qual o plano?</p>
              <p className="cb-settings-fieldset-sub mt-1">
                {billing.status === 'ACTIVE'
                  ? 'Plano pago (mensal ou anual — detalhes no portal Stripe).'
                  : billing.status === 'TRIAL'
                    ? `Teste de ${trialDays} dias.`
                    : billing.status || 'Sem plano activo.'}
              </p>
            </div>
            <div className="cb-settings-fieldset">
              <p className="cb-settings-fieldset-title">O que posso fazer agora?</p>
              <p className="cb-settings-fieldset-sub mt-1">
                {billing.status === 'ACTIVE'
                  ? 'Gerir cartão e faturas no Stripe, ou voltar ao escritório.'
                  : 'Activar mensal ou anual. Pagamentos dos clientes (Connect) ficam em Definições → Pagamentos.'}
              </p>
            </div>
          </div>
        ) : null}

        {!isLoading && billing ? (
          <div className={cn('cb-billing-hero', billing.hasAccess ? 'cb-billing-hero--ok' : 'cb-billing-hero--warn')}>
            {billing.hasAccess ? (
              <p>
                <strong>Acesso activo.</strong>{' '}
                {billing.status === 'TRIAL' && trialEnd
                  ? `Teste gratuito até ${trialEnd.toLocaleDateString('pt-PT')}.`
                  : 'Subscrição em vigor.'}
              </p>
            ) : (
              <p>
                <strong>Acesso em pausa.</strong>{' '}
                {trialExpired
                  ? 'Os 14 dias terminaram. Escolhe um plano para voltares ao escritório.'
                  : 'Regulariza a subscrição para continuar.'}
              </p>
            )}
          </div>
        ) : null}

        <div className="cb-billing-cards">
          <div className="cb-billing-card">
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
          </div>

          <div className="cb-billing-card">
            <p className="cb-billing-card-label">{p.plan.monthly.name}</p>
            <p className="cb-billing-card-price">
              {monthlyLabel}
              <span className="cb-billing-card-period"> / mês</span>
            </p>
            <p className="cb-billing-card-desc">{p.plan.monthly.note} · por escritório</p>
            <ul className="cb-billing-card-features">
              {p.plan.features.map((f) => (
                <li key={f}>
                  <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brand" aria-hidden />
                  {f}
                </li>
              ))}
            </ul>
            {billing?.stripeConfigured !== false ? (
              <div className="cb-billing-card-cta">
                <Button
                  type="button"
                  variant="outline"
                  className={cn('w-full rounded-full', !monthlyReady && 'opacity-60')}
                  disabled={loadingCheckout !== null || billing?.status === 'ACTIVE' || !monthlyReady}
                  onClick={() => void startCheckout('month')}
                >
                  {loadingCheckout === 'month' ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <CreditCard className="mr-2 h-4 w-4" />
                  )}
                  Activar mensal ({monthlyLabel})
                </Button>
              </div>
            ) : null}
          </div>

          <div className="cb-billing-card cb-billing-card-featured">
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
            {billing?.stripeConfigured !== false ? (
              <div className="cb-billing-card-cta">
                <Button
                  type="button"
                  className="w-full rounded-full"
                  disabled={loadingCheckout !== null || billing?.status === 'ACTIVE' || !yearlyReady}
                  onClick={() => void startCheckout('year')}
                >
                  {loadingCheckout === 'year' ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <CreditCard className="mr-2 h-4 w-4" />
                  )}
                  Activar anual ({yearlyLabel})
                </Button>
              </div>
            ) : null}
          </div>
        </div>

        <p className="mt-2 text-xs text-muted-foreground">{p.plan.vatNote}</p>

        {billing?.stripeConfigured === false ? (
          <p className="mt-4 text-sm text-muted-foreground">
            Pagamentos ainda a configurar. Escreve para{' '}
            <a href={`mailto:${BRAND.emails.hello}`} className="font-medium text-brand hover:underline">
              {BRAND.emails.hello}
            </a>
            .
          </p>
        ) : null}

        {billing?.stripeConfigured !== false && !yearlyReady ? (
          <p className="mt-2 text-xs text-muted-foreground">
            Plano anual: falta configurar <code>STRIPE_PRICE_ID_EUR_YEARLY</code> no Render.
          </p>
        ) : null}

        <div className="cb-billing-notice mt-8">
          <ReceiptText className="mb-2 h-5 w-5 text-brand" aria-hidden />
          <p>
            Pagamento seguro via Stripe. Cancela quando quiseres. Dúvidas:{' '}
            <a href={`mailto:${BRAND.emails.support}`} className="font-medium text-brand hover:underline">
              {BRAND.emails.support}
            </a>
            .
          </p>
        </div>

        <div className="mt-6 flex flex-wrap gap-2">
          {billing?.hasSubscription ? (
            <Button
              type="button"
              variant="ghost"
              className="rounded-full"
              disabled={loadingPortal}
              onClick={() => void openPortal()}
            >
              {loadingPortal ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ReceiptText className="mr-2 h-4 w-4" />}
              Gerir no Stripe
            </Button>
          ) : null}
          <Button asChild variant="outline" className="rounded-full">
            <Link to="/#precos">Ver preços no site</Link>
          </Button>
          {billing?.hasAccess ? (
            <Button asChild variant="ghost" className="rounded-full">
              <Link to="/app/firm/dashboard">Voltar ao painel</Link>
            </Button>
          ) : null}
        </div>
      </div>
    </FirmScrollPage>
  )
}
