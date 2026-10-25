import type { FeeChargeStatus } from '@/infrastructure/api/contabil/feeCharges'

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

export function statusTone(status: FeeChargeStatus | undefined, overdue?: boolean): string {
  if (overdue && (status === 'confirmed' || status === 'sent')) {
    return 'bg-amber-100 text-amber-950 border-amber-200'
  }
  switch (status) {
    case 'draft':
      return 'bg-muted/60 text-muted-foreground border-border/60'
    case 'confirmed':
      return 'bg-sky-50 text-sky-900 border-sky-200'
    case 'sent':
      return 'bg-violet-50 text-violet-900 border-violet-200'
    case 'paid':
      return 'bg-emerald-50 text-emerald-900 border-emerald-200'
    default:
      return 'bg-background text-muted-foreground border-dashed border-border/70'
  }
}

export function statusDot(status: FeeChargeStatus | undefined, overdue?: boolean) {
  if (overdue && (status === 'confirmed' || status === 'sent')) return '●'
  switch (status) {
    case 'draft':
      return '○'
    case 'confirmed':
      return '●'
    case 'sent':
      return '●'
    case 'paid':
      return '●'
    default:
      return '·'
  }
}
