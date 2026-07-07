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

export type FiscalCategoryStyle = {
  label: string
  bg: string
  border: string
  text: string
  dot: string
  pill: string
}

const CATEGORY_STYLES: Record<string, FiscalCategoryStyle> = {
  IVA: {
    label: 'IVA',
    bg: 'bg-violet-500/10',
    border: 'border-violet-500/30',
    text: 'text-violet-700 dark:text-violet-300',
    dot: 'bg-violet-500',
    pill: 'bg-violet-500/15 text-violet-800 dark:text-violet-200',
  },
  IRS: {
    label: 'IRS',
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/30',
    text: 'text-emerald-700 dark:text-emerald-300',
    dot: 'bg-emerald-500',
    pill: 'bg-emerald-500/15 text-emerald-800 dark:text-emerald-200',
  },
  IRC: {
    label: 'IRC',
    bg: 'bg-teal-500/10',
    border: 'border-teal-500/30',
    text: 'text-teal-700 dark:text-teal-300',
    dot: 'bg-teal-500',
    pill: 'bg-teal-500/15 text-teal-800 dark:text-teal-200',
  },
  'Segurança Social': {
    label: 'Seg. Social',
    bg: 'bg-sky-500/10',
    border: 'border-sky-500/30',
    text: 'text-sky-700 dark:text-sky-300',
    dot: 'bg-sky-500',
    pill: 'bg-sky-500/15 text-sky-800 dark:text-sky-200',
  },
  'SAF-T': {
    label: 'SAF-T',
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/30',
    text: 'text-amber-800 dark:text-amber-300',
    dot: 'bg-amber-500',
    pill: 'bg-amber-500/15 text-amber-900 dark:text-amber-200',
  },
  IES: {
    label: 'IES',
    bg: 'bg-rose-500/10',
    border: 'border-rose-500/30',
    text: 'text-rose-700 dark:text-rose-300',
    dot: 'bg-rose-500',
    pill: 'bg-rose-500/15 text-rose-800 dark:text-rose-200',
  },
}

const FALLBACK_STYLE: FiscalCategoryStyle = {
  label: 'Outro',
  bg: 'bg-slate-500/10',
  border: 'border-slate-500/30',
  text: 'text-slate-700 dark:text-slate-300',
  dot: 'bg-slate-500',
  pill: 'bg-slate-500/15 text-slate-800 dark:text-slate-200',
}

export function getFiscalCategoryStyle(category: string): FiscalCategoryStyle {
  return CATEGORY_STYLES[category] ?? { ...FALLBACK_STYLE, label: category || 'Outro' }
}

export const FISCAL_CATEGORY_ORDER = ['IVA', 'IRS', 'IRC', 'Segurança Social', 'SAF-T', 'IES'] as const

export const MONTH_NAMES_PT = [
  'Janeiro',
  'Fevereiro',
  'Março',
  'Abril',
  'Maio',
  'Junho',
  'Julho',
  'Agosto',
  'Setembro',
  'Outubro',
  'Novembro',
  'Dezembro',
] as const

export const WEEKDAY_LABELS_PT = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'] as const

export function formatFiscalDate(iso: string): string {
  if (!iso) return '—'
  const [y, m, d] = iso.split('-').map(Number)
  if (!y || !m || !d) return iso
  return new Intl.DateTimeFormat('pt-PT', { day: 'numeric', month: 'long', year: 'numeric' }).format(
    new Date(y, m - 1, d),
  )
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

export type FiscalUrgency = 'overdue' | 'soon' | 'upcoming' | 'future'

export function getFiscalUrgency(dueDate: string, today = new Date()): FiscalUrgency {
  const due = new Date(dueDate)
  if (Number.isNaN(due.getTime())) return 'future'
  const start = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  const end = new Date(due.getFullYear(), due.getMonth(), due.getDate())
  const diffDays = Math.round((end.getTime() - start.getTime()) / 86_400_000)
  if (diffDays < 0) return 'overdue'
  if (diffDays <= 7) return 'soon'
  if (diffDays <= 30) return 'upcoming'
  return 'future'
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

export function daysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate()
}

export function firstWeekdayMonday(year: number, month: number) {
  const d = new Date(year, month, 1).getDay()
  return d === 0 ? 6 : d - 1
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
