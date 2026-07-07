import type { ContabilDocument } from '@/shared/types/contabil'
import { formatPtDate } from '@/shared/utils/contabilLocale'

const VALIDATION_PT: Record<string, string> = {
  PENDING: 'Pendente',
  APPROVED: 'Aprovado',
  REJECTED: 'Rejeitado',
}

/** Nome legível para o cliente — evita nomes de ficheiro técnicos. */
export function clientDocumentDisplayName(doc: ContabilDocument): string {
  const title = (doc.title || '').trim()
  if (title && !looksLikeRawFilename(title)) return title

  const category = (doc.category || '').trim()
  const period = (doc.period || '').trim()
  if (category && period) return `${category} — ${period}`
  if (category) return category
  if (period) return `Documento — ${period}`
  if (doc.createdAt) return `Documento de ${formatPtDate(doc.createdAt)}`

  const raw = (doc.originalName || title || '').trim()
  if (raw && !looksLikeRawFilename(raw)) return raw
  return 'Documento'
}

function looksLikeRawFilename(name: string): boolean {
  if (/^\d{6,}/.test(name)) return true
  if (/\.(pdf|png|jpe?g|xlsx?|docx?)$/i.test(name) && name.length > 24) return true
  if (/^[A-Z0-9_-]{20,}\./i.test(name)) return true
  return false
}

export function clientDocumentValidationLabel(status?: string): string {
  if (!status) return '—'
  return VALIDATION_PT[status] || status
}
