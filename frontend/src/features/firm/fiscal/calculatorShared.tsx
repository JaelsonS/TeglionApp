import type { ReactNode } from 'react'

import { cn } from '@/shared/lib/utils'

export type FiscalCalculationRow = {
  id: string
  calcType?: string
  ruleVersion: string
  createdAt: string
  clientId?: string | null
  input?: Record<string, unknown>
  result?: Record<string, unknown>
  meta?: Record<string, unknown>
}

export function formatEuroFromCents(cents: number) {
  return new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format((cents || 0) / 100)
}

export function centsToEuros(cents: unknown) {
  const n = typeof cents === 'number' ? cents : Number(cents)
  if (!Number.isFinite(n)) return 0
  return n / 100
}

export function ResultRow({
  label,
  value,
  strong,
}: {
  label: string
  value: string
  strong?: boolean
}) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-border/40 pb-2 last:border-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className={cn('tabular-nums text-sm', strong && 'text-base font-semibold text-foreground')}>
        {value}
      </span>
    </div>
  )
}

export function CalculatorDisclaimer({
  text,
  fallback,
}: {
  text?: string | null
  fallback: string
}) {
  return (
    <div className="cb-calc-disclaimer" role="note">
      <p className="cb-calc-disclaimer-title">Simulação de apoio — não substitui declaração oficial</p>
      <p className="cb-calc-disclaimer-body">{text || fallback}</p>
      <p className="cb-calc-disclaimer-hint">
        Confirme a legislação vigente e a revisão profissional do gabinete antes de qualquer acto fiscal.
      </p>
    </div>
  )
}

export function CalculatorResultPanel({
  empty,
  children,
}: {
  empty?: boolean
  children: ReactNode
}) {
  return (
    <section className={cn('cb-calc-result-panel', empty && 'cb-calc-result-panel--empty')}>
      <h2 className="text-sm font-semibold">Resultado</h2>
      {children}
    </section>
  )
}

export function CalculatorHistorySection({
  loading,
  emptyLabel,
  items,
  renderSummary,
  onSelect,
}: {
  loading: boolean
  emptyLabel: string
  items: FiscalCalculationRow[]
  renderSummary: (row: FiscalCalculationRow) => ReactNode
  onSelect: (row: FiscalCalculationRow) => void
}) {
  return (
    <section className="cb-calc-history">
      <h2 className="text-sm font-semibold">Histórico recente</h2>
      <p className="mt-1 text-xs text-muted-foreground">
        Clique numa linha para reabrir inputs e resultado. Cálculos guardados não mudam se as regras futuras
        forem actualizadas.
      </p>
      {loading ? (
        <p className="mt-3 text-sm text-muted-foreground">A carregar…</p>
      ) : items.length === 0 ? (
        <p className="mt-3 text-sm text-muted-foreground">{emptyLabel}</p>
      ) : (
        <ul className="mt-3 divide-y divide-border/50">
          {items.map((row) => (
            <li key={row.id}>
              <button
                type="button"
                className="cb-calc-history-row"
                onClick={() => onSelect(row)}
                data-testid={`calc-history-${row.id}`}
              >
                <span className="text-muted-foreground">
                  {new Date(row.createdAt).toLocaleString('pt-PT')} · {row.ruleVersion}
                </span>
                <span className="tabular-nums font-medium">{renderSummary(row)}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
