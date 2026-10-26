import type { SaftImport } from '@/infrastructure/api/contabil/saft'

export type SaftValidationTone = 'ok' | 'warning' | 'invalid'

export function formatEuroFromCents(cents: number | null | undefined): string {
  if (cents == null) return '—'
  return new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(cents / 100)
}

export function formatBytes(n: number): string {
  if (!Number.isFinite(n) || n < 0) return '—'
  if (n < 1024) return `${n} B`
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`
  return `${(n / (1024 * 1024)).toFixed(1)} MB`
}

export function formatPeriod(item: SaftImport): string {
  if (item.startDate && item.endDate) return `${item.startDate} → ${item.endDate}`
  if (item.fiscalYear) return String(item.fiscalYear)
  return '—'
}

export function validationLabel(status: SaftImport['validationStatus']): string {
  if (status === 'ok') return 'OK'
  if (status === 'warning') return 'Avisos'
  return 'Inválido'
}

export function validationBadgeClass(status: SaftImport['validationStatus']): string {
  if (status === 'ok') return 'cb-saft-badge cb-saft-badge--ok'
  if (status === 'warning') return 'cb-saft-badge cb-saft-badge--warning'
  return 'cb-saft-badge cb-saft-badge--invalid'
}

export function salesCreditCents(item: SaftImport): number | null {
  const v = item.summary?.salesInvoices?.totalCreditCents
  return typeof v === 'number' ? v : null
}

export function matchesSaftQuery(item: SaftImport, q: string): boolean {
  if (!q) return true
  const hay = [
    item.companyName,
    item.taxRegistrationNumber,
    item.originalFilename,
    item.productId,
    item.fiscalYear != null ? String(item.fiscalYear) : '',
    item.clientId,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()
  return hay.includes(q.toLowerCase())
}

export function summarizeImports(items: SaftImport[]) {
  let ok = 0
  let warning = 0
  let invalid = 0
  let salesCents = 0
  let salesKnown = false
  for (const item of items) {
    if (item.validationStatus === 'ok') ok += 1
    else if (item.validationStatus === 'warning') warning += 1
    else invalid += 1
    const credit = salesCreditCents(item)
    if (credit != null) {
      salesCents += credit
      salesKnown = true
    }
  }
  return {
    total: items.length,
    ok,
    warning,
    invalid,
    salesCents: salesKnown ? salesCents : null,
  }
}
