import type { DocumentHistoryItem } from '@/features/firm/documents/documentTypes'
import { relativeTimePt } from '@/features/firm/documents/documentDisplay'
import { formatDateTime } from '@/shared/utils/date'

export type HistoryEventTone = 'info' | 'ok' | 'warn' | 'danger' | 'muted'

export type HistoryEventView = {
  id: string
  title: string
  detail: string | null
  whenLabel: string
  absoluteWhen: string | null
  tone: HistoryEventTone
}

const ACTION_LABELS: Record<string, { title: string; tone: HistoryEventTone }> = {
  'document.preview': { title: 'Pré-visualizado', tone: 'info' },
  'document.download': { title: 'Descarregado', tone: 'info' },
  'document.approved': { title: 'Aprovado', tone: 'ok' },
  'document.rejected': { title: 'Rejeitado', tone: 'danger' },
  'document.pending': { title: 'Marcado como pendente', tone: 'warn' },
  'document.resend_requested': { title: 'Reenvio pedido ao cliente', tone: 'warn' },
  'document.validity_updated': { title: 'Validade actualizada', tone: 'info' },
  'document.removed': { title: 'Documento removido', tone: 'danger' },
}

function normalizeRawTitle(raw: string): string {
  return String(raw || '')
    .trim()
    .replace(/^document\./i, 'document.')
}

/** Remove timestamp embutido no título de actividade (“… em 25/10/2026, 21:05:54”). */
function stripEmbeddedTimestamp(title: string): string {
  return title
    .replace(/\s+em\s+\d{1,2}\/\d{1,2}\/\d{4}(?:,?\s*\d{1,2}:\d{2}(?::\d{2})?)?/gi, '')
    .replace(/\s{2,}/g, ' ')
    .trim()
}

function actorLabel(actorRole?: string | null): string | null {
  const role = String(actorRole || '').toUpperCase()
  if (!role) return null
  if (role.includes('FIRM') || role.includes('STAFF') || role.includes('OFFICE')) return 'Escritório'
  if (role.includes('CLIENT') || role.includes('PORTAL')) return 'Cliente'
  if (role.includes('SYSTEM') || role.includes('BOT')) return 'Sistema'
  return actorRole || null
}

export function describeDocumentHistoryEvent(item: DocumentHistoryItem): HistoryEventView {
  const raw = normalizeRawTitle(item.title || '')
  const mapped = ACTION_LABELS[raw]
  const actor = actorLabel(item.actorRole)
  const absoluteWhen = item.createdAt ? formatDateTime(item.createdAt) : null
  const whenLabel = item.createdAt ? relativeTimePt(item.createdAt) : ''

  if (mapped) {
    return {
      id: item.id,
      title: mapped.title,
      detail: [actor, item.description].filter(Boolean).join(' · ') || null,
      whenLabel,
      absoluteWhen,
      tone: mapped.tone,
    }
  }

  // Títulos já em PT (activity) — limpar data embutida e tornar legível
  let title = stripEmbeddedTimestamp(raw) || 'Evento'
  if (/^document\./i.test(title)) {
    title = title.replace(/^document\./i, '').replace(/[._]/g, ' ')
    title = title.charAt(0).toUpperCase() + title.slice(1)
  }

  const tone: HistoryEventTone = /rejeit|removid|erro/i.test(title)
    ? 'danger'
    : /aprov|entregue|conclu/i.test(title)
      ? 'ok'
      : /reenvio|pendente|aguarda/i.test(title)
        ? 'warn'
        : 'muted'

  const detailParts = [actor, item.description].filter(Boolean)

  return {
    id: item.id,
    title,
    detail: detailParts.length ? detailParts.join(' · ') : null,
    whenLabel,
    absoluteWhen,
    tone,
  }
}

export function historyEventToneClass(tone: HistoryEventTone): string {
  if (tone === 'ok') return 'cb-docs-hist-event--ok'
  if (tone === 'warn') return 'cb-docs-hist-event--warn'
  if (tone === 'danger') return 'cb-docs-hist-event--danger'
  if (tone === 'info') return 'cb-docs-hist-event--info'
  return 'cb-docs-hist-event--muted'
}
