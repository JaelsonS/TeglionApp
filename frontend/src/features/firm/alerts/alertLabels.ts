import type { BroadcastPriority, BroadcastStatus } from '@/infrastructure/api/contabil/broadcasts'

export const PRIORITY_FILTER_OPTIONS: { id: string; label: string }[] = [
  { id: '', label: 'Todas' },
  { id: 'URGENT', label: 'Urgentes' },
  { id: 'HIGH', label: 'Importantes' },
  { id: 'MEDIUM', label: 'Informativos' },
  { id: 'LOW', label: 'Baixa prioridade' },
]

export const STATUS_LABELS: Record<BroadcastStatus, string> = {
  DRAFT: 'Rascunho',
  SCHEDULED: 'Agendado',
  PUBLISHED: 'Publicado',
  ARCHIVED: 'Arquivado',
}

export const PRIORITY_LABELS_PT: Record<BroadcastPriority, string> = {
  LOW: 'Baixa',
  MEDIUM: 'Informativo',
  HIGH: 'Importante',
  URGENT: 'Urgente',
}

export const CATEGORY_LABELS: Record<string, string> = {
  AVISO: 'Aviso',
  LEMBRETE: 'Lembrete',
  URGENTE: 'Urgente',
  FISCAL: 'Fiscal',
  INFORMATIVO: 'Informativo',
}

export function categoryLabel(category: string) {
  return CATEGORY_LABELS[category] || category.replace(/_/g, ' ')
}
