import type { ViewStats } from '@/shared/components/contabil/ViewTrackingBadge'
import { formatEuro, formatPtDate } from '@/shared/utils/contabilLocale'
import { safeDisplayText } from '@/shared/utils/safeDisplayText'
import type { Obligation, ObligationPriority, ObligationType } from '@/shared/types/contabil'

export type OperationalLane =
  | 'critical'
  | 'upcoming'
  | 'overdue'
  | 'waiting_client'
  | 'completed'

export type ObligationRow = Obligation & {
  operationalLane?: OperationalLane
  /** Oculta na lista do mês (exclusão persistida em task_month_exclusions). */
  monthExcluded?: boolean
  clientName?: string | null
  clientEmail?: string
  clientTaxId?: string
  viewStats?: ViewStats | { totalViews?: number; uniqueViewers?: number; viewCount?: number }
  checklist?: string[]
  expectedDocuments?: string[]
  templateId?: string | null
}

export const LANE_LABELS: Record<OperationalLane, string> = {
  critical: 'Críticas',
  upcoming: 'Próximas',
  overdue: 'Atrasadas',
  waiting_client: 'Aguardam cliente',
  completed: 'Concluídas',
}

export const TYPE_LABELS: Record<string, string> = {
  IVA: 'IVA',
  IRC: 'IRC',
  IRS: 'IRS',
  SS: 'Segurança Social',
  SAFT: 'SAF-T',
  DRF: 'DRF',
  IES: 'IES',
  DAS: 'DAS',
  PAYROLL: 'Folha salarial',
  CUSTOM: 'Personalizada',
}

export const PRIORITY_LABELS: Record<ObligationPriority, string> = {
  LOW: 'Baixa',
  NORMAL: 'Normal',
  HIGH: 'Alta',
  URGENT: 'Urgente',
}

const MS_DAY = 86400000

export function classifyLane(ob: ObligationRow, now = new Date()): OperationalLane {
  const status = String(ob.status || '').toUpperCase()
  if (status === 'DELIVERED' || status === 'CANCELLED') return 'completed'

  const due = new Date(ob.dueDate)
  due.setHours(0, 0, 0, 0)
  const today = new Date(now)
  today.setHours(0, 0, 0, 0)
  const diff = Math.round((due.getTime() - today.getTime()) / MS_DAY)

  if (status === 'OVERDUE' || diff < 0) return 'overdue'
  if (status === 'WAITING_CLIENT') return 'waiting_client'
  if (ob.priority === 'URGENT' || ob.paymentStatus === 'OVERDUE' || diff <= 2) return 'critical'
  return 'upcoming'
}

export function displayObligationTitle(ob: ObligationRow): string {
  return safeDisplayText(ob.title || TYPE_LABELS[ob.type] || ob.type, 'Obrigação')
}

export function displayClient(ob: ObligationRow): string {
  return safeDisplayText(ob.clientName, 'Cliente')
}

export function formatObligationMeta(ob: ObligationRow): string {
  const parts = [
    displayClient(ob),
    ob.period ? `Período ${ob.period}` : null,
    ob.dueDate ? `Prazo ${formatPtDate(ob.dueDate, 'date')}` : null,
    ob.amountCents != null ? formatEuro(ob.amountCents) : null,
  ].filter(Boolean)
  return parts.join(' · ')
}

export function parseEurToCents(input: string): number | null {
  const cleaned = input.replace(/[^\d,.-]/g, '').replace(/\./g, '').replace(',', '.')
  if (!cleaned) return null
  const n = parseFloat(cleaned)
  if (Number.isNaN(n)) return null
  return Math.round(n * 100)
}

export function formatEurInputFromCents(cents?: number | null): string {
  if (cents == null) return ''
  return (cents / 100).toFixed(2).replace('.', ',')
}

export function maskEurInput(raw: string): string {
  const digits = raw.replace(/[^\d]/g, '')
  if (!digits) return ''
  const n = parseInt(digits, 10) / 100
  return n.toLocaleString('pt-PT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

export function currentPeriod(): string {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}

export function dueDateFromPeriod(period: string, dueDay = 20): string {
  const m = /(\d{4})-(\d{2})/.exec(period)
  const day = String(Math.min(Math.max(dueDay, 1), 28)).padStart(2, '0')
  if (m) {
    let y = parseInt(m[1], 10)
    let month = parseInt(m[2], 10) + 1
    if (month > 12) {
      month = 1
      y += 1
    }
    return `${y}-${String(month).padStart(2, '0')}-${day}`
  }
  return `${period}-12-${day}`
}

export type ObligationTemplate = {
  id: string
  _id?: string
  code: string
  name: string
  type: ObligationType
  recurrenceFrequency: string
  defaultDueDay: number
  defaultPriority: ObligationPriority
  defaultAmountCents?: number | null
  checklist: string[]
  expectedDocuments: string[]
  defaultTaskDescription?: string | null
}
