import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { CreditCard, Loader2, ReceiptText } from 'lucide-react'

import { FirmScrollPage } from '@/features/firm/FirmPageLayout'
import { BRAND } from '@/shared/config/brand'
import { contabilPt as t } from '@/shared/i18n/contabilPt'
import { BILLING_STATUS_QUERY_KEY } from '@/infrastructure/api/contabil/billing'
import { contabilBillingApi, type BillingStatus } from '@/infrastructure/api'
import { Button } from '@/shared/components/ui/button'
import { useApiToast } from '@/shared/hooks/useApiToast'
import { cn } from '@/shared/lib/utils'

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
      if (url) window.location.href = url
      else toast.error('Não foi possível abrir o checkout.')
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
      if (url) window.location.href = url
    } catch (e: unknown) {
      toast.error(e, 'Erro ao abrir portal de pagamento')
    } finally {
      setLoadingPortal(false)
    }
  }

  const monthlyReady = billing?.plans?.monthly?.configured !== false
  const yearlyReady = billing?.plans?.yearly?.configured === true

  return (
    <FirmScrollPage className="cb-billing-layout-page">
      <div className="cb-billing-page">
        <header className="cb-billing-page-hd">
          <h1 className="cb-billing-page-title">Plano e subscrição</h1>
          <p className="cb-billing-page-sub">
            14 dias de teste · depois mensal (35 €) ou anual (359,88 € — ~29,99 €/mês)
          </p>
        </header>

        {isLoading ? (
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            A carregar…
          </p>
        ) : null}

        {!isLoading && billing ? (
          <div
            className={`mb-6 rounded-xl border px-4 py-3 text-sm ${
              billing.hasAccess
                ? 'border-emerald-200 bg-emerald-50 text-emerald-900'
                : 'border-amber-200 bg-amber-50 text-amber-900'
            }`}
          >
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
            <p className="cb-billing-card-label">{p.trial.name}</p>
            <p className="cb-billing-card-price">
              {p.trial.price}
              <span className="cb-billing-card-period"> / {p.trial.period}</span>
            </p>
            <p className="cb-billing-card-desc">{p.trial.description}</p>
          </div>

          <div className="cb-billing-card">
            <p className="cb-billing-card-label">{p.plan.monthly.name}</p>
            <p className="cb-billing-card-price">
              {p.plan.monthly.price}
              <span className="cb-billing-card-period"> {p.plan.monthly.period}</span>
            </p>
            <p className="cb-billing-card-desc">{p.plan.monthly.note} · por escritório</p>
          </div>

          <div className="cb-billing-card cb-billing-card-featured">
            <p className="cb-billing-card-label">{p.plan.yearly.name}</p>
            <p className="cb-billing-card-price">
              {p.plan.yearly.price}
              <span className="cb-billing-card-period"> {p.plan.yearly.period}</span>
            </p>
            <p className="cb-billing-card-desc">{p.plan.yearly.note}</p>
            <p className="mt-2 text-xs font-medium text-brand">{p.plan.yearly.badge}</p>
          </div>
        </div>

        <ul className="mt-4 space-y-1 text-sm text-muted-foreground">
          {p.plan.features.map((f) => (
            <li key={f}>· {f}</li>
          ))}
        </ul>
        <p className="mt-2 text-xs text-muted-foreground">{p.plan.vatNote}</p>

        <div className="mt-8 flex flex-wrap gap-3">
          {billing?.stripeConfigured !== false ? (
            <>
              <Button
                type="button"
                className={cn('rounded-full', !monthlyReady && 'opacity-60')}
                disabled={loadingCheckout !== null || billing?.status === 'ACTIVE' || !monthlyReady}
                onClick={() => void startCheckout('month')}
              >
                {loadingCheckout === 'month' ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <CreditCard className="mr-2 h-4 w-4" />
                )}
                Activar mensal (35 €)
              </Button>
              <Button
                type="button"
                variant="outline"
                className="rounded-full"
                disabled={loadingCheckout !== null || billing?.status === 'ACTIVE' || !yearlyReady}
                onClick={() => void startCheckout('year')}
              >
                {loadingCheckout === 'year' ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <CreditCard className="mr-2 h-4 w-4" />
                )}
                Activar anual (359,88 €)
              </Button>
              {billing?.hasSubscription ? (
                <Button
                  type="button"
                  variant="ghost"
                  className="rounded-full"
                  disabled={loadingPortal}
                  onClick={() => void openPortal()}
                >
                  {loadingPortal ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Gerir no Stripe
                </Button>
              ) : null}
              {!yearlyReady ? (
                <p className="w-full text-xs text-muted-foreground">
                  Plano anual: falta configurar <code>STRIPE_PRICE_ID_EUR_YEARLY</code> no Render.
                </p>
              ) : null}
            </>
          ) : (
            <p className="text-sm text-muted-foreground">
              Pagamentos ainda a configurar. Escreve para{' '}
              <a href={`mailto:${BRAND.emails.hello}`} className="font-medium text-brand hover:underline">
                {BRAND.emails.hello}
              </a>
              .
            </p>
          )}
        </div>

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
