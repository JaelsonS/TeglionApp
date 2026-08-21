const dayjs = require('dayjs');
const utc = require('dayjs/plugin/utc');
const timezone = require('dayjs/plugin/timezone');
const crypto = require('crypto');

dayjs.extend(utc);
dayjs.extend(timezone);

const { AppError } = require('../../middlewares/error.middleware');
const firmsRepository = require('../../db/supabase/repositories/firms.repository');
const consultationsRepository = require('../../db/supabase/repositories/consultations.repository');
const accountingServicesRepository = require('../../db/supabase/repositories/accounting-services.repository');
const bookingHoldsRepository = require('../../db/supabase/repositories/booking-holds.repository');
const googleCalendarAvailabilityService = require('../integrations/google-calendar/google-calendar-availability.service');

const BOOKING_TIMEZONES = ['Europe/Lisbon', 'Europe/Madrid', 'Atlantic/Azores', 'UTC'];
const TZ_SET = new Set(BOOKING_TIMEZONES);

const DEFAULT_BOOKING = Object.freeze({
  slotMinutes: 30,
  horizonDays: 14,
  leadTimeHours: 2,
  weekdays: [1, 2, 3, 4, 5],
  dayStart: '09:00',
  dayEnd: '17:00',
  timezone: 'Europe/Lisbon',
});

/** Hold anónimo (agenda primeiro) — mais curto que o hold de pagamento (30 min). */
const ANON_HOLD_MINUTES = 15;

const TIME_RE = /^\d{1,2}:\d{2}$/;

function clamp(n, min, max) {
  return Math.min(max, Math.max(min, n));
}

