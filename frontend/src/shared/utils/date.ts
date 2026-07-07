// Utilitários de formatação de datas (pt-PT).
/**
 * date.ts
 * 
 * Utilitários de datas usados em agenda e relatórios.
 */

import { format } from 'date-fns'
import i18n from '@/i18n'

const ISO_DATE_ONLY_RE = /^\d{4}-\d{2}-\d{2}$/

export function toLocalDateInputValue(date: Date): string {
  return format(date, 'yyyy-MM-dd')
}

export function toLocalTimeLabel(date: Date): string {
  return format(date, 'HH:mm')
}

export function buildIsoDateTime(date: Date, hhmm: string): string {
  const [h, m] = hhmm.split(':').map((x) => Number(x))
  const d = new Date(date)
  d.setHours(h, m, 0, 0)
  return d.toISOString()
}

export function parseIsoDateOnly(value: string): Date | null {
  const normalized = value.includes('T') ? value.split('T')[0] : value
  if (!ISO_DATE_ONLY_RE.test(normalized)) return null
  const [yRaw, mRaw, dRaw] = normalized.split('-')
  const year = Number(yRaw)
  const month = Number(mRaw)
  const day = Number(dRaw)

  if (!Number.isFinite(year) || !Number.isFinite(month) || !Number.isFinite(day)) return null
  if (month < 1 || month > 12) return null
  if (day < 1 || day > 31) return null

  const dateUTC = new Date(Date.UTC(year, month - 1, day))
  if (
    dateUTC.getUTCFullYear() !== year ||
    dateUTC.getUTCMonth() !== month - 1 ||
    dateUTC.getUTCDate() !== day
  ) {
    return null
  }

  return dateUTC
}

export function getBirthDateValidationReason(
  value: string,
  options: { maxAgeYears: number }
): 'invalid' | 'future' | 'tooOld' | null {
  const parsed = parseIsoDateOnly(value)
  if (!parsed) return 'invalid'

  const now = new Date()
  const todayUTC = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()))
  if (parsed.getTime() > todayUTC.getTime()) return 'future'

  const oldestAllowed = new Date(
    Date.UTC(now.getUTCFullYear() - options.maxAgeYears, now.getUTCMonth(), now.getUTCDate())
  )
  if (parsed.getTime() < oldestAllowed.getTime()) return 'tooOld'

  return null
}

export function isBirthdayToday(value?: string | null, reference = new Date()): boolean {
  if (!value) return false
  const parsed = new Date(value)
  const resolved = Number.isNaN(parsed.getTime()) ? parseIsoDateOnly(String(value)) : parsed
  if (!resolved) return false

  return resolved.getMonth() === reference.getMonth() && resolved.getDate() === reference.getDate()
}

export function monthKey(date = new Date()) {
  return { year: date.getFullYear(), month: date.getMonth() + 1 }
}

// ✅ ADICIONAR ESTA FUNÇÃO
export function formatDate(date: Date | string | null | undefined): string {
  if (!date) return '—'
  
  try {
    const d = new Date(date)
    if (isNaN(d.getTime())) return '—'
    // i18n: uso Intl para respeitar o idioma/país ativo automaticamente
    return new Intl.DateTimeFormat(i18n.language || 'pt-PT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(d)
  } catch {
    return '—'
  }
}

// ✅ ADICIONAR TAMBÉM PARA DATA COM HORA
export function formatDateTime(date: Date | string | null | undefined): string {
  if (!date) return '—'
  
  try {
    const d = new Date(date)
    if (isNaN(d.getTime())) return '—'
    // i18n: uso Intl para respeitar o idioma/país ativo automaticamente
    return new Intl.DateTimeFormat(i18n.language || 'pt-PT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(d)
  } catch {
    return '—'
  }
}