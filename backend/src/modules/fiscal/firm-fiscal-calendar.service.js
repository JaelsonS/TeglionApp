/**
 * Calendário Fiscal do escritório — CRUD firm-scoped.
 * Datas = YYYY-MM-DD (DATE). Recorrência expandida no range pedido.
 */
const { AppError } = require('../../middlewares/error.middleware')
const { getSupabaseAdmin, isSupabaseConfigured } = require('../../db/supabase/client')
const nationalCalendar = require('./fiscal-calendar.service')
const notesService = require('./fiscal-calendar-notes.service')

const DEFAULT_CATEGORY_COLORS = {
  IVA: 'violet',
  IRS: 'emerald',
  IRC: 'teal',
  'Segurança Social': 'sky',
  'SAF-T': 'amber',
  IES: 'rose',
  Retenções: 'orange',
  Obrigações: 'indigo',
  Declarações: 'violet',
  Pagamentos: 'teal',
  Comunicação: 'sky',
  Outros: 'slate',
}

const COLOR_PALETTE = [
  'violet',
  'emerald',
  'teal',
  'sky',
  'amber',
  'rose',
  'orange',
  'indigo',
  'lime',
  'slate',
]

function ensureClient() {
  if (!isSupabaseConfigured()) {
    throw new AppError('Base de dados não configurada', 503)
  }
  return getSupabaseAdmin()
}

function isIsoDate(value) {
  return /^\d{4}-\d{2}-\d{2}$/.test(String(value || ''))
}

function parseYmd(iso) {
  const [y, m, d] = String(iso).split('-').map(Number)
  return { y, m, d }
}