function normalizeTimezone(raw) {
  const z = typeof raw === 'string' ? raw.trim() : '';
  return TZ_SET.has(z) ? z : 'Europe/Lisbon';
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function normalizeUuidOrNull(raw) {
  if (raw === null || raw === undefined || raw === '') return null;
  if (typeof raw !== 'string') return null;
  const id = raw.trim();
  return UUID_RE.test(id) ? id : null;
}

function normalizeTimeHHMM(value, fallback) {
  return typeof value === 'string' && TIME_RE.test(value) ? value : fallback;
}

function timeToMinutes(hhmm) {
  const [h, m] = String(hhmm).split(':').map(Number);
  return h * 60 + m;
}

/** Normaliza um intervalo {start,end}; descarta se inválido ou start >= end. */
function normalizeInterval(raw) {
  if (!raw || typeof raw !== 'object') return null;
  const start = normalizeTimeHHMM(raw.start, null);
  const end = normalizeTimeHHMM(raw.end, null);
  if (!start || !end) return null;
  if (timeToMinutes(start) >= timeToMinutes(end)) return null;
  return { start, end };
}

/**
 * `schedule`: { [weekday 0-6]: Array<{start,end}> }.
 * Compatibilidade: sem `schedule`, gera a partir de weekdays + dayStart/dayEnd.
 * Se `schedule` e `weekdays` coexistirem, filtra o schedule aos dias em weekdays
 * (permite overrides parciais `{ weekdays: [2] }` sobre um schedule do escritório).
 */
function normalizeSchedule(rawSchedule, weekdays, dayStart, dayEnd) {
  const out = {};
  if (rawSchedule && typeof rawSchedule === 'object' && !Array.isArray(rawSchedule)) {
    for (let d = 0; d <= 6; d += 1) {
      const intervals = rawSchedule[d] ?? rawSchedule[String(d)];
      if (!Array.isArray(intervals)) continue;
      const normalized = intervals.map(normalizeInterval).filter(Boolean).slice(0, 8);
      if (normalized.length) out[d] = normalized;
    }
  }

  if (Object.keys(out).length === 0) {
    for (const wd of weekdays) {
      out[wd] = [{ start: dayStart, end: dayEnd }];
    }
    return out;
  }

  if (Array.isArray(weekdays) && weekdays.length) {
    const filtered = {};
    for (const wd of weekdays) {
      if (out[wd]) filtered[wd] = out[wd];
    }
    // Se o filtro esvaziou tudo (ex.: weekdays novo sem entradas no schedule),
    // recria a partir de dayStart/dayEnd para esses dias.
    if (Object.keys(filtered).length === 0) {
      for (const wd of weekdays) {
        filtered[wd] = [{ start: dayStart, end: dayEnd }];
      }
    }
    return filtered;
  }

  return out;
}

function deriveDayBounds(schedule) {
  let minStart = null;
  let maxEnd = null;
  for (const intervals of Object.values(schedule)) {
    for (const iv of intervals || []) {
      if (!minStart || timeToMinutes(iv.start) < timeToMinutes(minStart)) minStart = iv.start;
      if (!maxEnd || timeToMinutes(iv.end) > timeToMinutes(maxEnd)) maxEnd = iv.end;
    }
  }
  return {
    dayStart: minStart || DEFAULT_BOOKING.dayStart,
    dayEnd: maxEnd || DEFAULT_BOOKING.dayEnd,
  };
}

function normalizeBooking(raw) {
  const b = raw && typeof raw === 'object' ? raw : {};
  const slotMinutes = clamp(Number(b.slotMinutes) || DEFAULT_BOOKING.slotMinutes, 15, 120);
  const horizonDays = clamp(Number(b.horizonDays) || DEFAULT_BOOKING.horizonDays, 1, 60);
  const leadTimeHours = clamp(Number(b.leadTimeHours) || DEFAULT_BOOKING.leadTimeHours, 0, 168);
  let weekdays = Array.isArray(b.weekdays) ? b.weekdays.map((x) => Number(x)) : [...DEFAULT_BOOKING.weekdays];
  weekdays = [...new Set(weekdays.filter((d) => Number.isInteger(d) && d >= 0 && d <= 6))];
  if (weekdays.length === 0 && !(b.schedule && typeof b.schedule === 'object')) {
    weekdays = [...DEFAULT_BOOKING.weekdays];
  }
  const dayStartLegacy = normalizeTimeHHMM(b.dayStart, DEFAULT_BOOKING.dayStart);
  const dayEndLegacy = normalizeTimeHHMM(b.dayEnd, DEFAULT_BOOKING.dayEnd);
  const tz = normalizeTimezone(b.timezone);

  const schedule = normalizeSchedule(b.schedule, weekdays, dayStartLegacy, dayEndLegacy);
  const derivedWeekdays = Object.keys(schedule)
    .map(Number)
    .filter((d) => Number.isInteger(d) && d >= 0 && d <= 6)
    .sort((a, b) => a - b);
  const { dayStart, dayEnd } = deriveDayBounds(schedule);

  return {
    slotMinutes,
    horizonDays,
    leadTimeHours,
    weekdays: derivedWeekdays.length ? derivedWeekdays : weekdays,
    dayStart,
    dayEnd,
    timezone: tz,
    schedule,
    dateOverrides: normalizeDateOverrides(b.dateOverrides),
    /** Staff cuja ligação Google Calendar recebe sync dos agendamentos públicos/cliente. */
    googleCalendarStaffUserId: normalizeUuidOrNull(b.googleCalendarStaffUserId),
  };
}

/** dateOverrides: { 'YYYY-MM-DD': Array<{start,end}> | [] } — [] = fechado nesse dia. */
function normalizeDateOverrides(raw) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return {};
  const out = {};
  for (const [dateStr, intervals] of Object.entries(raw)) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) continue;
    if (!Array.isArray(intervals)) continue;
    // Array vazio = fechado — preservar
    if (intervals.length === 0) {
      out[dateStr] = [];
      continue;
    }
    const normalized = intervals.map(normalizeInterval).filter(Boolean).slice(0, 8);
    out[dateStr] = normalized;
  }
  return out;
}

function cloneDateOverrides(raw) {
  return normalizeDateOverrides(raw);
}

/**
 * Copia excepções de um mês civil (YYYY-MM) para outro.
 * Clona intervalos em profundidade — alterar o mês de destino não muta o de origem.
 * Substitui as chaves já existentes no mês de destino.
 */
