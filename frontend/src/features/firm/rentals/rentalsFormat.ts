import type { RentReceipt, RentReceiptStatus } from '@/infrastructure/api/contabil/rentals'

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

export function isReceiptOverdue(status: RentReceiptStatus | undefined, overdue?: boolean) {
  return Boolean(overdue && status === 'issued')
}

export function receiptLabelPt(status: RentReceiptStatus | undefined, overdue?: boolean): string {
  if (isReceiptOverdue(status, overdue)) return 'Em atraso'
  switch (status) {
    case 'draft':
      return 'Rascunho'
    case 'issued':
      return 'Emitido'
    case 'paid':
      return 'Pago'
    case 'cancelled':
      return 'Cancelado'
    default:
      return '—'
  }
}

export function receiptTone(status: RentReceiptStatus | undefined, overdue?: boolean): string {
  if (isReceiptOverdue(status, overdue)) return 'cb-rent-cell cb-rent-cell--overdue'
  switch (status) {
    case 'draft':
      return 'cb-rent-cell cb-rent-cell--draft'
    case 'issued':
      return 'cb-rent-cell cb-rent-cell--issued'
    case 'paid':
      return 'cb-rent-cell cb-rent-cell--paid'
    case 'cancelled':
      return 'cb-rent-cell cb-rent-cell--cancelled'
    default:
      return 'cb-rent-cell cb-rent-cell--empty'
  }
}

export type LeaseHealth = 'ok' | 'overdue' | 'open' | 'empty'

export function leaseHealth(months: Record<string, RentReceipt> | undefined): LeaseHealth {
  const values = Object.values(months || {})
  if (values.length === 0) return 'empty'
  if (values.some((r) => isReceiptOverdue(r.status, r.overdue))) return 'overdue'
  if (values.some((r) => r.status === 'issued' || r.status === 'draft')) return 'open'
  const actionable = values.filter((r) => r.status !== 'cancelled')
  if (actionable.length > 0 && actionable.every((r) => r.status === 'paid')) return 'ok'
  return 'empty'
}

export function leaseHealthLabel(health: LeaseHealth): string {
  switch (health) {
    case 'overdue':
      return 'Em atraso'
    case 'open':
      return 'Em aberto'
    case 'ok':
      return 'Em dia'
    default:
      return 'Sem recibos'
  }
}

export function leaseHealthTone(health: LeaseHealth): string {
  switch (health) {
    case 'overdue':
      return 'cb-rent-health cb-rent-health--overdue'
    case 'open':
      return 'cb-rent-health cb-rent-health--open'
    case 'ok':
      return 'cb-rent-health cb-rent-health--ok'
    default:
      return 'cb-rent-health cb-rent-health--empty'
  }
}