function toYmd(y, m, d) {
  return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`
}

function daysInMonth(y, m) {
  return new Date(y, m, 0).getDate()
}

function addMonths(iso, months) {
  const { y, m, d } = parseYmd(iso)
  const total = (y * 12 + (m - 1)) + months
  const ny = Math.floor(total / 12)
  const nm = (total % 12) + 1
  const nd = Math.min(d, daysInMonth(ny, nm))
  return toYmd(ny, nm, nd)
}

function addDays(iso, days) {
  const { y, m, d } = parseYmd(iso)
  const dt = new Date(y, m - 1, d)
  dt.setDate(dt.getDate() + days)
  return toYmd(dt.getFullYear(), dt.getMonth() + 1, dt.getDate())
}

function compareYmd(a, b) {
  return String(a).localeCompare(String(b))
}

function mapCalendar(row) {
  if (!row) return null
  return {
    id: row.id,
    firmId: row.firm_id,
    name: row.name,
    description: row.description,
    preferences: row.preferences || {},
    isActive: row.is_active,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

function mapCategory(row) {
  if (!row) return null
  return {
    id: row.id,
    firmId: row.firm_id,
    calendarId: row.calendar_id,
    name: row.name,
    colorToken: row.color_token,
    sortOrder: row.sort_order,
    isActive: row.is_active,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

function mapRecurrence(row) {
  if (!row) return null
  return {
    id: row.id,
    firmId: row.firm_id,
    frequency: row.frequency,
    intervalCount: row.interval_count,
    dayOfMonth: row.day_of_month,
    dayOfWeek: row.day_of_week,
    monthOfYear: row.month_of_year,
    untilDate: row.until_date,
    countLimit: row.count_limit,
    metadata: row.metadata || {},
  }
}

function mapException(row) {
  if (!row) return null
  return {
    id: row.id,
    eventId: row.event_id,
    originalDate: row.original_date,
    isCancelled: row.is_cancelled,
    overrideDate: row.override_date,
    overrideTitle: row.override_title,
    overrideDescription: row.override_description,
    overrideStatus: row.override_status,
    overrideNotes: row.override_notes,
  }
}

function mapEvent(row, recurrence = null, exceptions = []) {
  if (!row) return null
  return {
    id: row.id,
    firmId: row.firm_id,
    calendarId: row.calendar_id,
    categoryId: row.category_id,
    recurrenceRuleId: row.recurrence_rule_id,
    title: row.title,
    description: row.description,
    notes: row.notes,
    startDate: row.start_date,
    startTime: row.start_time,
    endTime: row.end_time,
    eventKind: row.event_kind,
    status: row.status,
    priority: row.priority,
    colorToken: row.color_token,
    authority: row.authority,
    periodLabel: row.period_label,
    regimes: row.regimes || [],
    sourceTemplateKey: row.source_template_key,
    isActive: row.is_active,
    archivedAt: row.archived_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    recurrence: recurrence || null,
    exceptions: exceptions.map(mapException),
  }
}

async function getOrCreateCalendar({ firmId }) {
  const sb = ensureClient()
  const { data: existing, error } = await sb
    .from('firm_fiscal_calendars')
    .select('*')
    .eq('firm_id', firmId)
    .maybeSingle()
  if (error) throw error
  if (existing) return mapCalendar(existing)

  const { data: created, error: createError } = await sb
    .from('firm_fiscal_calendars')
    .insert({
      firm_id: firmId,
      name: 'Calendário Fiscal',
      description: 'Organize e acompanhe os principais prazos e obrigações fiscais do seu escritório.',
      preferences: {
        defaultView: 'month',
        firstDayOfWeek: 1,
        showInternalEvents: true,
      },
    })
    .select('*')
    .single()
  if (createError) throw createError
  return mapCalendar(created)
}

async function updateCalendar({ firmId, payload }) {
  const calendar = await getOrCreateCalendar({ firmId })
  const sb = ensureClient()
  const patch = { updated_at: new Date().toISOString() }
  if (payload.name != null) patch.name = String(payload.name).trim() || calendar.name
  if (payload.description != null) patch.description = String(payload.description)
  if (payload.preferences != null && typeof payload.preferences === 'object') {
    patch.preferences = { ...(calendar.preferences || {}), ...payload.preferences }
  }
  if (payload.isActive != null) patch.is_active = Boolean(payload.isActive)

  const { data, error } = await sb
    .from('firm_fiscal_calendars')
    .update(patch)
    .eq('id', calendar.id)
    .eq('firm_id', firmId)
    .select('*')
    .single()
  if (error) throw error
  return mapCalendar(data)
}

async function listCategories({ firmId, includeInactive = false }) {
  const calendar = await getOrCreateCalendar({ firmId })
  const sb = ensureClient()
  let q = sb
    .from('firm_fiscal_categories')
    .select('*')
    .eq('firm_id', firmId)
    .eq('calendar_id', calendar.id)
    .order('sort_order', { ascending: true })
    .order('name', { ascending: true })
  if (!includeInactive) q = q.eq('is_active', true)
  const { data, error } = await q
  if (error) throw error
  return (data || []).map(mapCategory)
}

async function createCategory({ firmId, payload }) {
  const calendar = await getOrCreateCalendar({ firmId })
  const name = String(payload.name || '').trim()
  if (!name) throw new AppError('Nome da categoria é obrigatório', 400)
  const colorToken = COLOR_PALETTE.includes(payload.colorToken)
    ? payload.colorToken
    : DEFAULT_CATEGORY_COLORS[name] || 'slate'

  const sb = ensureClient()
  const { data, error } = await sb
    .from('firm_fiscal_categories')
    .insert({
      firm_id: firmId,
      calendar_id: calendar.id,
      name,
      color_token: colorToken,
      sort_order: Number.isFinite(Number(payload.sortOrder)) ? Number(payload.sortOrder) : 0,
      is_active: payload.isActive !== false,
    })
    .select('*')
    .single()
  if (error) {
    if (String(error.message || '').includes('duplicate') || error.code === '23505') {
      throw new AppError('Já existe uma categoria com este nome', 409)
    }
    throw error
  }
  return mapCategory(data)
}

async function updateCategory({ firmId, id, payload }) {
  const sb = ensureClient()
  const patch = { updated_at: new Date().toISOString() }
  if (payload.name != null) {
    const name = String(payload.name).trim()
    if (!name) throw new AppError('Nome da categoria é obrigatório', 400)
    patch.name = name
  }
  if (payload.colorToken != null) {
    if (!COLOR_PALETTE.includes(payload.colorToken)) {
      throw new AppError('Cor inválida', 400)
    }
    patch.color_token = payload.colorToken
  }
  if (payload.sortOrder != null) patch.sort_order = Number(payload.sortOrder) || 0
  if (payload.isActive != null) patch.is_active = Boolean(payload.isActive)

  const { data, error } = await sb
    .from('firm_fiscal_categories')
    .update(patch)
    .eq('id', id)
    .eq('firm_id', firmId)
    .select('*')
    .maybeSingle()
  if (error) throw error
  if (!data) throw new AppError('Categoria não encontrada', 404)
  return mapCategory(data)
}

async function upsertRecurrence({ firmId, payload, existingId = null }) {
  if (!payload || !payload.frequency) return null
  const frequency = String(payload.frequency).toUpperCase()
  if (!['WEEKLY', 'MONTHLY', 'QUARTERLY', 'ANNUAL', 'CUSTOM'].includes(frequency)) {
    throw new AppError('Frequência de recorrência inválida', 400)
  }
  const row = {
    firm_id: firmId,
    frequency,
    interval_count: Math.max(1, Number(payload.intervalCount) || 1),
    day_of_month: payload.dayOfMonth != null ? Number(payload.dayOfMonth) : null,
    day_of_week: payload.dayOfWeek != null ? Number(payload.dayOfWeek) : null,
    month_of_year: payload.monthOfYear != null ? Number(payload.monthOfYear) : null,
    until_date: payload.untilDate && isIsoDate(payload.untilDate) ? payload.untilDate : null,
    count_limit: payload.countLimit != null ? Number(payload.countLimit) : null,
    metadata: payload.metadata && typeof payload.metadata === 'object' ? payload.metadata : {},
    updated_at: new Date().toISOString(),
  }

  const sb = ensureClient()
  if (existingId) {
    const { data, error } = await sb
      .from('firm_fiscal_recurrence_rules')
      .update(row)
      .eq('id', existingId)
      .eq('firm_id', firmId)
      .select('*')
      .maybeSingle()
    if (error) throw error
    return data ? mapRecurrence(data) : null
  }

  const { data, error } = await sb.from('firm_fiscal_recurrence_rules').insert(row).select('*').single()
  if (error) throw error
  return mapRecurrence(data)
}

function expandRecurrenceDates(startDate, rule, rangeStart, rangeEnd) {
  if (!rule) return [startDate].filter((d) => compareYmd(d, rangeStart) >= 0 && compareYmd(d, rangeEnd) <= 0)

  const dates = []
  let cursor = startDate
  let generated = 0
  const maxIterations = 520
  const interval = Math.max(1, rule.intervalCount || 1)

  // Align first occurrence day-of-month if specified
  if (rule.dayOfMonth && (rule.frequency === 'MONTHLY' || rule.frequency === 'QUARTERLY' || rule.frequency === 'ANNUAL')) {
    const { y, m } = parseYmd(startDate)
    const nd = Math.min(rule.dayOfMonth, daysInMonth(y, m))
    cursor = toYmd(y, m, nd)
  }

  while (generated < maxIterations) {
    if (rule.untilDate && compareYmd(cursor, rule.untilDate) > 0) break
    if (rule.countLimit && generated >= rule.countLimit) break
    if (compareYmd(cursor, rangeEnd) > 0) break

    if (compareYmd(cursor, rangeStart) >= 0 && compareYmd(cursor, startDate) >= 0) {
      dates.push(cursor)
    }
    generated += 1

    if (rule.frequency === 'WEEKLY') {
      cursor = addDays(cursor, 7 * interval)
    } else if (rule.frequency === 'MONTHLY') {
      cursor = addMonths(cursor, interval)
      if (rule.dayOfMonth) {
        const { y, m } = parseYmd(cursor)
        cursor = toYmd(y, m, Math.min(rule.dayOfMonth, daysInMonth(y, m)))
      }
    } else if (rule.frequency === 'QUARTERLY') {
      cursor = addMonths(cursor, 3 * interval)
      if (rule.dayOfMonth) {
        const { y, m } = parseYmd(cursor)
        cursor = toYmd(y, m, Math.min(rule.dayOfMonth, daysInMonth(y, m)))
      }
    } else if (rule.frequency === 'ANNUAL') {
      cursor = addMonths(cursor, 12 * interval)
      if (rule.dayOfMonth || rule.monthOfYear) {
        const { y } = parseYmd(cursor)
        const m = rule.monthOfYear || parseYmd(cursor).m
        const d = rule.dayOfMonth || parseYmd(cursor).d
        cursor = toYmd(y, m, Math.min(d, daysInMonth(y, m)))
      }
    } else {
      // CUSTOM: treat like monthly until metadata evolves
      cursor = addMonths(cursor, interval)
    }
  }
  return dates
}

async function loadEventsRaw({ firmId, includeArchived = false, includeInactive = false }) {
  const calendar = await getOrCreateCalendar({ firmId })
  const sb = ensureClient()
  let q = sb.from('firm_fiscal_events').select('*').eq('firm_id', firmId).eq('calendar_id', calendar.id)
  if (!includeArchived) q = q.is('archived_at', null)
  if (!includeInactive) q = q.eq('is_active', true)
  const { data, error } = await q.order('start_date', { ascending: true })
  if (error) throw error
  return { calendar, rows: data || [] }
}

async function attachRecurrenceAndExceptions(firmId, rows) {
  const sb = ensureClient()
  const ruleIds = [...new Set(rows.map((r) => r.recurrence_rule_id).filter(Boolean))]
  const eventIds = rows.map((r) => r.id)

  let rulesById = {}
  if (ruleIds.length) {
    const { data, error } = await sb.from('firm_fiscal_recurrence_rules').select('*').eq('firm_id', firmId).in('id', ruleIds)
    if (error) throw error
    rulesById = Object.fromEntries((data || []).map((r) => [r.id, r]))
  }

  let exceptionsByEvent = {}
  if (eventIds.length) {
    const { data, error } = await sb
      .from('firm_fiscal_event_exceptions')
      .select('*')
      .eq('firm_id', firmId)
      .in('event_id', eventIds)
    if (error) throw error
    for (const ex of data || []) {
      if (!exceptionsByEvent[ex.event_id]) exceptionsByEvent[ex.event_id] = []
      exceptionsByEvent[ex.event_id].push(ex)
    }
  }

  return rows.map((row) =>
    mapEvent(row, mapRecurrence(rulesById[row.recurrence_rule_id] || null), exceptionsByEvent[row.id] || []),
  )
}

function toOccurrence(event, occurrenceDate) {
  const exception = (event.exceptions || []).find((ex) => ex.originalDate === occurrenceDate)
  if (exception?.isCancelled) return null

  const date = exception?.overrideDate || occurrenceDate
  return {
    ...event,
    occurrenceDate: occurrenceDate,
    occurrenceId: `${event.id}:${occurrenceDate}`,
    isRecurring: Boolean(event.recurrence),
    isException: Boolean(exception && !exception.isCancelled),
    startDate: date,
    title: exception?.overrideTitle || event.title,
    description: exception?.overrideDescription ?? event.description,
    status: exception?.overrideStatus || event.status,
    notes: exception?.overrideNotes ?? event.notes,
  }
}

function expandEventsForRange(events, rangeStart, rangeEnd) {
  const occurrences = []
  for (const event of events) {
    if (event.recurrence) {
      const dates = expandRecurrenceDates(event.startDate, event.recurrence, rangeStart, rangeEnd)
      for (const d of dates) {
        const occ = toOccurrence(event, d)
        if (occ && compareYmd(occ.startDate, rangeStart) >= 0 && compareYmd(occ.startDate, rangeEnd) <= 0) {
          occurrences.push(occ)
        }
      }
    } else if (compareYmd(event.startDate, rangeStart) >= 0 && compareYmd(event.startDate, rangeEnd) <= 0) {
      occurrences.push({
        ...event,
        occurrenceDate: event.startDate,
        occurrenceId: `${event.id}:${event.startDate}`,
        isRecurring: false,
        isException: false,
      })
    }
  }
  occurrences.sort((a, b) => compareYmd(a.startDate, b.startDate) || a.title.localeCompare(b.title))
  return occurrences
}

async function listWorkspace({
  firmId,
  from,
  to,
  categoryId,
  eventKind,
  status,
  search,
  includeInactive = false,
  includeArchived = false,
}) {
  const rangeStart = isIsoDate(from) ? from : `${new Date().getFullYear()}-01-01`
  const rangeEnd = isIsoDate(to) ? to : `${new Date().getFullYear()}-12-31`

  const { calendar, rows } = await loadEventsRaw({ firmId, includeArchived, includeInactive })
  let events = await attachRecurrenceAndExceptions(firmId, rows)
  const categories = await listCategories({ firmId, includeInactive: true })

  if (categoryId) events = events.filter((e) => e.categoryId === categoryId)
  if (eventKind) events = events.filter((e) => e.eventKind === eventKind)
  if (status) events = events.filter((e) => e.status === status)
  if (search) {
    const q = String(search).trim().toLowerCase()
    events = events.filter(
      (e) =>
        e.title.toLowerCase().includes(q) ||
        String(e.description || '')
          .toLowerCase()
          .includes(q) ||
        String(e.notes || '')
          .toLowerCase()
          .includes(q) ||
        String(e.authority || '')
          .toLowerCase()
          .includes(q),
    )
  }

  const occurrences = expandEventsForRange(events, rangeStart, rangeEnd)
  const today = toYmd(new Date().getFullYear(), new Date().getMonth() + 1, new Date().getDate())
  const in7 = addDays(today, 7)
  const in30 = addDays(today, 30)
  const upcoming7 = occurrences.filter((o) => compareYmd(o.startDate, today) >= 0 && compareYmd(o.startDate, in7) <= 0)
  const upcoming30 = occurrences.filter((o) => compareYmd(o.startDate, today) >= 0 && compareYmd(o.startDate, in30) <= 0)

  return {
    calendar,
    categories,
    colorPalette: COLOR_PALETTE,
    events: occurrences,
    series: events,
    summary: {
      upcoming7: upcoming7.length,
      upcoming30: upcoming30.length,
      totalInRange: occurrences.length,
    },
    range: { from: rangeStart, to: rangeEnd },
  }
}

async function getEventById({ firmId, id }) {
  const sb = ensureClient()
  const { data, error } = await sb.from('firm_fiscal_events').select('*').eq('id', id).eq('firm_id', firmId).maybeSingle()
  if (error) throw error
  if (!data) throw new AppError('Evento não encontrado', 404)
  const [mapped] = await attachRecurrenceAndExceptions(firmId, [data])
  return mapped
}

async function createEvent({ firmId, userId, payload }) {
  const calendar = await getOrCreateCalendar({ firmId })
  const title = String(payload.title || '').trim()
  if (!title) throw new AppError('Título é obrigatório', 400)
  if (!isIsoDate(payload.startDate)) throw new AppError('Data inválida (use YYYY-MM-DD)', 400)

  let recurrenceRuleId = null
  if (payload.recurrence && payload.recurrence.frequency) {
    const rule = await upsertRecurrence({ firmId, payload: payload.recurrence })
    recurrenceRuleId = rule?.id || null
  }

  const sb = ensureClient()
  const { data, error } = await sb
    .from('firm_fiscal_events')
    .insert({
      firm_id: firmId,
      calendar_id: calendar.id,
      category_id: payload.categoryId || null,
      recurrence_rule_id: recurrenceRuleId,
      title,
      description: payload.description != null ? String(payload.description) : null,
      notes: payload.notes != null ? String(payload.notes) : null,
      start_date: payload.startDate,
      start_time: payload.startTime || null,
      end_time: payload.endTime || null,
      event_kind: payload.eventKind === 'INTERNAL' ? 'INTERNAL' : 'FISCAL',
      status: payload.status || 'SCHEDULED',
      priority: payload.priority || 'NORMAL',
      color_token: payload.colorToken || null,
      authority: payload.authority || null,
      period_label: payload.periodLabel || null,
      regimes: Array.isArray(payload.regimes) ? payload.regimes : [],
      source_template_key: payload.sourceTemplateKey || null,
      is_active: payload.isActive !== false,
      created_by: userId || null,
      updated_by: userId || null,
    })
    .select('*')
    .single()
  if (error) throw error
  return getEventById({ firmId, id: data.id })
}

async function updateEvent({ firmId, id, userId, payload, scope = 'series' }) {
  const existing = await getEventById({ firmId, id })

  // Edit only this occurrence → exception row
  if (scope === 'occurrence' && payload.occurrenceDate && isIsoDate(payload.occurrenceDate)) {
    if (!existing.recurrence) {
      // Non-recurring: just update the event itself
      return updateEvent({ firmId, id, userId, payload, scope: 'series' })
    }
    const result = await upsertException({
      firmId,
      eventId: id,
      originalDate: payload.occurrenceDate,
      patch: {
        overrideDate: payload.startDate && isIsoDate(payload.startDate) ? payload.startDate : undefined,
        overrideTitle: payload.title,
        overrideDescription: payload.description,
        overrideStatus: payload.status,
        overrideNotes: payload.notes,
        isCancelled: payload.isCancelled === true,
      },
    })
    return result.event
  }

  const sb = ensureClient()
  const patch = { updated_at: new Date().toISOString(), updated_by: userId || null }
  if (payload.title != null) {
    const title = String(payload.title).trim()
    if (!title) throw new AppError('Título é obrigatório', 400)
    patch.title = title
  }
  if (payload.description != null) patch.description = String(payload.description)
  if (payload.notes != null) patch.notes = String(payload.notes)
  if (payload.startDate != null) {
    if (!isIsoDate(payload.startDate)) throw new AppError('Data inválida (use YYYY-MM-DD)', 400)
    patch.start_date = payload.startDate
  }
  if (payload.startTime !== undefined) patch.start_time = payload.startTime || null
  if (payload.endTime !== undefined) patch.end_time = payload.endTime || null
  if (payload.categoryId !== undefined) patch.category_id = payload.categoryId || null
  if (payload.eventKind != null) patch.event_kind = payload.eventKind === 'INTERNAL' ? 'INTERNAL' : 'FISCAL'
  if (payload.status != null) patch.status = payload.status
  if (payload.priority != null) patch.priority = payload.priority
  if (payload.colorToken !== undefined) patch.color_token = payload.colorToken || null
  if (payload.authority !== undefined) patch.authority = payload.authority || null
  if (payload.periodLabel !== undefined) patch.period_label = payload.periodLabel || null
  if (payload.regimes !== undefined) patch.regimes = Array.isArray(payload.regimes) ? payload.regimes : []
  if (payload.isActive != null) patch.is_active = Boolean(payload.isActive)

  if (payload.recurrence === null) {
    patch.recurrence_rule_id = null
  } else if (payload.recurrence && payload.recurrence.frequency) {
    const rule = await upsertRecurrence({
      firmId,
      payload: payload.recurrence,
      existingId: existing.recurrenceRuleId,
    })
    patch.recurrence_rule_id = rule?.id || null
  }

  const { data, error } = await sb
    .from('firm_fiscal_events')
    .update(patch)
    .eq('id', id)
    .eq('firm_id', firmId)
    .select('*')
    .maybeSingle()
  if (error) throw error
  if (!data) throw new AppError('Evento não encontrado', 404)
  return getEventById({ firmId, id })
}

async function upsertException({ firmId, eventId, originalDate, patch }) {
  if (!isIsoDate(originalDate)) throw new AppError('Data da ocorrência inválida', 400)
  await getEventById({ firmId, id: eventId })
  const sb = ensureClient()

  const row = {
    firm_id: firmId,
    event_id: eventId,
    original_date: originalDate,
    is_cancelled: patch.isCancelled === true,
    override_date: patch.overrideDate && isIsoDate(patch.overrideDate) ? patch.overrideDate : null,
    override_title: patch.overrideTitle != null ? String(patch.overrideTitle) : null,
    override_description: patch.overrideDescription != null ? String(patch.overrideDescription) : null,
    override_status: patch.overrideStatus || null,
    override_notes: patch.overrideNotes != null ? String(patch.overrideNotes) : null,
    updated_at: new Date().toISOString(),
  }

  const { data, error } = await sb
    .from('firm_fiscal_event_exceptions')
    .upsert(row, { onConflict: 'event_id,original_date' })
    .select('*')
    .single()
  if (error) throw error
  const event = await getEventById({ firmId, id: eventId })
  return { exception: mapException(data), event }
}

async function duplicateEvent({ firmId, id, userId, overrides = {} }) {
  const source = await getEventById({ firmId, id })
  return createEvent({
    firmId,
    userId,
    payload: {
      title: overrides.title || `${source.title} (cópia)`,
      description: source.description,
      notes: source.notes,
      startDate: overrides.startDate || source.startDate,
      startTime: source.startTime,
      endTime: source.endTime,
      categoryId: overrides.categoryId || source.categoryId,
      eventKind: source.eventKind,
      status: 'SCHEDULED',
      priority: source.priority,
      colorToken: source.colorToken,
      authority: source.authority,
      periodLabel: overrides.periodLabel || source.periodLabel,
      regimes: source.regimes,
      recurrence: source.recurrence
        ? {
            frequency: source.recurrence.frequency,
            intervalCount: source.recurrence.intervalCount,
            dayOfMonth: source.recurrence.dayOfMonth,
            dayOfWeek: source.recurrence.dayOfWeek,
            monthOfYear: source.recurrence.monthOfYear,
            untilDate: source.recurrence.untilDate,
            countLimit: source.recurrence.countLimit,
          }
        : null,
    },
  })
}

async function archiveEvent({ firmId, id, userId }) {
  const sb = ensureClient()
  const { data, error } = await sb
    .from('firm_fiscal_events')
    .update({
      status: 'ARCHIVED',
      is_active: false,
      archived_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      updated_by: userId || null,
    })
    .eq('id', id)
    .eq('firm_id', firmId)
    .select('*')
    .maybeSingle()
  if (error) throw error
  if (!data) throw new AppError('Evento não encontrado', 404)
  return getEventById({ firmId, id })
}

async function setEventActive({ firmId, id, userId, isActive }) {
  const sb = ensureClient()
  const patch = {
    is_active: Boolean(isActive),
    updated_at: new Date().toISOString(),
    updated_by: userId || null,
  }
  if (isActive) {
    patch.archived_at = null
    patch.status = 'SCHEDULED'
  }
  const { data, error } = await sb
    .from('firm_fiscal_events')
    .update(patch)
    .eq('id', id)
    .eq('firm_id', firmId)
    .select('*')
    .maybeSingle()
  if (error) throw error
  if (!data) throw new AppError('Evento não encontrado', 404)
  return getEventById({ firmId, id })
}

async function ensureCategoryByName({ firmId, calendarId, name }) {
  const sb = ensureClient()
  const { data: existing } = await sb
    .from('firm_fiscal_categories')
    .select('*')
    .eq('firm_id', firmId)
    .eq('calendar_id', calendarId)
    .eq('name', name)
    .maybeSingle()
  if (existing) return mapCategory(existing)
  return createCategory({
    firmId,
    payload: {
      name,
      colorToken: DEFAULT_CATEGORY_COLORS[name] || 'slate',
    },
  })
}

async function importNationalTemplate({ firmId, userId, year }) {
  const y = Number(year) || new Date().getFullYear()
  const calendar = await getOrCreateCalendar({ firmId })
  const national = nationalCalendar.listFiscalCalendar({ year: y })
  const items = national.items || []
  if (!items.length) {
    throw new AppError('Modelo nacional indisponível para este ano', 404)
  }

  const notes = await notesService.getFiscalCalendarNotes({ firmId })
  const created = []
  const skipped = []

  const sb = ensureClient()
  for (const item of items) {
    const templateKey = `${y}:${item.id}`
    const { data: existing } = await sb
      .from('firm_fiscal_events')
      .select('id')
      .eq('firm_id', firmId)
      .eq('source_template_key', templateKey)
      .is('archived_at', null)
      .maybeSingle()
    if (existing) {
      skipped.push(templateKey)
      continue
    }

    const category = await ensureCategoryByName({
      firmId,
      calendarId: calendar.id,
      name: item.category || 'Outros',
    })

    const accountantNote = notes[item.id] || notes[`${y}:${item.id}`] || ''
    const event = await createEvent({
      firmId,
      userId,
      payload: {
        title: item.title,
        description: item.notes || null,
        notes: accountantNote || null,
        startDate: item.dueDate,
        categoryId: category.id,
        eventKind: 'FISCAL',
        status: 'SCHEDULED',
        authority: item.authority || null,
        periodLabel: item.period || null,
        regimes: item.regimes || [],
        sourceTemplateKey: templateKey,
        colorToken: category.colorToken,
      },
    })
    created.push(event)
  }

  return {
    calendar,
    year: y,
    createdCount: created.length,
    skippedCount: skipped.length,
    created,
  }
}

module.exports = {
  COLOR_PALETTE,
  DEFAULT_CATEGORY_COLORS,
  expandRecurrenceDates,
  expandEventsForRange,
  getOrCreateCalendar,
  updateCalendar,
  listCategories,
  createCategory,
  updateCategory,
  listWorkspace,
  getEventById,
  createEvent,
  updateEvent,
  duplicateEvent,
  archiveEvent,
  setEventActive,
  upsertException,
  importNationalTemplate,
  addDays,
  toYmd,
}