function copyMonthDateOverrides(dateOverrides, fromYearMonth, toYearMonth) {
  if (!/^\d{4}-\d{2}$/.test(fromYearMonth) || !/^\d{4}-\d{2}$/.test(toYearMonth)) {
    throw new AppError('copyMonth exige from/to no formato YYYY-MM', 400);
  }
  if (fromYearMonth === toYearMonth) {
    throw new AppError('copyMonth: mês de origem e destino têm de ser diferentes', 400);
  }
  const source = normalizeDateOverrides(dateOverrides);
  const next = cloneDateOverrides(source);
  for (const key of Object.keys(next)) {
    if (key.startsWith(`${toYearMonth}-`)) delete next[key];
  }
  const [ty, tm] = toYearMonth.split('-').map(Number);
  const daysInTarget = new Date(ty, tm, 0).getDate();
  for (const [date, intervals] of Object.entries(source)) {
    if (!date.startsWith(`${fromYearMonth}-`)) continue;
    const day = date.slice(8, 10);
    if (!/^\d{2}$/.test(day)) continue;
    if (Number(day) > daysInTarget) continue;
    next[`${toYearMonth}-${day}`] = (intervals || []).map((iv) => ({ start: iv.start, end: iv.end }));
  }
  return next;
}

function overlaps(a0, a1, b0, b1) {
  return a0 < b1 && b0 < a1;
}

/**
 * Slots em ISO UTC usando janelas no fuso configurado do escritório.
 * Prioridade: dateOverrides[data] ?? schedule[weekday] ?? [].
 * dateOverrides[data] === [] significa fechado nesse dia.
 */
function computeAvailableSlotsTz({ fromMs, toMs, booking, durationMinutes, busyRanges }) {
  const { slotMinutes, schedule, dateOverrides } = booking;
  const tz = booking.timezone || 'Europe/Lisbon';
  const durMs = durationMinutes * 60 * 1000;
  const overrides = dateOverrides && typeof dateOverrides === 'object' ? dateOverrides : {};

  const busy = (busyRanges || [])
    .filter(Boolean)
    .map(({ start, end }) => ({ start, end }))
    .sort((a, b) => a.start - b.start);

  const out = [];
  let d = dayjs(fromMs).tz(tz).startOf('day');
  const lastDay = dayjs(toMs).tz(tz).startOf('day');

  while (d.valueOf() <= lastDay.valueOf()) {
    const wd = d.day();
    const dateStr = d.format('YYYY-MM-DD');
    const intervals =
      Object.prototype.hasOwnProperty.call(overrides, dateStr)
        ? overrides[dateStr] || []
        : (schedule && schedule[wd]) || [];
    if (intervals.length) {
      for (const { start: dayStart, end: dayEnd } of intervals) {
        let t = dayjs.tz(`${dateStr} ${dayStart}`, 'YYYY-MM-DD HH:mm', tz);
        const cap = dayjs.tz(`${dateStr} ${dayEnd}`, 'YYYY-MM-DD HH:mm', tz);

        while (t.valueOf() + durMs <= cap.valueOf() && t.valueOf() <= toMs) {
          const start = t.valueOf();
          const endSlot = start + durMs;
          if (start >= fromMs && endSlot <= cap.valueOf()) {
            const clash = busy.some((b) => overlaps(start, endSlot, b.start, b.end));
            if (!clash) out.push(new Date(start).toISOString());
          }
          t = t.add(slotMinutes, 'minute');
        }
      }
    }
    d = d.add(1, 'day');
  }

  // Ordena e deduplica (intervalos sobrepostos no mesmo dia)
  return [...new Set(out)].sort();
}

async function getBookingConfigForFirm(firmId) {
  const firm = await firmsRepository.findFirmById(firmId);
  if (!firm) throw new AppError('Escritório não encontrado', 404);
  return normalizeBooking(firm.settings?.booking);
}

