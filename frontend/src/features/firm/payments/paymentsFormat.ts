import type { FeeCharge, FeeChargeStatus } from '@/infrastructure/api/contabil/feeCharges'

export const MONTH_SHORT = [
  'Jan',
  'Fev',
  'Mar',
  'Abr',
  'Mai',
  'Jun',
  'Jul',
  'Ago',
  'Set',
  'Out',
  'Nov',
  'Dez',
] as const

export function formatEuroFromCents(cents: number | null | undefined) {
  const n = (cents || 0) / 100
  return new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(n)
}

export function isChargeOverdue(status: FeeChargeStatus | undefined, overdue?: boolean) {
  return Boolean(overdue && (status === 'confirmed' || status === 'sent'))
}

/** Rótulo curto da célula / histórico. */
export function statusLabelPt(status: FeeChargeStatus | undefined, overdue?: boolean): string {
  if (isChargeOverdue(status, overdue)) return 'Em atraso'
  switch (status) {
    case 'draft':
      return 'Rascunho'
    case 'confirmed':
      return 'Confirmada'
    case 'sent':
      return 'Enviada'
    case 'paid':
      return 'Paga'
    case 'cancelled':
      return 'Cancelada'
    default:
      return '—'
  }
}

/** Classes da célula do mapa — contraste forte para o gabinete ver o estado de relance. */
export function statusTone(status: FeeChargeStatus | undefined, overdue?: boolean): string {
  if (isChargeOverdue(status, overdue)) return 'cb-pay-cell cb-pay-cell--overdue'
  switch (status) {
    case 'draft':
      return 'cb-pay-cell cb-pay-cell--draft'
    case 'confirmed':
      return 'cb-pay-cell cb-pay-cell--confirmed'
    case 'sent':
      return 'cb-pay-cell cb-pay-cell--sent'
    case 'paid':
      return 'cb-pay-cell cb-pay-cell--paid'
    case 'cancelled':
      return 'cb-pay-cell cb-pay-cell--cancelled'
    default:
      return 'cb-pay-cell cb-pay-cell--empty'
  }
}

export type RowPaymentHealth = 'ok' | 'overdue' | 'open' | 'empty'

export function rowPaymentHealth(months: Record<string, FeeCharge>): RowPaymentHealth {
  const values = Object.values(months || {})
  if (values.length === 0) return 'empty'
  if (values.some((c) => isChargeOverdue(c.status, c.overdue))) return 'overdue'
  if (values.some((c) => c.status === 'confirmed' || c.status === 'sent' || c.status === 'draft')) {
    return 'open'
  }
  const actionable = values.filter((c) => c.status !== 'cancelled')
  if (actionable.length > 0 && actionable.every((c) => c.status === 'paid')) return 'ok'
  return 'empty'
}

export function rowHealthLabel(health: RowPaymentHealth): string {
  switch (health) {
    case 'overdue':
      return 'Inadimplente'
    case 'open':
      return 'Em aberto'
    case 'ok':
      return 'Adimplente'
    default:
      return 'Sem avenças'
  }
}

export function rowHealthTone(health: RowPaymentHealth): string {
  switch (health) {
    case 'overdue':
      return 'cb-pay-health cb-pay-health--overdue'
    case 'open':
      return 'cb-pay-health cb-pay-health--open'
    case 'ok':
      return 'cb-pay-health cb-pay-health--ok'
    default:
      return 'cb-pay-health cb-pay-health--empty'
  }
}

export function countOverdueCharges(months: Record<string, FeeCharge>): number {
  return Object.values(months || {}).filter((c) => isChargeOverdue(c.status, c.overdue)).length
}
