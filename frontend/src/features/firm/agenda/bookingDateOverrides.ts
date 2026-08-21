import type { BookingDateOverrides, BookingDaySchedule, TimeInterval } from '@/shared/types/contabil'

export type DayOverrideKind = 'none' | 'closed' | 'custom'

export function cloneDateOverrides(
  overrides: BookingDateOverrides | null | undefined,
): BookingDateOverrides {
  const next: BookingDateOverrides = {}
  if (!overrides || typeof overrides !== 'object') return next
  for (const [date, intervals] of Object.entries(overrides)) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) continue
    if (!Array.isArray(intervals)) continue
    next[date] = intervals.map((iv) => ({ start: iv.start, end: iv.end }))
  }
  return next
}

export function cloneIntervals(intervals: TimeInterval[] | null | undefined): TimeInterval[] {
  return (intervals || []).map((iv) => ({ start: iv.start, end: iv.end }))
}

/** Estado da data no mapa de excepções (sem olhar para o horário semanal). */
export function dayOverrideKind(
  date: string,
  overrides: BookingDateOverrides | null | undefined,
): DayOverrideKind {
  if (!overrides || !Object.prototype.hasOwnProperty.call(overrides, date)) return 'none'
  const intervals = overrides[date]
  if (!Array.isArray(intervals) || intervals.length === 0) return 'closed'
  return 'custom'
}

/** Intervalos efectivos: dateOverrides[data] ?? schedule[weekday]. [] = fechado. */
export function effectiveIntervalsForDate(
  date: string,
  schedule: BookingDaySchedule,
  overrides: BookingDateOverrides | null | undefined,
): TimeInterval[] {
  if (overrides && Object.prototype.hasOwnProperty.call(overrides, date)) {
    return cloneIntervals(overrides[date])
  }
  const [y, m, d] = date.split('-').map(Number)
  const weekday = new Date(y, m - 1, d).getDay()
  return cloneIntervals(schedule[weekday])
}

export function setDayOverride(
  overrides: BookingDateOverrides,
  date: string,
  intervals: TimeInterval[],
): BookingDateOverrides {
  return { ...cloneDateOverrides(overrides), [date]: cloneIntervals(intervals) }
}

/** Remove a excepção — o dia volta ao horário semanal. */
export function clearDayOverride(overrides: BookingDateOverrides, date: string): BookingDateOverrides {
  const next = cloneDateOverrides(overrides)
  delete next[date]
  return next
}

export function copyDayOverride(
  overrides: BookingDateOverrides,
  fromDate: string,
  toDate: string,
): BookingDateOverrides {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(fromDate) || !/^\d{4}-\d{2}-\d{2}$/.test(toDate)) {
    return cloneDateOverrides(overrides)
  }
  const next = cloneDateOverrides(overrides)
  if (!Object.prototype.hasOwnProperty.call(overrides || {}, fromDate)) {
    delete next[toDate]
    return next
  }
  next[toDate] = cloneIntervals(overrides![fromDate])
  return next
}

/**
 * Copia excepções de um mês civil para outro.
 * As chaves do mês de destino são substituídas; o mês de origem não é alterado.
 * Intervalos são clonados em profundidade (alterar Setembro não muda Agosto).
 */
export function copyMonthDateOverrides(
  overrides: BookingDateOverrides | null | undefined,
  fromYearMonth: string,
  toYearMonth: string,
): BookingDateOverrides {
  if (!/^\d{4}-\d{2}$/.test(fromYearMonth) || !/^\d{4}-\d{2}$/.test(toYearMonth)) {
    return cloneDateOverrides(overrides)
  }
  if (fromYearMonth === toYearMonth) return cloneDateOverrides(overrides)

  const next = cloneDateOverrides(overrides)
  for (const key of Object.keys(next)) {
    if (key.startsWith(`${toYearMonth}-`)) delete next[key]
  }

  const source = overrides || {}
  for (const [date, intervals] of Object.entries(source)) {
    if (!date.startsWith(`${fromYearMonth}-`)) continue
    if (!Array.isArray(intervals)) continue
    const day = date.slice(8, 10)
    if (!/^\d{2}$/.test(day)) continue
    const targetDate = `${toYearMonth}-${day}`
    // Só copia se o dia existir no mês de destino (ex.: 31 → Fev).
    const [ty, tm] = toYearMonth.split('-').map(Number)
    const daysInTarget = new Date(ty, tm, 0).getDate()
    if (Number(day) > daysInTarget) continue
    next[targetDate] = cloneIntervals(intervals)
  }
  return next
}

export function monthKeyFromParts(year: number, monthIndex: number): string {
  return `${year}-${String(monthIndex + 1).padStart(2, '0')}`
}

export function nextMonthKey(year: number, monthIndex: number): string {
  const d = new Date(year, monthIndex + 1, 1)
  return monthKeyFromParts(d.getFullYear(), d.getMonth())
}

export function formatYearMonthPt(yearMonth: string): string {
  const [y, m] = yearMonth.split('-').map(Number)
  if (!y || !m) return yearMonth
  return new Date(y, m - 1, 1).toLocaleDateString('pt-PT', { month: 'long', year: 'numeric' })
}