async function updateBookingSettings(firmId, patch) {
  const firm = await firmsRepository.findFirmById(firmId);
  if (!firm) throw new AppError('Escritório não encontrado', 404);
  const prev = normalizeBooking(firm.settings?.booking || {});
  const body = patch && typeof patch === 'object' ? { ...patch } : {};
  const copyMonth = body.copyMonth;
  delete body.copyMonth;

  let merged = { ...prev, ...body };
  if (copyMonth != null) {
    if (typeof copyMonth !== 'object' || Array.isArray(copyMonth)) {
      throw new AppError('copyMonth deve ser um objeto { from, to }', 400);
    }
    const from = String(copyMonth.from || '');
    const to = String(copyMonth.to || '');
    // Base: dateOverrides do patch (se veio) ou os já persistidos — depois aplica a cópia.
    const baseOverrides =
      body.dateOverrides != null ? normalizeDateOverrides(body.dateOverrides) : prev.dateOverrides;
    merged.dateOverrides = copyMonthDateOverrides(baseOverrides, from, to);
  }

  const next = normalizeBooking(merged);
  await firmsRepository.mergeSettingsKey(firmId, 'booking', next);
  return next;
}

function consultationBusyRange(c) {
  const start = new Date(c.scheduledAt).getTime();
  const dm = Number(c.durationMinutes) || 60;
  return { start, end: start + dm * 60 * 1000 };
}

async function listSlotsForBooking({ firmId, serviceId, fromIso, toIso, ignoreHoldToken }) {
  const service = await accountingServicesRepository.findByIdForFirm(serviceId, firmId);
  if (!service || !service.isActive) throw new AppError('Serviço não encontrado', 404);

  const firm = await firmsRepository.findFirmById(firmId);
  if (!firm) throw new AppError('Escritório não encontrado', 404);
  // Overrides do Service sobrepõem, campo a campo, as regras gerais do escritório
  // (ver plan file da sessão, v8, secção 4) — null/ausente em qualquer campo cai
  // de volta para a regra do escritório, sem regressão para serviços sem overrides.
  const booking = normalizeBooking({ ...(firm.settings?.booking || {}), ...(service.bookingOverrides || {}) });

  const now = Date.now();
  const fromMs = Math.max(now + booking.leadTimeHours * 60 * 60 * 1000, new Date(fromIso).getTime());
  let toMs = new Date(toIso).getTime();
  const horizonEnd = now + booking.horizonDays * 24 * 60 * 60 * 1000;
  toMs = Math.min(toMs, horizonEnd);

  if (!Number.isFinite(fromMs) || !Number.isFinite(toMs) || toMs <= fromMs) {
    return { slots: [], service, booking };
  }

  const items = await consultationsRepository.listConsultations({
    firmId,
    from: new Date(fromMs - 48 * 60 * 60 * 1000).toISOString(),
    to: new Date(toMs + 48 * 60 * 60 * 1000).toISOString(),
    limit: 500,
  });
  const busyRanges = items
    .filter((c) => c.status === 'PENDING_PAYMENT' || c.status === 'SCHEDULED')
    .map(consultationBusyRange);

  const holds = await bookingHoldsRepository.listActiveForFirm(firmId, {
    from: new Date(fromMs - 48 * 60 * 60 * 1000).toISOString(),
    to: new Date(toMs + 48 * 60 * 60 * 1000).toISOString(),
  });
  const ownToken = typeof ignoreHoldToken === 'string' ? ignoreHoldToken.trim() : '';
  const blockingHolds = ownToken ? holds.filter((h) => h.holdToken !== ownToken) : holds;
  busyRanges.push(
    ...blockingHolds.map((h) =>
      consultationBusyRange({ scheduledAt: h.scheduledAt, durationMinutes: h.durationMinutes }),
    ),
  );

  // Junta os horários ocupados dos calendários Google pessoais ligados pela
  // equipa (Fase Hc) — falha aberta (getBusyRangesForFirm nunca lança), uma
  // integração externa opcional nunca pode derrubar a página de agendamento.
  const googleBusyRanges = await googleCalendarAvailabilityService.getBusyRangesForFirm({ firmId, fromMs, toMs });
  busyRanges.push(...googleBusyRanges);

  const slots = computeAvailableSlotsTz({
    fromMs,
    toMs,
    booking,
    durationMinutes: service.durationMinutes,
    busyRanges,
  });

  return { slots, service, booking };
}

