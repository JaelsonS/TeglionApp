import type { WorkspaceTask } from '@/infrastructure/api/contabil/tasks'
import type { ObligationRow } from '@/features/firm/obligations/obligationOperational'
import { displayObligationTitle } from '@/features/firm/obligations/obligationOperational'
import {
  manualTaskStatusLabel,
  mapObligationDisplayStatus,
  obligationStatusLabel,
} from '@/features/firm/tasks/tasksOperationsUtils'
import { formatPtDate } from '@/shared/utils/contabilLocale'

export type PriorityRow = {
  id: string
  kind: 'obligation' | 'manual'
  title: string
  clientName: string
  assigneeName: string
  dueLabel: string
  statusLabel: string
  statusTone: 'red' | 'orange' | 'blue' | 'green'
  sortKey: number
}

export function assigneeInitials(name?: string) {
  if (!name) return '—'
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
  return name.slice(0, 2).toUpperCase()
}

export function formatDueShort(dueDate?: string | null) {
  if (!dueDate) return '—'
  return formatPtDate(dueDate, 'date').replace(/\//g, '/')
}

export function statusPillClass(tone: 'red' | 'orange' | 'blue' | 'green') {
  if (tone === 'red') return 'cb-pill cb-pill-red'
  if (tone === 'orange') return 'cb-pill cb-pill-orange'
  if (tone === 'blue') return 'cb-pill cb-pill-blue'
  return 'cb-pill cb-pill-green'
}

export function buildPriorityRows(
  obligations: ObligationRow[],
  manualTasks: WorkspaceTask[],
  teamNames: Map<string, string>,
): PriorityRow[] {
  const rows: PriorityRow[] = []

  for (const ob of obligations) {
    if (mapObligationDisplayStatus(ob) === 'completed') continue
    const st = obligationStatusLabel(ob)
    const due = ob.dueDate ? new Date(ob.dueDate).getTime() : Number.MAX_SAFE_INTEGER
    rows.push({
      id: `ob-${ob._id}`,
      kind: 'obligation',
      title: displayObligationTitle(ob),
      clientName: ob.clientName || 'Cliente',
      assigneeName:
        (ob as ObligationRow & { assigneeId?: string }).assigneeId
          ? teamNames.get(String((ob as ObligationRow & { assigneeId?: string }).assigneeId)) || '—'
          : '—',
      dueLabel: ob.dueDate ? formatDueShort(ob.dueDate) : '—',
      statusLabel: st.label,
      statusTone: st.tone,
      sortKey: st.tone === 'red' ? due - 1e15 : due,
    })
  }

  for (const t of manualTasks) {
    if (['DONE', 'ARCHIVED'].includes(t.status)) continue
    const st = manualTaskStatusLabel(t)
    const due = t.dueDate ? new Date(t.dueDate).getTime() : Number.MAX_SAFE_INTEGER
    rows.push({
      id: `t-${t.id}`,
      kind: 'manual',
      title: t.title,
      clientName: t.clientName || '—',
      assigneeName: t.assigneeId ? teamNames.get(t.assigneeId) || '—' : '—',
      dueLabel: t.dueDate ? formatDueShort(t.dueDate) : '—',
      statusLabel: st.label,
      statusTone: st.tone,
      sortKey: st.tone === 'red' ? due - 1e15 : due,
    })
  }

  return rows.sort((a, b) => a.sortKey - b.sortKey)
}

export function assigneeDistribution(
  obligations: ObligationRow[],
  manualTasks: WorkspaceTask[],
  teamNames: Map<string, string>,
) {
  const counts = new Map<string, number>()
  const bump = (id?: string | null) => {
    const key = id || '__none__'
    counts.set(key, (counts.get(key) || 0) + 1)
  }
  for (const ob of obligations) {
    if (mapObligationDisplayStatus(ob) === 'completed') continue
    bump((ob as ObligationRow & { assigneeId?: string }).assigneeId)
  }
  for (const t of manualTasks) {
    if (['DONE', 'ARCHIVED'].includes(t.status)) continue
    bump(t.assigneeId)
  }
  const max = Math.max(1, ...counts.values())
  return [...counts.entries()]
    .map(([id, count]) => ({
      id,
      name: id === '__none__' ? 'Sem responsável' : teamNames.get(id) || 'Equipa',
      count,
      pct: Math.round((count / max) * 100),
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 6)
}

export function upcomingDeadlines(
  obligations: ObligationRow[],
  manualTasks: WorkspaceTask[],
  limit = 6,
) {
  type Item = { id: string; title: string; date: string; tone: 'red' | 'orange' | 'grey' }
  const items: Item[] = []
  const now = Date.now()

  for (const ob of obligations) {
    if (!ob.dueDate || mapObligationDisplayStatus(ob) === 'completed') continue
    const t = new Date(ob.dueDate).getTime()
    const tone =
      mapObligationDisplayStatus(ob) === 'overdue' || t < now ? 'red' : t - now < 3 * 86400000 ? 'orange' : 'grey'
    items.push({
      id: ob._id,
      title: `${displayObligationTitle(ob)} — ${ob.clientName || ''}`.trim(),
      date: formatDueShort(ob.dueDate),
      tone,
    })
  }
  for (const t of manualTasks) {
    if (!t.dueDate || ['DONE', 'ARCHIVED'].includes(t.status)) continue
    const ms = new Date(t.dueDate).getTime()
    const tone = t.isOverdue || ms < now ? 'red' : ms - now < 3 * 86400000 ? 'orange' : 'grey'
    items.push({
      id: t.id,
      title: `${t.title} — ${t.clientName || ''}`.trim(),
      date: formatDueShort(t.dueDate),
      tone,
    })
  }

  return items
    .sort((a, b) => a.date.localeCompare(b.date, 'pt-PT'))
    .slice(0, limit)
}
