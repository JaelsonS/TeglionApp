import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Loader2, Wallet } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/shared/components/ui/button'
import { EuroInput } from '@/shared/design-system'
import { contabilFeeChargesApi } from '@/infrastructure/api'
import { getErrorMessage } from '@/shared/utils/errors'
import { formatEuroFromCents, statusTone } from '@/features/firm/payments/paymentsFormat'
import { cn } from '@/shared/lib/utils'

type Props = { clientId: string; displayName: string }

export function ClientHubBillingPanel({ clientId, displayName }: Props) {
  const qc = useQueryClient()
  const query = useQuery({
    queryKey: ['client-billing', clientId],
    queryFn: () => contabilFeeChargesApi.getClientBilling(clientId),
  })

  const [euros, setEuros] = useState(0)
  const [active, setActive] = useState(false)
  const [dueDay, setDueDay] = useState(1)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const b = query.data?.billing
    if (!b) return
    setEuros((b.retainerAmountCents || 0) / 100)
    setActive(Boolean(b.retainerActive))
    setDueDay(b.retainerDueDay || 1)
  }, [query.data])

  async function save() {
    setSaving(true)
    try {
      await contabilFeeChargesApi.patchClientBilling(clientId, {
        retainerAmountCents: Math.round(euros * 100),
        retainerActive: active,
        retainerDueDay: dueDay,
      })
      toast.success('Avença guardada')
      await qc.invalidateQueries({ queryKey: ['client-billing', clientId] })
      await qc.invalidateQueries({ queryKey: ['fee-charges-map'] })
    } catch (err) {
      toast.error('Não foi possível guardar', { description: getErrorMessage(err) })
    } finally {
      setSaving(false)
    }
  }

  if (query.isLoading) {
    return (
      <div className="flex items-center gap-2 p-6 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden />A carregar faturação…
      </div>
    )
  }

  if (query.isError || !query.data) {
    return (
      <div className="cb-client-hub-panel p-5">
        <p className="text-sm text-destructive">{getErrorMessage(query.error)}</p>
      </div>
    )
  }

  const charges = (query.data.charges || []) as Array<{
    id: string
    yearMonth: string
    amountCents: number
    status: 'draft' | 'confirmed' | 'sent' | 'paid' | 'cancelled'
    overdue?: boolean
    paymentMethod?: string | null
  }>
  const summary = query.data.summary as {
    paidCents: number
    openCents: number
    overdueCents: number
    draftCents: number
  }

  return (
    <div className="space-y-4">
      <section className="cb-client-hub-panel space-y-4 p-4 sm:p-5">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand/10 text-brand">
            <Wallet className="h-5 w-5" aria-hidden />
          </div>
          <div>
            <h2 className="text-base font-semibold tracking-tight">Avença mensal</h2>
            <p className="mt-0.5 text-sm text-muted-foreground">
              Honorários de {displayName}. Pode registar tudo à mão — Stripe Connect é opcional.
            </p>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <label className="space-y-1.5 text-sm sm:col-span-1">
            <span className="font-medium">Valor mensal</span>
            <EuroInput value={euros} onChange={setEuros} />
          </label>
          <label className="space-y-1.5 text-sm">
            <span className="font-medium">Dia de vencimento</span>
            <select
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
              value={dueDay}
              onChange={(e) => setDueDay(Number(e.target.value))}
            >
              {Array.from({ length: 28 }, (_, i) => i + 1).map((d) => (
                <option key={d} value={d}>
                  Dia {d}
                </option>
              ))}
            </select>
          </label>
          <label className="flex items-end gap-2 pb-2 text-sm">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-input"
              checked={active}
              onChange={(e) => setActive(e.target.checked)}
            />
            <span>Incluir em «Gerar pagamentos»</span>
          </label>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button type="button" onClick={() => void save()} disabled={saving}>
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />A guardar…
              </>
            ) : (
              'Guardar avença'
            )}
          </Button>
          <Button asChild type="button" variant="outline">
            <Link to="/app/firm/payments">Abrir mapa de pagamentos</Link>
          </Button>
        </div>
      </section>

      <section className="cb-client-hub-panel space-y-3 p-4 sm:p-5">
        <h3 className="text-sm font-semibold">Saldos este ano</h3>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <MiniStat label="Pago" value={formatEuroFromCents(summary.paidCents)} />
          <MiniStat label="Em aberto" value={formatEuroFromCents(summary.openCents)} />
          <MiniStat label="Em atraso" value={formatEuroFromCents(summary.overdueCents)} />
          <MiniStat label="Rascunho" value={formatEuroFromCents(summary.draftCents)} />
        </div>
      </section>

      <section className="cb-client-hub-panel space-y-3 p-4 sm:p-5">
        <h3 className="text-sm font-semibold">Histórico {new Date().getFullYear()}</h3>
        {charges.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Ainda sem pagamentos gerados. Active a avença e use Gerar no mapa de Pagamentos.
          </p>
        ) : (
          <ul className="divide-y divide-border/50">
            {charges.map((c) => (
              <li key={c.id} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                <span className="font-medium tabular-nums">{c.yearMonth}</span>
                <span
                  className={cn(
                    'rounded-md border px-2 py-0.5 text-xs font-medium',
                    statusTone(c.status, c.overdue),
                  )}
                >
                  {formatEuroFromCents(c.amountCents)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <p className="px-1 text-xs leading-relaxed text-muted-foreground">
        Quer cobrar online? Em{' '}
        <Link to="/app/firm/settings?tab=pagamentos" className="font-medium text-brand hover:underline">
          Definições → Pagamentos
        </Link>{' '}
        pode ligar a Stripe Connect. Não é obrigatório — o mapa funciona sempre em modo manual.
      </p>
    </div>
  )
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border/60 bg-muted/20 px-3 py-2">
      <p className="text-[11px] text-muted-foreground">{label}</p>
      <p className="text-sm font-semibold tabular-nums">{value}</p>
    </div>
  )
}
