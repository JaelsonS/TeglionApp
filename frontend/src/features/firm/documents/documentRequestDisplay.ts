import type { DocumentRequest } from '@/shared/types/contabil'
import { formatPeriodLabel } from '@/features/firm/tasks/tasksOperationsUtils'

export function displayDocumentRequestTitle(
  request: DocumentRequest,
  clientName?: string | null,
): string {
  if (request.title?.trim()) return request.title.trim()
  const period = request.periodMonth ? formatPeriodLabel(request.periodMonth) : null
  const base = request.instructions?.trim().slice(0, 48) || 'Pedido de documento'
  if (period) return `${base} — ${period}`
  if (clientName) return `${base} · ${clientName}`
  return base
}

export function requestTimelineEvents(request: DocumentRequest) {
  const events: Array<{ id: string; label: string; at?: string | null; tone?: 'default' | 'success' | 'warn' }> = [
    {
      id: 'created',
      label: 'Pedido enviado pelo escritório',
      at: request.createdAt,
    },
  ]
  if (request.seenAt) {
    events.push({ id: 'seen', label: 'Cliente abriu o pedido', at: request.seenAt, tone: 'default' })
  }
  if (request.answeredAt) {
    events.push({
      id: 'answered',
      label: 'Cliente enviou resposta / ficheiros',
      at: request.answeredAt,
      tone: 'default',
    })
  }
  if (request.completedAt) {
    events.push({
      id: 'completed',
      label: 'Pedido concluído',
      at: request.completedAt,
      tone: 'success',
    })
  }
  return events
}