/**
 * Reserva uma consultation real, para um Client já existente OU um Lead
 * (nunca os dois) — ver plan file da sessão, v8, secção 3. Um Lead novo
 * reserva um horário de verdade (bloqueia o slot para todos), sem ser
 * automaticamente convertido em Client — a conversão continua manual
 * (leads.service.js#convertToClient, que repontoa a consultation depois).
 */
async function bookAsClient({ firmId, clientId, leadId, serviceId, scheduledAt, ignoreHoldToken }) {
  if (Boolean(clientId) === Boolean(leadId)) {
    throw new AppError('Indique exactamente um titular (cliente ou lead)', 400);
  }
  const service = await accountingServicesRepository.findByIdForFirm(serviceId, firmId);
  if (!service || !service.isActive) throw new AppError('Serviço não encontrado', 404);

  const startMs = new Date(scheduledAt).getTime();
  if (!Number.isFinite(startMs)) throw new AppError('Data inválida', 400);

  const { slots, booking } = await listSlotsForBooking({
    firmId,
    serviceId,
    fromIso: new Date(startMs - 120 * 1000).toISOString(),
    toIso: new Date(startMs + 120 * 1000).toISOString(),
    ignoreHoldToken,
  });

  const match = slots.some((iso) => Math.abs(new Date(iso).getTime() - startMs) <= 90 * 1000);
  if (!match) throw new AppError('Este horário já não está disponível', 409);

  // Assignee público vem só das settings do escritório (não de overrides por serviço).
  const firm = await firmsRepository.findFirmById(firmId);
  const firmBooking = normalizeBooking(firm?.settings?.booking || {});
  const publicStaffId = firmBooking.googleCalendarStaffUserId || null;

  let consultation;
  try {
    consultation = await consultationsRepository.createConsultation({
      firmId,
      clientId: clientId || null,
      leadId: leadId || null,
      staffId: publicStaffId,
      title: service.name,
      scheduledAt: new Date(startMs).toISOString(),
      durationMinutes: service.durationMinutes,
      notes: null,
      status: 'SCHEDULED',
      accountingServiceId: service.id,
      priceCents: service.priceCents,
      currency: service.currency,
      source: 'CLIENT',
    });
  } catch (err) {
    // 23P01 = violação da exclusion constraint consultations_no_overlap —
    // outra requisição reservou este horário entre a checagem e o insert.
    if (err?.code === '23P01') {
      throw new AppError('Este horário já não está disponível', 409);
    }
    throw err;
  }

  // Fire-and-forget — falha do Google nunca reverte o booking.
  if (publicStaffId) {
    const googleCalendarSyncService = require('../integrations/google-calendar/google-calendar-sync.service');
    const leadsRepository = require('../../db/supabase/repositories/leads.repository');
    const clientsRepository = require('../../db/supabase/repositories/clients.repository');
    void (async () => {
      let requesterName = null;
      if (leadId) {
        const lead = await leadsRepository.findByIdForFirm(leadId, firmId);
        requesterName = lead?.name || null;
      } else if (clientId) {
        const client = await clientsRepository.findClientById(firmId, clientId);
        requesterName = client?.displayName || client?.name || null;
      }
      await googleCalendarSyncService.syncConsultationToGoogle({
        firmId,
        consultation,
        requesterName,
        timeZone: firmBooking.timezone || booking?.timezone || 'Europe/Lisbon',
      });
    })().catch(() => {});
  }

  return { consultation, service };
}

