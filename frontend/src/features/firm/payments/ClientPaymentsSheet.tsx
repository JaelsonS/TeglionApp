import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Loader2, Plus, Wallet } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/shared/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/shared/components/ui/sheet'
import { EuroInput } from '@/shared/design-system'
import { contabilFeeChargesApi } from '@/infrastructure/api'
import type { ClientBilling, FeeCharge } from '@/infrastructure/api/contabil/feeCharges'
import { getErrorMessage } from '@/shared/utils/errors'
import {
  MONTH_SHORT,
  countOverdueCharges,
  formatEuroFromCents,
  rowHealthLabel,
  rowHealthTone,
  rowPaymentHealth,
  statusLabelPt,
  statusTone,
} from '@/features/firm/payments/paymentsFormat'
import { cn } from '@/shared/lib/utils'

export type PaymentsMapRow = {
  clientId: string
  displayName: string
  taxId?: string | null
  billing: ClientBilling
  months: Record<string, FeeCharge>
}

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  row: PaymentsMapRow | null
  year: number
  monthKeys: string[]
  onEditCharge: (charge: FeeCharge, clientName: string) => void
  onCreateMonth?: (yearMonth: string) => void
  creatingYearMonth?: string | null
  onBillingSaved: () => void
}

export function ClientPaymentsSheet({
  open,
  onOpenChange,
  row,
  year,
  monthKeys,
  onEditCharge,
  onCreateMonth,
  creatingYearMonth,
  onBillingSaved,
}: Props) {
  const [euros, setEuros] = useState(0)
  const [active, setActive] = useState(false)
  const [dueDay, setDueDay] = useState(1)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!row) return
    setEuros((row.billing.retainerAmountCents || 0) / 100)
    setActive(Boolean(row.billing.retainerActive))
    setDueDay(row.billing.retainerDueDay || 1)
  }, [row])

  const health = useMemo(() => (row ? rowPaymentHealth(row.months) : 'empty'), [row])
  const overdueCount = useMemo(() => (row ? countOverdueCharges(row.months) : 0), [row])

  async function saveBilling() {
    if (!row) return
    setSaving(true)
    try {
      await contabilFeeChargesApi.patchClientBilling(row.clientId, {
        retainerAmountCents: Math.round(euros * 100),
        retainerActive: active,
        retainerDueDay: dueDay,
      })
      toast.success('Avença actualizada')
      onBillingSaved()
    } catch (err) {
      toast.error('Não foi possível guardar', { description: getErrorMessage(err) })
    } finally {
      setSaving(false)
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="flex w-full flex-col gap-0 overflow-y-auto sm:max-w-md">
        <SheetHeader className="shrink-0 border-b border-border/60 pb-4 text-left">
          <SheetTitle className="pr-8">{row?.displayName || 'Cliente'}</SheetTitle>
          <SheetDescription>
            {row?.taxId ? `NIF ${row.taxId}` : 'Sem NIF'} · Avenças {year} — edita aqui, sem sair do
            mapa.
          </SheetDescription>
          {row ? (
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span className={cn(rowHealthTone(health))}>{rowHealthLabel(health)}</span>
              {overdueCount > 0 ? (
                <span className="text-xs font-medium text-rose-700">
                  {overdueCount} mês{overdueCount === 1 ? '' : 'es'} em atraso
                </span>
              ) : null}
            </div>
          ) : null}
        </SheetHeader>

        {row ? (
          <div className="flex flex-1 flex-col gap-5 py-4">
            <section className="space-y-3 rounded-xl border border-border/70 bg-card p-4">
              <div className="flex items-start gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand/10 text-brand">
                  <Wallet className="h-4 w-4" aria-hidden />
                </span>
                <div>
                  <h3 className="text-sm font-semibold">Avença mensal</h3>
                  <p className="text-xs text-muted-foreground">
                    Valor e dia de vencimento. Inclua em «Gerar avenças» para o mapa.
                  </p>
                </div>
              </div>

              <label className="block space-y-1.5 text-sm">
                <span className="font-medium">Valor mensal</span>
                <EuroInput value={euros} onChange={setEuros} />
              </label>

              <label className="block space-y-1.5 text-sm">
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

              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-input"
                  checked={active}
                  onChange={(e) => setActive(e.target.checked)}
                />
                <span>Avença activa (entra no gerar)</span>
              </label>

              <Button type="button" className="w-full" onClick={() => void saveBilling()} disabled={saving}>
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />A guardar…
                  </>
                ) : (
                  'Guardar avença'
                )}
              </Button>
            </section>

            <section className="space-y-3">
              <h3 className="text-sm font-semibold">Meses {year}</h3>
              <p className="text-xs text-muted-foreground">
                Clique num mês para editar estado, valor e método — fica nesta página.
              </p>
              <ul className="grid grid-cols-3 gap-2">
                {monthKeys.map((ym, i) => {
                  const cell = row.months[ym]
                  const busy = creatingYearMonth === ym
                  return (
                    <li key={ym}>
                      {cell ? (
                        <button
                          type="button"
                          className={cn(
                            'flex w-full flex-col items-center gap-0.5 rounded-lg border px-2 py-2.5 text-center transition hover:opacity-95',
                            statusTone(cell.status, cell.overdue),
                          )}
                          onClick={() => onEditCharge(cell, row.displayName)}
                        >
                          <span className="text-[10px] font-semibold uppercase tracking-wide opacity-80">
                            {MONTH_SHORT[i]}
                          </span>
                          <span className="text-xs font-bold tabular-nums">
                            {formatEuroFromCents(cell.amountCents).replace('\u00a0€', '€')}
                          </span>
                          <span className="text-[10px] font-medium leading-tight">
                            {statusLabelPt(cell.status, cell.overdue)}
                          </span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          className="flex w-full flex-col items-center gap-0.5 rounded-lg border border-dashed border-brand/40 bg-brand/5 px-2 py-2.5 text-center text-brand transition hover:bg-brand/10"
                          disabled={busy || !onCreateMonth}
                          onClick={() => onCreateMonth?.(ym)}
                        >
                          <span className="text-[10px] font-semibold uppercase tracking-wide">
                            {MONTH_SHORT[i]}
                          </span>
                          {busy ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
                          ) : (
                            <>
                              <Plus className="h-3.5 w-3.5" aria-hidden />
                              <span className="text-[10px] font-medium">Criar</span>
                            </>
                          )}
                        </button>
                      )}
                    </li>
                  )
                })}
              </ul>
            </section>

            <p className="text-xs text-muted-foreground">
              Ficha completa do cliente:{' '}
              <Link
                to={`/app/firm/clients/${row.clientId}?section=billing`}
                className="font-medium text-brand underline-offset-2 hover:underline"
              >
                abrir hub · Faturação
              </Link>
            </p>
          </div>
        ) : null}
      </SheetContent>
    </Sheet>
  )
}
