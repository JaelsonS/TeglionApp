/** Locale TegLion — Português de Portugal por defeito no produto contabilidade. */
import { APP_LOCALE_STORAGE_KEY, normalizeAppLocale, type AppLocale } from '@/shared/i18n/appLocale'
import { isContabilMode } from '@/shared/config/productMode'

export function getContabilLocale(): AppLocale {
  if (isContabilMode()) return 'pt-PT'
  return normalizeAppLocale(
    typeof window !== 'undefined' ? window.localStorage?.getItem(APP_LOCALE_STORAGE_KEY) : null,
  )
}

export function formatEuro(cents?: number | null): string {
  if (cents == null) return '—'
  return new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(cents / 100)
}

export function formatPtDate(iso?: string | null, style: 'short' | 'long' | 'date' = 'short'): string {
  if (!iso) return '—'
  const raw = String(iso)
  const dateOnly = raw.includes('T') ? raw.split('T')[0] : raw.slice(0, 10)
  const [y, m, d] = dateOnly.split('-').map(Number)
  const parsed =
    y && m && d ? new Date(y, m - 1, d) : new Date(iso)
  if (Number.isNaN(parsed.getTime())) return '—'
  if (style === 'date') {
    return parsed.toLocaleDateString('pt-PT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    })
  }
  return parsed.toLocaleString('pt-PT', {
    timeZone: 'Europe/Lisbon',
    ...(style === 'long'
      ? { dateStyle: 'full', timeStyle: 'short' }
      : { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
  })
}

export const DOCUMENT_WORKFLOW_LABELS: Record<string, string> = {
  SENT: 'Enviado',
  RECEIVED: 'Recebido',
  IN_ANALYSIS: 'Em análise',
  PROCESSED: 'Processado',
}

export const DOCUMENT_VALIDATION_LABELS: Record<string, string> = {
  PENDING: 'Pendente',
  APPROVED: 'Aprovado',
  REJECTED: 'Rejeitado',
}

export function documentValidationLabel(status?: string | null): string {
  if (!status) return '—'
  return DOCUMENT_VALIDATION_LABELS[status] || status
}

export const PAYMENT_STATUS_LABELS: Record<string, string> = {
  PENDING: 'Pendente',
  PAID: 'Pago',
  OVERDUE: 'Em atraso',
  PROCESSING: 'A processar',
}

export const PRIORITY_LABELS: Record<string, string> = {
  LOW: 'Baixa',
  NORMAL: 'Normal',
  HIGH: 'Alta',
  URGENT: 'Urgente',
}
