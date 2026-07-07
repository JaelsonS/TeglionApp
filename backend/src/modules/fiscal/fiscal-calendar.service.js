/**
 * Calendário fiscal nacional PT — datas orientativas AT/SS.
 *
 * Modo automático:
 * - Se existir `pt-fiscal-calendar-{ano}.json`, usa esse ficheiro.
 * - Se não existir, gera o ano automaticamente a partir do calendário explícito mais próximo.
 */
const fs = require('fs')
const path = require('path')
const { resolveCountryConfig } = require('../../config/country-config.registry')

const CALENDAR_FILE_RE = /^pt-fiscal-calendar-(\d{4})\.json$/
const DATA_DIR = path.resolve(__dirname, '../../data')

function toIntYear(value) {
  const y = Number(value)
  if (!Number.isFinite(y)) return null
  const yi = Math.trunc(y)
  if (yi < 2000 || yi > 2100) return null
  return yi
}

function discoverExplicitYears() {
  try {
    const files = fs.readdirSync(DATA_DIR)
    const years = []
    for (const name of files) {
      const match = CALENDAR_FILE_RE.exec(name)
      if (!match) continue
      const y = toIntYear(match[1])
      if (y) years.push(y)
    }
    years.sort((a, b) => a - b)
    return years
  } catch {
    return []
  }
}

function tryLoadCalendarForYear(year) {
  const y = toIntYear(year)
  if (!y) return null
  try {
    // eslint-disable-next-line import/no-dynamic-require
    return require(`../../data/pt-fiscal-calendar-${y}.json`)
  } catch {
    return null
  }
}

function shiftDateYear(isoDate, yearDiff) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(isoDate || ''))
  if (!match) return isoDate
  const nextYear = Number(match[1]) + yearDiff
  return `${nextYear}-${match[2]}-${match[3]}`
}

function shiftPeriodYear(period, yearDiff) {
  const p = String(period || '')
  if (!p) return p

  let match = /^(\d{4})-(\d{2})$/.exec(p)
  if (match) return `${Number(match[1]) + yearDiff}-${match[2]}`

  match = /^(\d{4})-(Q[1-4])$/i.exec(p)
  if (match) return `${Number(match[1]) + yearDiff}-${match[2].toUpperCase()}`

  match = /^(\d{4})$/.exec(p)
  if (match) return String(Number(match[1]) + yearDiff)

  return p
}

function shiftTitleYearHints(title, yearDiff) {
  return String(title || '').replace(/\b(20\d{2})\b/g, (s) => String(Number(s) + yearDiff))
}

function autoGenerateCalendarForYear(targetYear) {
  const explicitYears = discoverExplicitYears()
  if (!explicitYears.length) return null

  const baseYear = explicitYears.reduce((best, y) => {
    if (best == null) return y
    const dBest = Math.abs(best - targetYear)
    const dY = Math.abs(y - targetYear)
    return dY < dBest ? y : best
  }, null)
  if (!baseYear) return null

  const baseCalendar = tryLoadCalendarForYear(baseYear)
  if (!Array.isArray(baseCalendar)) return null

  const diff = targetYear - baseYear
  return baseCalendar.map((item) => ({
    ...item,
    dueDate: shiftDateYear(item.dueDate, diff),
    period: shiftPeriodYear(item.period, diff),
    title: shiftTitleYearHints(item.title, diff),
  }))
}

function listFiscalCalendar({ year = 2026, category, month } = {}) {
  const y = toIntYear(year) || 2026
  const explicit = tryLoadCalendarForYear(y)
  const calendar = explicit || autoGenerateCalendarForYear(y)

  if (!calendar) {
    return {
      year: y,
      source: 'unavailable',
      items: [],
      disclaimer:
        'Calendário fiscal indisponível. Adicione pelo menos um ficheiro base (pt-fiscal-calendar-YYYY.json).',
    }
  }

  let items = [...calendar]
  if (category) {
    const cat = String(category).trim().toLowerCase()
    items = items.filter((i) => String(i.category).toLowerCase() === cat)
  }
  if (month) {
    const m = String(month).padStart(2, '0')
    items = items.filter((i) => String(i.dueDate || '').slice(5, 7) === m)
  }

  items.sort((a, b) => String(a.dueDate).localeCompare(String(b.dueDate)))
  return {
    year: y,
    source: explicit ? 'explicit' : 'generated',
    items,
    disclaimer:
      'Datas orientativas baseadas no calendário fiscal habitual em Portugal. Confirme sempre no Portal das Finanças e Segurança Social.',
  }
}

function listAvailableYears({ from, to } = {}) {
  const now = new Date().getFullYear()
  const start = toIntYear(from) || now - 1
  const end = toIntYear(to) || now + 8

  const explicitYears = discoverExplicitYears()
  if (!explicitYears.length) return []

  const years = []
  for (let y = start; y <= end; y += 1) {
    if (tryLoadCalendarForYear(y) || autoGenerateCalendarForYear(y)) years.push(y)
  }
  return years
}

function listFiscalCalendarForCountry(countryCode, options = {}) {
  const config = resolveCountryConfig(countryCode)
  if (!config.features.fiscalCalendar) {
    const y = toIntYear(options.year) || new Date().getFullYear()
    return {
      year: y,
      country: config.code,
      source: 'coming_soon',
      items: [],
      disclaimer:
        'Calendário fiscal para o Brasil está em preparação. Use obrigações e tarefas personalizadas até à disponibilização.',
    }
  }
  const payload = listFiscalCalendar(options)
  return { ...payload, country: config.code }
}

module.exports = { listFiscalCalendar, listAvailableYears, listFiscalCalendarForCountry }
