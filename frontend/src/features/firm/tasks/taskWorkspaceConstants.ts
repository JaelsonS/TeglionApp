import type { WorkspaceTaskStatus } from '@/infrastructure/api/contabil/tasks'

export const KANBAN_COLUMNS: WorkspaceTaskStatus[] = [
  'BACKLOG',
  'TODO',
  'IN_PROGRESS',
  'WAITING_CLIENT',
  'REVIEW',
  'DONE',
]

export const STATUS_LABEL: Record<WorkspaceTaskStatus, string> = {
  BACKLOG: 'Em fila',
  TODO: 'A fazer',
  IN_PROGRESS: 'Em curso',
  WAITING_CLIENT: 'À espera do cliente',
  REVIEW: 'Revisão',
  DONE: 'Concluída',
  ARCHIVED: 'Arquivada',
}

export const PRIORITY_LABEL: Record<string, string> = {
  LOW: 'Baixa',
  NORMAL: 'Normal',
  HIGH: 'Alta',
  URGENT: 'Urgente',
}

export const PRIORITY_CLASS: Record<string, string> = {
  LOW: 'bg-slate-100 text-slate-600',
  NORMAL: 'bg-slate-100 text-slate-700',
  HIGH: 'bg-amber-50 text-amber-800 ring-1 ring-amber-200/80',
  URGENT: 'bg-rose-50 text-rose-800 ring-1 ring-rose-200/80',
}