async function createAnonymousHold({ firmId, serviceId, scheduledAt }) {
  const service = await accountingServicesRepository.findByIdForFirm(serviceId, firmId);
  if (!service || !service.isActive || !service.requiresBooking) {
    throw new AppError('Serviço não encontrado', 404);
  }
  await bookingHoldsRepository.deleteExpired();
  const startMs = new Date(scheduledAt).getTime();
  if (!Number.isFinite(startMs)) throw new AppError('Data inválida', 400);

  const { slots } = await listSlotsForBooking({
    firmId,
    serviceId,
    fromIso: new Date(startMs - 120 * 1000).toISOString(),
    toIso: new Date(startMs + 120 * 1000).toISOString(),
  });
  const match = slots.some((iso) => Math.abs(new Date(iso).getTime() - startMs) <= 90 * 1000);
  if (!match) throw new AppError('Este horário já não está disponível', 409);

  const expiresAt = new Date(Date.now() + ANON_HOLD_MINUTES * 60 * 1000).toISOString();
  const holdToken = crypto.randomBytes(32).toString('hex');
  try {
    const hold = await bookingHoldsRepository.createHold({
      firmId,
      accountingServiceId: service.id,
      scheduledAt: new Date(startMs).toISOString(),
      durationMinutes: service.durationMinutes,
      holdToken,
      expiresAt,
    });
    return { holdToken: hold.holdToken, expiresAt: hold.expiresAt, scheduledAt: hold.scheduledAt };
  } catch (err) {
    if (err?.code === '23P01') {
      throw new AppError('Este horário já não está disponível', 409);
    }
    throw err;
  }
}

async function assertAnonymousHold({ firmId, serviceId, holdToken, scheduledAt }) {
  const token = String(holdToken || '').trim();
  if (!token || token.length < 32) throw new AppError('A reserva deste horário expirou. Escolha novamente.', 409);
  const hold = await bookingHoldsRepository.findByToken(token);
  if (!hold || String(hold.firmId) !== String(firmId) || String(hold.accountingServiceId) !== String(serviceId)) {
    throw new AppError('A reserva deste horário expirou. Escolha novamente.', 409);
  }
  if (new Date(hold.expiresAt).getTime() <= Date.now()) {
    await bookingHoldsRepository.deleteById(hold.id, firmId);
    throw new AppError('A reserva deste horário expirou. Escolha novamente.', 409);
  }
  const startMs = new Date(scheduledAt).getTime();
  const holdMs = new Date(hold.scheduledAt).getTime();
  if (!Number.isFinite(startMs) || Math.abs(startMs - holdMs) > 90 * 1000) {
    throw new AppError('O horário escolhido já não coincide com a reserva.', 409);
  }
  return hold;
}

async function consumeAnonymousHold({ firmId, serviceId, holdToken, scheduledAt }) {
  const hold = await assertAnonymousHold({ firmId, serviceId, holdToken, scheduledAt });
  await bookingHoldsRepository.deleteById(hold.id, firmId);
  return hold;
}

/** Liberta o hold depois de a consultation existir — não falha o pedido se já tiver expirado. */
async function releaseAnonymousHold({ firmId, holdToken }) {
  const token = String(holdToken || '').trim();
  if (!token) return false;
  const hold = await bookingHoldsRepository.findByToken(token);
  if (!hold || String(hold.firmId) !== String(firmId)) return false;
  await bookingHoldsRepository.deleteById(hold.id, firmId);
  return true;
}

async function expireAnonymousHolds() {
  return bookingHoldsRepository.deleteExpired();
}

function defaultBookingSeed() {
  return { ...DEFAULT_BOOKING };
}

module.exports = {
  BOOKING_TIMEZONES,
  defaultBooking: () => ({ ...DEFAULT_BOOKING }),
  defaultBookingSeed,
  normalizeBooking,
  normalizeDateOverrides,
  cloneDateOverrides,
  copyMonthDateOverrides,
  computeAvailableSlotsTz,
  getBookingConfigForFirm,
  updateBookingSettings,
  listSlotsForBooking,
  bookAsClient,
  createAnonymousHold,
  assertAnonymousHold,
  consumeAnonymousHold,
  releaseAnonymousHold,
  expireAnonymousHolds,
  ANON_HOLD_MINUTES,
};
