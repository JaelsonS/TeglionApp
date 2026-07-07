import { formatPtDate } from '@/shared/utils/contabilLocale'
import { formatNif } from '@/shared/utils/formatNif'
import type { Obligation } from '@/shared/types/contabil'

export type PeriodScope = 'all' | 'today' | 'week'

export function startOfDay(d: Date) {
  const x = new Date(d)
  x.setHours(0, 0, 0, 0)
  return x
}

export function isSameDay(a: Date, b: Date) {
  return a.toDateString() === b.toDateString()
}

export function dueInScope(dueDate: string | undefined, scope: PeriodScope, now = new Date()) {
  if (!dueDate || scope === 'all') return true
  const due = new Date(dueDate)
  if (scope === 'today') return isSameDay(due, now)
  const end = new Date(now)
  end.setDate(end.getDate() + 7)
  return due >= startOfDay(now) && due <= end
}

export function createdInScope(createdAt: string | undefined, scope: PeriodScope, now = new Date()) {
  if (!createdAt || scope === 'all') return true
  const created = new Date(createdAt)
  if (scope === 'today') return isSameDay(created, now)
  const end = new Date(now)
  end.setDate(end.getDate() + 7)
  return created >= startOfDay(now) && created <= end
}

export function overdueInScope(dueDate: string | undefined, scope: PeriodScope, now = new Date()) {
  if (!dueDate || scope === 'all') return true
  const due = startOfDay(new Date(dueDate))
  const today = startOfDay(now)
  if (due > today) return false
  if (scope === 'today') return isSameDay(due, now)
  const weekAgo = new Date(today)
  weekAgo.setDate(weekAgo.getDate() - 7)
  return due >= weekAgo
}

export function daysOverdue(dueDate: string) {
  const due = startOfDay(new Date(dueDate))
  const today = startOfDay(new Date())
  return Math.max(0, Math.round((today.getTime() - due.getTime()) / 86400000))
}

export function obligationRowTitle(o: Obligation) {
  const name = o.clientName || 'Cliente'
  const title = o.title || o.type
  return `${title} — ${name}`
}

export function obligationRowMeta(o: Obligation, mode: 'critical' | 'overdue') {
  const nif = formatNif(o.clientTaxId)
  if (mode === 'overdue') {
    const days = daysOverdue(o.dueDate)
    return `NIF ${nif} · atrasado ${days} ${days === 1 ? 'dia' : 'dias'}`
  }
  return `NIF ${nif} · vence ${formatPtDate(o.dueDate, 'date')}`
}

export function relativeUpdated(ms?: number) {
  if (!ms) return 'agora'
  const min = Math.round((Date.now() - ms) / 60000)
  if (min < 1) return 'agora'
  if (min < 60) return `há ${min} min`
  const h = Math.round(min / 60)
  if (h < 24) return `há ${h}h`
  return formatPtDate(new Date(ms).toISOString(), 'date')
}
