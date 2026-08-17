export type DeadlineBucket = 'overdue' | 'thisWeek' | 'later'

function startOfDay(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate())
}

export function deadlineBucket(dueIso: string, now = new Date()): DeadlineBucket {
  const due = new Date(dueIso)
  if (Number.isNaN(due.getTime())) return 'later'
  const today = startOfDay(now)
  const dueDay = startOfDay(due)
  if (dueDay < today) return 'overdue'
  const weekEnd = new Date(today)
  weekEnd.setDate(weekEnd.getDate() + 7)
  if (dueDay < weekEnd) return 'thisWeek'
  return 'later'
}

export const DEADLINE_BUCKET_LABEL: Record<DeadlineBucket, string> = {
  overdue: 'Em atraso',
  thisWeek: 'Esta semana',
  later: 'Mais tarde',
}

export const DEADLINE_BUCKET_ORDER: DeadlineBucket[] = ['overdue', 'thisWeek', 'later']

export function groupByDeadlineBucket<T extends { dueDate: string }>(
  items: T[],
  now = new Date(),
): Record<DeadlineBucket, T[]> {
  const grouped: Record<DeadlineBucket, T[]> = { overdue: [], thisWeek: [], later: [] }
  for (const item of items) {
    grouped[deadlineBucket(item.dueDate, now)].push(item)
  }
  return grouped
}

/** Rótulo curto para listas — a data completa fica no detalhe. */
export function relativeDueLabel(dueIso: string, now = new Date()): string {
  const due = new Date(dueIso)
  if (Number.isNaN(due.getTime())) return ''
  const today = startOfDay(now)
  const dueDay = startOfDay(due)
  const diffDays = Math.round((dueDay.getTime() - today.getTime()) / 86400000)
  if (diffDays === 0) return 'Hoje'
  if (diffDays === 1) return 'Amanhã'
  if (diffDays === -1) return 'Ontem'
  if (diffDays > 1 && diffDays < 7) {
    return due.toLocaleDateString('pt-PT', { weekday: 'long' })
  }
  return due.toLocaleDateString('pt-PT', { day: 'numeric', month: 'short' })
}
