import type { WorkspaceTask } from '@/infrastructure/api/contabil/tasks'
import type { ObligationRow, OperationalLane } from '@/features/firm/obligations/obligationOperational'
import {
  LANE_LABELS,
  classifyLane,
  displayObligationTitle,
} from '@/features/firm/obligations/obligationOperational'

export type TasksOperationsTab = 'overview' | 'obligations' | 'manual' | 'calendar' | 'clients'

export type ObligationDisplayStatus = 'pending' | 'in_progress' | 'completed' | 'overdue'

export function currentPeriodYm(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

export function formatPeriodLabel(period?: string | null): string {
  if (!period) return 'Sem período'
  const [y, m] = period.split('-')
  if (!y || !m) return period
  const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']
  return `${months[Number(m) - 1] || m} ${y}`
}

export function isPreviousPeriod(period?: string | null): boolean {
  if (!period) return false
  return period < currentPeriodYm()
}

export function isCurrentPeriod(period?: string | null): boolean {
  if (!period) return false
  return String(period).slice(0, 7) === currentPeriodYm()
}

export function mapObligationDisplayStatus(ob: ObligationRow): ObligationDisplayStatus {
  const status = String(ob.status || '').toUpperCase()
  if (status === 'DELIVERED' || status === 'CANCELLED') return 'completed'
  if (isPreviousPeriod(ob.period) || ob.operationalLane === 'overdue') return 'overdue'
  if (status === 'IN_PROGRESS' || status === 'WAITING_CLIENT') return 'in_progress'
  return 'pending'
}

export function obligationProgress(ob: ObligationRow): number {
  const s = mapObligationDisplayStatus(ob)
  if (s === 'completed') return 100
  if (s === 'in_progress') return 55
  if (s === 'overdue') return 20
  return 10
}

export function computeOperationsSummary(
  obligations: ObligationRow[],
  manualTasks: WorkspaceTask[],
  taskMetrics?: { active?: number; overdue?: number; done?: number },
) {
  const current = currentPeriodYm()
  const obCurrent = obligations.filter((o) => isCurrentPeriod(o.period))
  const obDoneCurrent = obCurrent.filter((o) =>
    ['DELIVERED', 'CANCELLED'].includes(String(o.status)),
  ).length
  const prevPending = obligations.filter(
    (o) => isPreviousPeriod(o.period) && !['DELIVERED', 'CANCELLED'].includes(String(o.status)),
  ).length
  const manualPending = manualTasks.filter((t) => !['DONE', 'ARCHIVED'].includes(t.status)).length
  const manualDoneMonth = manualTasks.filter((t) => t.status === 'DONE').length

  const obPendingCurrent = obCurrent.length - obDoneCurrent
  const manualOverdue = manualTasks.filter((t) => t.isOverdue && !['DONE', 'ARCHIVED'].includes(t.status)).length
  const obOverdue = obligations.filter(
    (o) => isCurrentPeriod(o.period) && mapObligationDisplayStatus(o) === 'overdue',
  ).length

  return {
    pendingTotal: (taskMetrics?.active ?? manualPending) + obPendingCurrent,
    completedMonth: obDoneCurrent + manualDoneMonth,
    overdue: (taskMetrics?.overdue ?? manualOverdue) + obOverdue,
    obligationsCurrentMonth: obCurrent.length,
    prevMonthPending: prevPending,
  }
}

const LANE_ORDER: OperationalLane[] = [
  'critical',
  'overdue',
  'waiting_client',
  'upcoming',
  'completed',
]

export function groupObligationsByLane(
  items: ObligationRow[],
): Array<{ key: OperationalLane; label: string; items: ObligationRow[] }> {
  const map = new Map<OperationalLane, ObligationRow[]>()
  for (const lane of LANE_ORDER) map.set(lane, [])
  for (const ob of items) {
    const lane = (ob.operationalLane || classifyLane(ob)) as OperationalLane
    const bucket = map.get(lane) ?? []
    bucket.push(ob)
    map.set(lane, bucket)
  }
  return LANE_ORDER.map((key) => ({
    key,
    label: LANE_LABELS[key],
    items: (map.get(key) || []).sort((a, b) =>
      String(a.dueDate || '').localeCompare(String(b.dueDate || '')),
    ),
  })).filter((g) => g.items.length > 0)
}

export type OverviewKpis = {
  overdue: number
  dueToday: number
  dueThisWeek: number
  completedMonth: number
}

function startOfDay(d: Date) {
  const x = new Date(d)
  x.setHours(0, 0, 0, 0)
  return x
}

function isDueToday(dueDate?: string | null) {
  if (!dueDate) return false
  return startOfDay(new Date(dueDate)).getTime() === startOfDay(new Date()).getTime()
}

function isDueThisWeek(dueDate?: string | null) {
  if (!dueDate) return false
  const due = startOfDay(new Date(dueDate))
  const today = startOfDay(new Date())
  const end = new Date(today)
  end.setDate(end.getDate() + 7)
  return due >= today && due <= end
}

export function computeOverviewKpis(
  obligations: ObligationRow[],
  manualTasks: WorkspaceTask[],
): OverviewKpis {
  const obOpen = obligations.filter(
    (o) => isCurrentPeriod(o.period) && mapObligationDisplayStatus(o) !== 'completed',
  )
  const manualOpen = manualTasks.filter((t) => !['DONE', 'ARCHIVED'].includes(t.status))

  const overdue =
    obOpen.filter((o) => mapObligationDisplayStatus(o) === 'overdue').length +
    manualOpen.filter((t) => t.isOverdue).length

  const dueToday =
    obOpen.filter((o) => isDueToday(o.dueDate)).length +
    manualOpen.filter((t) => isDueToday(t.dueDate)).length

  const dueThisWeek =
    obOpen.filter((o) => isDueThisWeek(o.dueDate)).length +
    manualOpen.filter((t) => isDueThisWeek(t.dueDate)).length

  const obDone = obligations.filter(
    (o) => isCurrentPeriod(o.period) && mapObligationDisplayStatus(o) === 'completed',
  ).length
  const manualDone = manualTasks.filter((t) => t.status === 'DONE').length

  return {
    overdue,
    dueToday,
    dueThisWeek,
    completedMonth: obDone + manualDone,
  }
}

export function obligationStatusLabel(ob: ObligationRow): {
  label: string
  tone: 'red' | 'orange' | 'blue' | 'green'
} {
  const s = mapObligationDisplayStatus(ob)
  if (s === 'overdue') return { label: 'Em atraso', tone: 'red' }
  if (s === 'completed') return { label: 'Concluída', tone: 'green' }
  if (s === 'in_progress') return { label: 'Em curso', tone: 'blue' }
  return { label: 'Pendente', tone: 'orange' }
}

export function manualTaskStatusLabel(task: WorkspaceTask): {
  label: string
  tone: 'red' | 'orange' | 'blue' | 'green'
} {
  if (task.status === 'DONE' || task.status === 'ARCHIVED') return { label: 'Concluída', tone: 'green' }
  if (task.isOverdue) return { label: 'Em atraso', tone: 'red' }
  if (task.status === 'IN_PROGRESS' || task.status === 'REVIEW') return { label: 'Em curso', tone: 'blue' }
  if (task.status === 'WAITING_CLIENT') return { label: 'Pendente', tone: 'orange' }
  return { label: 'Pendente', tone: 'orange' }
}

export function groupObligations(
  items: ObligationRow[],
  mode: 'client' | 'type',
): Array<{ key: string; label: string; items: ObligationRow[] }> {
  const map = new Map<string, ObligationRow[]>()
  for (const ob of items) {
    const key =
      mode === 'client'
        ? ob.clientName || ob.clientId || 'sem-cliente'
        : ob.type || 'CUSTOM'
    if (!map.has(key)) map.set(key, [])
    map.get(key)!.push(ob)
  }
  return [...map.entries()]
    .map(([key, rows]) => ({
      key,
      label: mode === 'client' ? key : key,
      items: rows.sort((a, b) => displayObligationTitle(a).localeCompare(displayObligationTitle(b), 'pt-PT')),
    }))
    .sort((a, b) => a.label.localeCompare(b.label, 'pt-PT'))
}

