import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { AlertTriangle, CheckCircle2, CreditCard, Loader2, Shield } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/shared/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/components/ui/dialog'
import { ModuleHelpDialog } from '@/shared/design-system/ModuleHelpDialog'
import {
  CONNECT_STATUS_QUERY_KEY,
  contabilConnectApi,
} from '@/infrastructure/api'
import { getErrorMessage } from '@/shared/utils/errors'
import { cn } from '@/shared/lib/utils'

function statusLabel(status: string | undefined, ready: boolean) {
  if (ready) return 'Pronto a receber pagamentos'
  if (status === 'restricted') return 'Acção necessária na Stripe'
  if (status === 'pending') return 'Configuração em curso'
  if (status === 'complete') return 'Conta completa'
  return 'Ainda não ligado'
}

export function FirmConnectPaymentsSection() {
  const qc = useQueryClient()
  const [searchParams, setSearchParams] = useSearchParams()
  const [termsOpen, setTermsOpen] = useState(false)
  const [accepted, setAccepted] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const query = useQuery({
    queryKey: CONNECT_STATUS_QUERY_KEY,
    queryFn: () => contabilConnectApi.getStatus(),
  })

  useEffect(() => {
    const connect = searchParams.get('connect')
    if (!connect) return
    if (connect === 'return') {
      toast.message('A actualizar o estado Stripe…', {
        description: 'O estado final confirma-se quando a Stripe notificar o Teglion.',
      })
      void qc.invalidateQueries({ queryKey: CONNECT_STATUS_QUERY_KEY })
    } else if (connect === 'refresh') {
      toast.message('Continue a configuração na Stripe')
    }
    setSearchParams(
      (prev) => {
        const p = new URLSearchParams(prev)
        p.delete('connect')
        return p
      },
      { replace: true },
    )
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams])

  const data = query.data
  const account = data?.account
  const ready = Boolean(account?.readyForCharges || account?.chargesEnabled)
  const canStart = Boolean(data?.canStartOnboarding)
  const configured = Boolean(data?.configured)
  const feePercent = data?.platformFeePercent || '2'
  const termsOutdated = Boolean(account && data?.terms && !data.terms.accepted)

  const startWithTerms = async () => {
    if (!accepted) {
      toast.error('Tem de ler e aceitar a política para continuar')
      return
    }
    setSubmitting(true)
    try {
      const res = await contabilConnectApi.startOnboarding({ acceptedConnectTerms: true })
      if (res?.alreadyReady || !res?.url) {
        toast.success('Política aceite', {
          description: 'A taxa de serviço Teglion e as responsabilidades ficam registadas.',
        })
        setTermsOpen(false)
        await qc.invalidateQueries({ queryKey: CONNECT_STATUS_QUERY_KEY })
        setSubmitting(false)
        return
      }
      window.location.assign(res.url)
    } catch (err) {
      toast.error('Não foi possível iniciar a ligação Stripe', {
        description: getErrorMessage(err),
      })
      setSubmitting(false)
    }
  }

  const refreshLink = async () => {
    setSubmitting(true)
    try {
      const res = await contabilConnectApi.refreshOnboarding()
      if (!res?.url) throw new Error('URL em falta')
      window.location.assign(res.url)
    } catch (err) {
      const code = (err as { response?: { data?: { code?: string } } })?.response?.data?.code
      if (code === 'CONNECT_TERMS_REQUIRED' || code === 'CONNECT_NOT_STARTED') {
        setAccepted(false)
        setTermsOpen(true)
      }
      toast.error('Não foi possível continuar', { description: getErrorMessage(err) })
      setSubmitting(false)
    }
  }

  return (
    <section className="cb-settings-panel space-y-6">
      <div className="cb-settings-panel-hd">
        <span className="cb-settings-panel-icon">
          <CreditCard className="h-4 w-4" aria-hidden />
        </span>
        <div className="flex flex-1 flex-wrap items-start justify-between gap-3">
          <div>
            <h3 className="cb-settings-panel-title">Pagamentos dos clientes</h3>
            <p className="cb-settings-panel-sub">
              Stripe Connect — o dinheiro dos seus clientes vai para a sua conta Stripe, não para a
              Teglion.
            </p>
          </div>
          <ModuleHelpDialog
            title="Pagamentos online (Stripe Connect)"
            intro="O Teglion liga o seu escritório à Stripe para receber pagamentos dos clientes. A Teglion não custodia dinheiro."
            steps={[
              {
                title: 'Só o dono',
                description: 'Apenas o responsável (dono) do escritório pode iniciar a ligação.',
              },
              {
                title: 'Aceite registado',
                description:
                  'Antes, tem de ler e aceitar a política — inclui a taxa de serviço Teglion e a separação das taxas Stripe.',
              },
              {
                title: 'Stripe processa',
                description:
                  'A Stripe trata do KYC, do processamento e dos payouts na sua Connected Account.',
              },
              {
                title: 'Taxa Teglion',
                description: `Em cada pagamento online dos seus clientes, a Teglion retém ${feePercent}% como taxa de serviço da plataforma (integração, Checkout, hold e confirmação). As taxas Stripe são à parte.`,
              },
              {
                title: 'Billing separado',
                description:
                  'A mensalidade Teglion (plano) é um fluxo separado — não misturar com pagamentos dos clientes.',
              },
            ]}
          />
        </div>
      </div>

      <div
        className={cn(
          'rounded-xl border px-4 py-3 text-sm',
          ready ? 'border-emerald-200 bg-emerald-50/80 text-emerald-950' : 'border-border bg-muted/30',
        )}
        role="status"
      >
        <div className="flex items-start gap-2">
          {ready ? (
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          ) : (
            <Shield className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          )}
          <div>
            <p className="font-medium">{statusLabel(account?.onboardingStatus, ready)}</p>
            {!configured ? (
              <p className="mt-1 text-muted-foreground">
                Pagamentos online ainda não estão activos neste ambiente (modo teste / feature flag).
              </p>
            ) : null}
            {account ? (
              <ul className="mt-2 space-y-1 text-muted-foreground">
                <li>Cobranças (charges): {account.chargesEnabled ? 'activas' : 'pendentes'}</li>
                <li>Payouts: {account.payoutsEnabled ? 'activos' : 'pendentes'}</li>
                <li>Detalhes submetidos: {account.detailsSubmitted ? 'sim' : 'ainda não'}</li>
              </ul>
            ) : configured ? (
              <p className="mt-1 text-muted-foreground">Ainda não ligou a conta Stripe do escritório.</p>
            ) : null}
            {account?.requirementsDisabledReason ? (
              <p className="mt-2 flex items-start gap-1.5 text-amber-800">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
                {account.requirementsDisabledReason}
              </p>
            ) : null}
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-border/80 bg-background px-4 py-3 text-sm leading-relaxed text-muted-foreground">
        <p className="font-medium text-foreground">Importante</p>
        <p className="mt-1">
          A Teglion vende o software e a integração de pagamentos. Os pagamentos dos seus clientes
          são processados pela <strong className="font-medium text-foreground">Stripe</strong> na
          conta Connect do seu escritório. Em cada pagamento online, a Teglion retém{' '}
          <strong className="font-medium text-foreground">{feePercent}%</strong> como{' '}
          <strong className="font-medium text-foreground">taxa de serviço da plataforma</strong>{' '}
          (página pública, agendamento, Checkout e confirmação automática). As taxas de processamento
          da Stripe são cobradas pela Stripe à parte. A Teglion não custodia o dinheiro dos clientes.
        </p>
      </div>

      {termsOutdated ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50/90 px-4 py-3 text-sm text-amber-950">
          <p className="font-medium">Política actualizada</p>
          <p className="mt-1">
            Há uma nova versão da política (inclui a taxa de serviço de {feePercent}%). Peça ao
            responsável do escritório para a ler e aceitar.
          </p>
          {canStart ? (
            <Button
              type="button"
              className="mt-3"
              variant="outline"
              onClick={() => {
                setAccepted(false)
                setTermsOpen(true)
              }}
            >
              Ler e aceitar a nova política
            </Button>
          ) : null}
        </div>
      ) : null}

      {query.isLoading ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden />A carregar estado…
        </div>
      ) : null}

      {query.isError ? (
        <p className="text-sm text-destructive">{getErrorMessage(query.error)}</p>
      ) : null}

      <div className="flex flex-wrap gap-2">
        {configured && canStart && !account ? (
          <Button
            type="button"
            onClick={() => {
              setAccepted(false)
              setTermsOpen(true)
            }}
            disabled={submitting}
          >
            Ligar Stripe Connect
          </Button>
        ) : null}

        {configured && canStart && account && !ready ? (
          <Button type="button" onClick={() => void refreshLink()} disabled={submitting}>
            {submitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />A redireccionar…
              </>
            ) : (
              'Continuar configuração na Stripe'
            )}
          </Button>
        ) : null}

        {configured && !canStart ? (
          <p className="text-sm text-muted-foreground">
            Apenas o responsável (dono) do escritório pode ligar ou alterar o Stripe Connect.
          </p>
        ) : null}
      </div>

      <Dialog open={termsOpen} onOpenChange={setTermsOpen}>
        <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>{data?.terms?.title || 'Política de pagamentos online'}</DialogTitle>
            <DialogDescription>
              Leia com atenção. O seu aceite fica registado (data, hora, IP e versão do texto) para
              efeitos de auditoria.
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-[40vh] overflow-y-auto whitespace-pre-wrap rounded-lg border bg-muted/20 p-3 text-sm leading-relaxed">
            {data?.terms?.body || 'A carregar política…'}
          </div>
          <label className="flex cursor-pointer items-start gap-2 text-sm">
            <input
              type="checkbox"
              className="mt-1"
              checked={accepted}
              onChange={(e) => setAccepted(e.target.checked)}
            />
            <span>
              Li e aceito esta política, incluindo a taxa de serviço Teglion de {feePercent}% por
              pagamento online. Compreendo que as taxas Stripe são à parte e que a Teglion não
              custodia o dinheiro dos clientes.
            </span>
          </label>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={() => setTermsOpen(false)} disabled={submitting}>
              Cancelar
            </Button>
            <Button type="button" onClick={() => void startWithTerms()} disabled={!accepted || submitting}>
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />A abrir Stripe…
                </>
              ) : (
                'Aceitar e continuar para a Stripe'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  )
}
