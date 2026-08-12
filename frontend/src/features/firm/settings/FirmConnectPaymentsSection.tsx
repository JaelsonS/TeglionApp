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
import {
  connectPendingSummary,
  humanizeConnectDisabledReason,
} from '@/features/firm/settings/connectStatusCopy'
import { getErrorMessage } from '@/shared/utils/errors'
import { openExternalUrl } from '@/shared/utils/openExternalUrl'
import { cn } from '@/shared/lib/utils'

function statusLabel(status: string | undefined, ready: boolean) {
  if (ready) return 'Pronto a receber dos clientes'
  if (status === 'restricted') return 'Falta concluir na Stripe'
  if (status === 'pending') return 'Configuração em curso'
  if (status === 'complete') return 'Conta pronta'
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
      toast.message('A actualizar o estado…', {
        description: 'Quando a Stripe confirmar, o estado fica actualizado aqui.',
      })
      void qc.invalidateQueries({ queryKey: CONNECT_STATUS_QUERY_KEY })
    } else if (connect === 'refresh') {
      toast.message('Pode continuar a configuração na Stripe')
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
  const termsOutdated = Boolean(account && data?.terms && !data.terms.accepted)
  const pendingCopy = connectPendingSummary({
    disabledReason: account?.requirementsDisabledReason,
    currentlyDue: account?.requirementsCurrentlyDue,
  })

  const startWithTerms = async () => {
    if (!accepted) {
      toast.error('Leia e aceite a política para continuar')
      return
    }
    setSubmitting(true)
    try {
      const res = await contabilConnectApi.startOnboarding({ acceptedConnectTerms: true })
      if (res?.alreadyReady || !res?.url) {
        toast.success('Política aceite')
        setTermsOpen(false)
        await qc.invalidateQueries({ queryKey: CONNECT_STATUS_QUERY_KEY })
        setSubmitting(false)
        return
      }
      openExternalUrl(res.url)
      toast.message('Stripe aberta noutra aba', {
        description: 'Conclua a configuração na nova aba. Esta página do Teglion mantém-se aberta.',
      })
      setTermsOpen(false)
      setSubmitting(false)
      void qc.invalidateQueries({ queryKey: CONNECT_STATUS_QUERY_KEY })
    } catch (err) {
      toast.error('Não foi possível abrir a Stripe', {
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
      openExternalUrl(res.url)
      toast.message('Stripe aberta noutra aba', {
        description: 'Conclua os passos na nova aba e volte aqui quando terminar.',
      })
      setSubmitting(false)
      void qc.invalidateQueries({ queryKey: CONNECT_STATUS_QUERY_KEY })
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
              Receba online na conta do escritório — o dinheiro não passa pela Teglion.
            </p>
          </div>
          <ModuleHelpDialog
            title="Pagamentos online"
            intro="Ligue a conta Stripe do escritório para os clientes pagarem no Checkout. A Teglion só faz a ponte técnica — não guarda o dinheiro."
            triggerLabel="Como funciona?"
            steps={[
              {
                title: 'Só o responsável',
                description: 'Apenas o dono do escritório pode iniciar ou alterar esta ligação.',
              },
              {
                title: 'Política e aceite',
                description:
                  'Antes de continuar, leia a política (fica registada com data e versão). Os detalhes comerciais estão lá.',
              },
              {
                title: 'Stripe trata do resto',
                description:
                  'Identidade, processamento e transferências para o banco ficam na Stripe, na conta do escritório.',
              },
              {
                title: 'Mensalidade à parte',
                description:
                  'O plano Teglion (mensalidade) é outro fluxo — não se mistura com o que os clientes pagam pelos serviços.',
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
                Os pagamentos online ainda não estão disponíveis neste ambiente.
              </p>
            ) : null}
            {account ? (
              <ul className="mt-2 space-y-1 text-muted-foreground">
                <li>Receber pagamentos: {account.chargesEnabled ? 'activo' : 'ainda não'}</li>
                <li>Transferir para o banco: {account.payoutsEnabled ? 'activo' : 'ainda não'}</li>
                <li>Dados enviados à Stripe: {account.detailsSubmitted ? 'sim' : 'em falta'}</li>
              </ul>
            ) : configured ? (
              <p className="mt-1 text-muted-foreground">
                Ainda não associou a conta Stripe do escritório.
              </p>
            ) : null}
            {!ready && account ? (
              <p className="mt-2 flex items-start gap-1.5 text-amber-900">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
                <span>
                  {humanizeConnectDisabledReason(account.requirementsDisabledReason) || pendingCopy}
                </span>
              </p>
            ) : null}
          </div>
        </div>
      </div>

      <p className="text-sm leading-relaxed text-muted-foreground">
        Os clientes pagam no Checkout da Stripe; o valor fica na conta do escritório. A Teglion não
        custodia esse dinheiro. Condições e responsabilidades estão na política que o responsável
        aceita ao ligar os pagamentos.
      </p>

      {termsOutdated ? (
        <div className="rounded-xl border border-amber-200/80 bg-amber-50/70 px-4 py-3 text-sm text-amber-950">
          <p className="font-medium">Há uma actualização da política</p>
          <p className="mt-1 text-amber-950/90">
            Peça ao responsável do escritório para a ler e aceitar antes de continuar.
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
              Ler e aceitar
            </Button>
          ) : null}
        </div>
      ) : null}

      {query.isLoading ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden />A carregar…
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
            Ligar pagamentos online
          </Button>
        ) : null}

        {configured && canStart && account && !ready ? (
          <Button type="button" onClick={() => void refreshLink()} disabled={submitting}>
            {submitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />A abrir…
              </>
            ) : (
              'Continuar na Stripe'
            )}
          </Button>
        ) : null}

        {configured && canStart && account && ready && termsOutdated ? (
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setAccepted(false)
              setTermsOpen(true)
            }}
            disabled={submitting}
          >
            Aceitar política actualizada
          </Button>
        ) : null}

        {configured && !canStart ? (
          <p className="text-sm text-muted-foreground">
            Só o responsável (dono) do escritório pode gerir esta ligação.
          </p>
        ) : null}
      </div>

      <Dialog open={termsOpen} onOpenChange={setTermsOpen}>
        <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>{data?.terms?.title || 'Política de pagamentos online'}</DialogTitle>
            <DialogDescription>
              Leia com atenção. O aceite fica registado (data, hora, IP e versão) para auditoria.
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
              Li e aceito esta política, incluindo as condições descritas no texto acima. Compreendo
              que a Teglion não custodia o dinheiro dos clientes.
            </span>
          </label>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={() => setTermsOpen(false)} disabled={submitting}>
              Cancelar
            </Button>
            <Button type="button" onClick={() => void startWithTerms()} disabled={!accepted || submitting}>
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />A abrir…
                </>
              ) : (
                'Aceitar e continuar'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  )
}
