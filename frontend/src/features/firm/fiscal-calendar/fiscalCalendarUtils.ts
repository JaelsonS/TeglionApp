import {
  CALENDAR_COLOR_STYLES,
  getCalendarColorStyle,
  getCivilUrgency,
  formatCivilDatePt,
  MONTH_NAMES_PT,
  WEEKDAY_LABELS_PT,
  daysInMonth,
  firstWeekdayMonday,
  type CalendarColorStyle,
  type CalendarUrgency,
} from '@/shared/calendar'

/** @deprecated Prefer FirmFiscalEvent — mantido para DetailSheet legado / notas */
export type FiscalCalendarItem = {
  id: string
  title: string
  category: string
  dueDate: string
  period: string
  authority: string
  notes?: string
  regimes?: string[]
}

export type FiscalCategoryStyle = CalendarColorStyle
export type FiscalUrgency = CalendarUrgency

const CATEGORY_TOKEN: Record<string, string> = {
  IVA: 'violet',
  IRS: 'emerald',
  IRC: 'teal',
  'Segurança Social': 'sky',
  'SAF-T': 'amber',
  IES: 'rose',
  Retenções: 'orange',
}

export function getFiscalCategoryStyle(category: string): FiscalCategoryStyle {
  const token = CATEGORY_TOKEN[category]
  const style = getCalendarColorStyle(token)
  return { ...style, label: category || style.label || 'Outro' }
}

export function getCategoryStyleByToken(token?: string | null, label?: string): FiscalCategoryStyle {
  const style = getCalendarColorStyle(token)
  return label ? { ...style, label } : style
}

export const FISCAL_CATEGORY_ORDER = ['IVA', 'IRS', 'IRC', 'Segurança Social', 'SAF-T', 'IES', 'Retenções'] as const

export { MONTH_NAMES_PT, WEEKDAY_LABELS_PT, daysInMonth, firstWeekdayMonday }

export function formatFiscalDate(iso: string): string {
  return formatCivilDatePt(iso)
}

export function formatPeriodLabel(period: string): string {
  if (!period) return '—'
  if (/^\d{4}-Q\d$/i.test(period)) {
    const [year, q] = period.split('-')
    return `${q.replace('Q', 'T')} · ${year}`
  }
  if (/^\d{4}-\d{2}$/.test(period)) {
    const [year, month] = period.split('-')
    return `${MONTH_NAMES_PT[Number(month) - 1] ?? month} ${year}`
  }
  return period
}

export function getFiscalUrgency(dueDate: string, today = new Date()): FiscalUrgency {
  const y = today.getFullYear()
  const m = String(today.getMonth() + 1).padStart(2, '0')
  const d = String(today.getDate()).padStart(2, '0')
  return getCivilUrgency(dueDate, `${y}-${m}-${d}`)
}

export const URGENCY_LABELS: Record<FiscalUrgency, string> = {
  overdue: 'Em atraso',
  soon: 'Esta semana',
  upcoming: 'Próximos 30 dias',
  future: 'Mais tarde',
}

export const URGENCY_RING: Record<FiscalUrgency, string> = {
  overdue: 'ring-rose-500/60',
  soon: 'ring-amber-500/60',
  upcoming: 'ring-sky-500/40',
  future: 'ring-border/40',
}

export const STATUS_LABELS: Record<string, string> = {
  SCHEDULED: 'Agendado',
  PENDING: 'Pendente',
  COMPLETED: 'Concluído',
  CANCELLED: 'Cancelado',
  ARCHIVED: 'Arquivado',
}

export const KIND_LABELS: Record<string, string> = {
  FISCAL: 'Fiscal',
  INTERNAL: 'Interno',
}

export const RECURRENCE_LABELS: Record<string, string> = {
  WEEKLY: 'Semanal',
  MONTHLY: 'Mensal',
  QUARTERLY: 'Trimestral',
  ANNUAL: 'Anual',
  CUSTOM: 'Personalizado',
}

export function uniqueCategories(items: FiscalCalendarItem[]): string[] {
  const set = new Set(items.map((i) => i.category).filter(Boolean))
  const ordered: string[] = FISCAL_CATEGORY_ORDER.filter((c) => set.has(c))
  for (const c of set) {
    if (!ordered.includes(c)) ordered.push(c)
  }
  return ordered
}

export const REGIME_LABELS: Record<string, string> = {
  mensal: 'Regime mensal',
  trimestral: 'Regime trimestral',
  trabalhador_independente: 'Trabalhador independente',
  empresa: 'Empresa',
  todos: 'Todos os contribuintes',
}

export { CALENDAR_COLOR_STYLES, getCalendarColorStyle }
