import {
  File,
  FileArchive,
  FileImage,
  FileSpreadsheet,
  FileText,
  type LucideIcon,
} from 'lucide-react'

import { documentValidationLabel } from '@/shared/utils/contabilLocale'
import { safeDisplayText } from '@/shared/utils/safeDisplayText'
import type { DocumentGroupMode, FirmDocumentRow } from './documentTypes'

export function displayDocumentName(d: Pick<FirmDocumentRow, 'title' | 'originalName'>): string {
  return safeDisplayText(d.title || d.originalName, 'Documento')
}

export function displayClientName(d: FirmDocumentRow): string {
  return safeDisplayText(d.clientName, 'Cliente')
}

export function isFirmUploaded(d: Pick<FirmDocumentRow, 'uploadedByRole'>): boolean {
  return d.uploadedByRole === 'FIRM'
}

export function uploadedByLabel(d: Pick<FirmDocumentRow, 'uploadedByRole'>): string {
  return isFirmUploaded(d) ? 'Escritório' : 'Cliente'
}

export function formatFileSize(bytes?: number | null): string {
  if (bytes == null || bytes <= 0) return '—'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export type MimeKind = 'pdf' | 'image' | 'spreadsheet' | 'archive' | 'document' | 'other'

export function mimeKind(mimeType?: string | null, title?: string): MimeKind {
  const m = String(mimeType || '').toLowerCase()
  const name = String(title || '').toLowerCase()
  if (m.includes('pdf') || name.endsWith('.pdf')) return 'pdf'
  if (m.startsWith('image/') || /\.(png|jpe?g|webp|gif)$/i.test(name)) return 'image'
  if (m.includes('spreadsheet') || m.includes('excel') || /\.(xlsx?|csv)$/i.test(name)) return 'spreadsheet'
  if (m.includes('zip') || /\.(zip|rar)$/i.test(name)) return 'archive'
  if (m.includes('word') || /\.(docx?)$/i.test(name)) return 'document'
  return 'other'
}

const MIME_ICONS: Record<MimeKind, LucideIcon> = {
  pdf: FileText,
  image: FileImage,
  spreadsheet: FileSpreadsheet,
  archive: FileArchive,
  document: FileText,
  other: File,
}

export function mimeIcon(mimeType?: string | null, title?: string): LucideIcon {
  return MIME_ICONS[mimeKind(mimeType, title)]
}

export function mimeLabel(mimeType?: string | null, title?: string): string {
  const kind = mimeKind(mimeType, title)
  const map: Record<MimeKind, string> = {
    pdf: 'PDF',
    image: 'Imagem',
    spreadsheet: 'Folha de cálculo',
    archive: 'Compactado',
    document: 'Documento',
    other: 'Ficheiro',
  }
  return map[kind]
}

export function fileExtensionHint(title?: string): string {
  const name = String(title || '')
  const dot = name.lastIndexOf('.')
  if (dot < 0) return ''
  return name.slice(dot + 1).toUpperCase().slice(0, 6)
}

export function validationBadgeVariant(
  status?: string | null,
): 'default' | 'success' | 'warning' | 'danger' | 'muted' {
  switch (status) {
    case 'APPROVED':
      return 'success'
    case 'REJECTED':
      return 'danger'
    case 'PENDING':
      return 'warning'
    default:
      return 'muted'
  }
}

export function validationLabel(status?: string | null): string {
  return documentValidationLabel(status)
}

export function relativeTimePt(iso?: string | null): string {
  if (!iso) return '—'
  const then = new Date(iso).getTime()
  if (Number.isNaN(then)) return '—'
  const diff = Date.now() - then
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'agora'
  if (mins < 60) return `há ${mins} min`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `há ${hours} h`
  const days = Math.floor(hours / 24)
  if (days < 30) return `há ${days} dias`
  return new Date(iso).toLocaleDateString('pt-PT', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

export type DocumentGroup = {
  key: string
  label: string
  items: FirmDocumentRow[]
}

export function groupDocuments(items: FirmDocumentRow[], mode: DocumentGroupMode): DocumentGroup[] {
  if (mode === 'none') {
    return [{ key: 'all', label: 'Todos os documentos', items }]
  }

  const buckets = new Map<string, DocumentGroup>()

  for (const doc of items) {
    let key: string
    let label: string
    if (mode === 'client') {
      key = doc.clientId  || 'unknown'
      label = displayClientName(doc)
    } else if (mode === 'period') {
      key = doc.period || 'sem-periodo'
      label = doc.period ? `Período ${doc.period}` : 'Sem período'
    } else {
      key = doc.obligationId || 'sem-obrigacao'
      label = doc.obligationTitle
        ? safeDisplayText(doc.obligationTitle, 'Obrigação')
        : 'Sem obrigação associada'
    }
    const existing = buckets.get(key)
    if (existing) existing.items.push(doc)
    else buckets.set(key, { key, label, items: [doc] })
  }

  return Array.from(buckets.values()).sort((a, b) => a.label.localeCompare(b.label, 'pt-PT'))
}
