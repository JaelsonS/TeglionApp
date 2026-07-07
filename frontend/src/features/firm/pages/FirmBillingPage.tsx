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

export function FirmBillingPage() {
  const [params] = useSearchParams()
  const toast = useApiToast()
  const queryClient = useQueryClient()
  const [loadingCheckout, setLoadingCheckout] = useState(false)
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
      toast.success('Checkout cancelado. Pode tentar novamente quando quiser.')
    }
  }, [checkoutResult, queryClient, toast])

  const p = t.pricing
  const trialEnd = billing?.trialEndsAt ? new Date(billing.trialEndsAt) : null
  const trialExpired =
    billing?.status === 'TRIAL' && trialEnd && !Number.isNaN(trialEnd.getTime()) && trialEnd <= new Date()

  async function startCheckout() {
    setLoadingCheckout(true)
    try {
      const { url } = await contabilBillingApi.createCheckout()
      if (url) window.location.href = url
      else toast.error('Não foi possível abrir o checkout.')
    } catch (e: unknown) {
      toast.error(e, 'Erro ao iniciar pagamento')
    } finally {
      setLoadingCheckout(false)
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

  return (
    <FirmScrollPage className="cb-billing-layout-page">
      <div className="cb-billing-page">
        <header className="cb-billing-page-hd">
          <h1 className="cb-billing-page-title">Plano e subscrição</h1>
          <p className="cb-billing-page-sub">{BRAND.name} — escritório em Portugal</p>
        </header>

        {isLoading ? (
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            A carregar estado da subscrição…
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
                <strong>Acesso limitado.</strong>{' '}
                {trialExpired
                  ? 'O teste de 14 dias terminou. Active o plano para voltar ao escritório.'
                  : 'Regularize a subscrição para continuar.'}
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

          <div className="cb-billing-card cb-billing-card-featured">
            <p className="cb-billing-card-label">{p.plan.name}</p>
            <p className="cb-billing-card-price">
              {p.plan.price}
              <span className="cb-billing-card-period"> {p.plan.period}</span>
            </p>
            <p className="cb-billing-card-vat">{p.plan.vatNote}</p>
            <p className="cb-billing-card-desc">{p.plan.afterTrial}</p>
            <ul className="cb-billing-features">
              {p.plan.features.map((f) => (
                <li key={f}>{f}</li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-8 flex flex-wrap gap-3">
          {billing?.stripeConfigured !== false ? (
            <>
              <Button
                type="button"
                className="rounded-full"
                disabled={loadingCheckout || billing?.status === 'ACTIVE'}
                onClick={() => void startCheckout()}
              >
                {loadingCheckout ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <CreditCard className="mr-2 h-4 w-4" />
                )}
                Activar plano (Stripe)
              </Button>
              {billing?.hasSubscription ? (
                <Button
                  type="button"
                  variant="outline"
                  className="rounded-full"
                  disabled={loadingPortal}
                  onClick={() => void openPortal()}
                >
                  {loadingPortal ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Gerir subscrição
                </Button>
              ) : null}
            </>
          ) : (
            <p className="text-sm text-muted-foreground">
              Pagamentos online em configuração. Contacte{' '}
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
            Pagamento seguro via Stripe. Pode cancelar quando quiser. Dúvidas:{' '}
            <a href={`mailto:${BRAND.emails.support}`} className="font-medium text-brand hover:underline">
              {BRAND.emails.support}
            </a>
            .
          </p>
        </div>

        <div className="mt-6 flex flex-wrap gap-2">
          <Button asChild variant="outline" className="rounded-full">
            <Link to="/#precos">Ver preços na landing</Link>
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
