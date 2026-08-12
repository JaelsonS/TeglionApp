/**
 * Domínio de calendário reutilizável (datas civis YYYY-MM-DD, sem timezone).
 * Consumer atual: Calendário Fiscal do escritório.
 * Futuro: clientes, obrigações, tarefas, alertas — sem acoplamento aqui.
 */

export const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/

export function parseCivilDate(iso: string): { y: number; m: number; d: number } | null {
  if (!ISO_DATE_RE.test(iso)) return null
  const [y, m, d] = iso.split('-').map(Number)
  if (!y || !m || !d) return null
  return { y, m, d }
}

/** Interpreta YYYY-MM-DD como dia civil local (evita off-by-one UTC). */
export function civilDateToLocalDate(iso: string): Date | null {
  const parts = parseCivilDate(iso)
  if (!parts) return null
  return new Date(parts.y, parts.m - 1, parts.d)
}

export function localDateToCivil(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function todayCivil(): string {
  return localDateToCivil(new Date())
}

export function addDaysCivil(iso: string, days: number): string {
  const dt = civilDateToLocalDate(iso)
  if (!dt) return iso
  dt.setDate(dt.getDate() + days)
  return localDateToCivil(dt)
}

export function daysInMonth(year: number, monthIndex: number) {
  return new Date(year, monthIndex + 1, 0).getDate()
}

/** 0 = segunda … 6 = domingo */
export function firstWeekdayMonday(year: number, monthIndex: number) {
  const d = new Date(year, monthIndex, 1).getDay()
  return d === 0 ? 6 : d - 1
}

export function compareCivil(a: string, b: string) {
  return a.localeCompare(b)
}

export type CalendarUrgency = 'overdue' | 'soon' | 'upcoming' | 'future'

export function getCivilUrgency(dueDate: string, todayIso = todayCivil()): CalendarUrgency {
  const due = parseCivilDate(dueDate)
  const today = parseCivilDate(todayIso)
  if (!due || !today) return 'future'
  const start = new Date(today.y, today.m - 1, today.d)
  const end = new Date(due.y, due.m - 1, due.d)
  const diffDays = Math.round((end.getTime() - start.getTime()) / 86_400_000)
  if (diffDays < 0) return 'overdue'
  if (diffDays <= 7) return 'soon'
  if (diffDays <= 30) return 'upcoming'
  return 'future'
}

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

export function formatCivilDatePt(iso: string): string {
  const dt = civilDateToLocalDate(iso)
  if (!dt) return iso || '—'
  return new Intl.DateTimeFormat('pt-PT', { day: 'numeric', month: 'long', year: 'numeric' }).format(dt)
}

export type CalendarColorToken =
  | 'violet'
  | 'emerald'
  | 'teal'
  | 'sky'
  | 'amber'
  | 'rose'
  | 'orange'
  | 'indigo'
  | 'lime'
  | 'slate'

export type CalendarColorStyle = {
  label: string
  bg: string
  border: string
  text: string
  dot: string
  pill: string
}

export const CALENDAR_COLOR_STYLES: Record<CalendarColorToken, CalendarColorStyle> = {
  violet: {
    label: 'Violeta',
    bg: 'bg-violet-500/10',
    border: 'border-violet-500/30',
    text: 'text-violet-700 dark:text-violet-300',
    dot: 'bg-violet-500',
    pill: 'bg-violet-500/15 text-violet-800 dark:text-violet-200',
  },
  emerald: {
    label: 'Esmeralda',
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/30',
    text: 'text-emerald-700 dark:text-emerald-300',
    dot: 'bg-emerald-500',
    pill: 'bg-emerald-500/15 text-emerald-800 dark:text-emerald-200',
  },
  teal: {
    label: 'Teal',
    bg: 'bg-teal-500/10',
    border: 'border-teal-500/30',
    text: 'text-teal-700 dark:text-teal-300',
    dot: 'bg-teal-500',
    pill: 'bg-teal-500/15 text-teal-800 dark:text-teal-200',
  },
  sky: {
    label: 'Céu',
    bg: 'bg-sky-500/10',
    border: 'border-sky-500/30',
    text: 'text-sky-700 dark:text-sky-300',
    dot: 'bg-sky-500',
    pill: 'bg-sky-500/15 text-sky-800 dark:text-sky-200',
  },
  amber: {
    label: 'Âmbar',
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/30',
    text: 'text-amber-800 dark:text-amber-300',
    dot: 'bg-amber-500',
    pill: 'bg-amber-500/15 text-amber-900 dark:text-amber-200',
  },
  rose: {
    label: 'Rosa',
    bg: 'bg-rose-500/10',
    border: 'border-rose-500/30',
    text: 'text-rose-700 dark:text-rose-300',
    dot: 'bg-rose-500',
    pill: 'bg-rose-500/15 text-rose-800 dark:text-rose-200',
  },
  orange: {
    label: 'Laranja',
    bg: 'bg-orange-500/10',
    border: 'border-orange-500/30',
    text: 'text-orange-800 dark:text-orange-300',
    dot: 'bg-orange-500',
    pill: 'bg-orange-500/15 text-orange-900 dark:text-orange-200',
  },
  indigo: {
    label: 'Índigo',
    bg: 'bg-indigo-500/10',
    border: 'border-indigo-500/30',
    text: 'text-indigo-700 dark:text-indigo-300',
    dot: 'bg-indigo-500',
    pill: 'bg-indigo-500/15 text-indigo-800 dark:text-indigo-200',
  },
  lime: {
    label: 'Lima',
    bg: 'bg-lime-500/10',
    border: 'border-lime-500/30',
    text: 'text-lime-800 dark:text-lime-300',
    dot: 'bg-lime-500',
    pill: 'bg-lime-500/15 text-lime-900 dark:text-lime-200',
  },
  slate: {
    label: 'Ardósia',
    bg: 'bg-slate-500/10',
    border: 'border-slate-500/30',
    text: 'text-slate-700 dark:text-slate-300',
    dot: 'bg-slate-500',
    pill: 'bg-slate-500/15 text-slate-800 dark:text-slate-200',
  },
}

export const CALENDAR_COLOR_PALETTE = Object.keys(CALENDAR_COLOR_STYLES) as CalendarColorToken[]

export function getCalendarColorStyle(token?: string | null): CalendarColorStyle {
  if (token && token in CALENDAR_COLOR_STYLES) {
    return CALENDAR_COLOR_STYLES[token as CalendarColorToken]
  }
  return CALENDAR_COLOR_STYLES.slate
}
