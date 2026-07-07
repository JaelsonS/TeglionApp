import { displayClientName, uploadedByLabel } from '@/features/firm/documents/documentDisplay'
import type { FirmDocumentRow } from '@/features/firm/documents/documentTypes'
import { formatDateTime } from '@/shared/utils/date'

export type DocumentsHistoryRow = {
  id: string
  period: string
  typeLabel: string
  clientName: string
  docCount: number
  documentIds: string[]
  status: 'entregue' | 'revisao' | 'atrasado' | 'rejeitado'
  submittedAt: string
  submittedBy: string
}

function formatPeriodLabel(period?: string | null) {
  if (!period) return '—'
  const m = period.match(/^(\d{4})-(\d{2})/)
  if (m) {
    const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']
    const mi = Number(m[2]) - 1
    return `${months[mi] || m[2]}/${m[1]}`
  }
  return period
}

function groupStatus(docs: FirmDocumentRow[]): DocumentsHistoryRow['status'] {
  if (docs.some((d) => d.validationStatus === 'REJECTED')) return 'rejeitado'
  if (docs.some((d) => d.validationStatus === 'PENDING')) return 'revisao'
  if (docs.every((d) => d.validationStatus === 'APPROVED')) return 'entregue'
  return 'revisao'
}

export function buildDocumentsHistoryRows(items: FirmDocumentRow[]): DocumentsHistoryRow[] {
  const map = new Map<string, { docs: FirmDocumentRow[]; meta: FirmDocumentRow }>()

  for (const doc of items) {
    const clientKey = doc.clientId  || 'unknown'
    const period = doc.period || doc.obligationPeriod || 'sem-periodo'
    const typeLabel =
      doc.obligationTitle || doc.documentType || doc.obligationId || 'Documentos gerais'
    const key = `${clientKey}::${period}::${typeLabel}`

    const bucket = map.get(key)
    if (bucket) bucket.docs.push(doc)
    else map.set(key, { docs: [doc], meta: doc })
  }

  return [...map.entries()]
    .map(([key, { docs, meta }]) => {
      const latest = [...docs].sort(
        (a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime(),
      )[0]
      return {
        id: key,
        period: formatPeriodLabel(meta.period || meta.obligationPeriod),
        typeLabel:
          meta.obligationTitle || meta.documentType || 'Documentos',
        clientName: displayClientName(meta),
        docCount: docs.length,
        documentIds: docs.map((d) => d._id),
        status: groupStatus(docs),
        submittedAt: latest?.createdAt || '',
        submittedBy: uploadedByLabel(latest || meta),
      }
    })
    .sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime())
}

export function historyStatusLabel(status: DocumentsHistoryRow['status']) {
  if (status === 'entregue') return 'Entregue'
  if (status === 'atrasado') return 'Atrasado'
  if (status === 'rejeitado') return 'Rejeitado'
  return 'Em revisão'
}

export function historyStatusPill(status: DocumentsHistoryRow['status']) {
  if (status === 'entregue') return 'cb-pill cb-pill-green'
  if (status === 'atrasado') return 'cb-pill cb-pill-red'
  if (status === 'rejeitado') return 'cb-pill cb-pill-red'
  return 'cb-pill cb-pill-orange'
}

export function exportHistoryCsv(rows: DocumentsHistoryRow[]) {
  const header = ['Período', 'Tipo', 'Cliente', 'Documentos', 'Estado', 'Submetido em', 'Por']
  const lines = rows.map((r) =>
    [
      r.period,
      r.typeLabel,
      r.clientName,
      String(r.docCount),
      historyStatusLabel(r.status),
      r.submittedAt ? formatDateTime(r.submittedAt) : '',
      r.submittedBy,
    ]
      .map((c) => `"${String(c).replace(/"/g, '""')}"`)
      .join(','),
  )
  const blob = new Blob([[header.join(','), ...lines].join('\n')], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `historico-documentos-${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
  URL.revokeObjectURL(url)
}
