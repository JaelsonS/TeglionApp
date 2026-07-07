const dayjs = require('dayjs');
const utc = require('dayjs/plugin/utc');
const timezone = require('dayjs/plugin/timezone');

dayjs.extend(utc);
dayjs.extend(timezone);

const { AppError } = require('../../middlewares/error.middleware');
const firmsRepository = require('../../db/supabase/repositories/firms.repository');
const consultationsRepository = require('../../db/supabase/repositories/consultations.repository');
const accountingServicesRepository = require('../../db/supabase/repositories/accounting-services.repository');

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

function clamp(n, min, max) {
  return Math.min(max, Math.max(min, n));
}

function normalizeTimezone(raw) {
  const z = typeof raw === 'string' ? raw.trim() : '';
  return TZ_SET.has(z) ? z : 'Europe/Lisbon';
}

function normalizeBooking(raw) {
  const b = raw && typeof raw === 'object' ? raw : {};
  const slotMinutes = clamp(Number(b.slotMinutes) || DEFAULT_BOOKING.slotMinutes, 15, 120);
  const horizonDays = clamp(Number(b.horizonDays) || DEFAULT_BOOKING.horizonDays, 1, 60);
  const leadTimeHours = clamp(Number(b.leadTimeHours) || DEFAULT_BOOKING.leadTimeHours, 0, 168);
  let weekdays = Array.isArray(b.weekdays) ? b.weekdays.map((x) => Number(x)) : [...DEFAULT_BOOKING.weekdays];
  weekdays = [...new Set(weekdays.filter((d) => Number.isInteger(d) && d >= 0 && d <= 6))];
  if (weekdays.length === 0) weekdays = [...DEFAULT_BOOKING.weekdays];
  const dayStart = typeof b.dayStart === 'string' && /^\d{1,2}:\d{2}$/.test(b.dayStart) ? b.dayStart : DEFAULT_BOOKING.dayStart;
  const dayEnd = typeof b.dayEnd === 'string' && /^\d{1,2}:\d{2}$/.test(b.dayEnd) ? b.dayEnd : DEFAULT_BOOKING.dayEnd;
  const tz = normalizeTimezone(b.timezone);
  return { slotMinutes, horizonDays, leadTimeHours, weekdays, dayStart, dayEnd, timezone: tz };
}

function overlaps(a0, a1, b0, b1) {
  return a0 < b1 && b0 < a1;
}

/**
 * Slots em ISO UTC usando janelas no fuso configurado do escritório.
 */
function computeAvailableSlotsTz({ fromMs, toMs, booking, durationMinutes, busyRanges }) {
  const { slotMinutes, weekdays, dayStart, dayEnd } = booking;
  const tz = booking.timezone || 'Europe/Lisbon';
  const slotMs = slotMinutes * 60 * 1000;
  const durMs = durationMinutes * 60 * 1000;

  const busy = (busyRanges || [])
    .filter(Boolean)
    .map(({ start, end }) => ({ start, end }))
    .sort((a, b) => a.start - b.start);

  const out = [];
  let d = dayjs(fromMs).tz(tz).startOf('day');
  const lastDay = dayjs(toMs).tz(tz).startOf('day');

  while (d.valueOf() <= lastDay.valueOf()) {
    const wd = d.day();
    if (weekdays.includes(wd)) {
      const dateStr = d.format('YYYY-MM-DD');
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
    d = d.add(1, 'day');
  }

  return out;
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
  const next = normalizeBooking({ ...prev, ...(patch || {}) });
  await firmsRepository.mergeSettingsKey(firmId, 'booking', next);
  return next;
}

function consultationBusyRange(c) {
  const start = new Date(c.scheduledAt).getTime();
  const dm = Number(c.durationMinutes) || 60;
  return { start, end: start + dm * 60 * 1000 };
}

async function listSlotsForBooking({ firmId, serviceId, fromIso, toIso }) {
  const service = await accountingServicesRepository.findByIdForFirm(serviceId, firmId);
  if (!service || !service.isActive) throw new AppError('Serviço não encontrado', 404);

  const firm = await firmsRepository.findFirmById(firmId);
  if (!firm) throw new AppError('Escritório não encontrado', 404);
  const booking = normalizeBooking(firm.settings?.booking);

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
    .filter((c) => c.status !== 'CANCELLED')
    .map(consultationBusyRange);

  const slots = computeAvailableSlotsTz({
    fromMs,
    toMs,
    booking,
    durationMinutes: service.durationMinutes,
    busyRanges,
  });

  return { slots, service, booking };
}

async function bookAsClient({ firmId, clientId, serviceId, scheduledAt }) {
  const service = await accountingServicesRepository.findByIdForFirm(serviceId, firmId);
  if (!service || !service.isActive) throw new AppError('Serviço não encontrado', 404);

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

  const consultation = await consultationsRepository.createConsultation({
    firmId,
    clientId,
    staffId: null,
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

  return { consultation, service };
}

function defaultBookingSeed() {
  return { ...DEFAULT_BOOKING };
}

module.exports = {
  BOOKING_TIMEZONES,
  defaultBooking: () => ({ ...DEFAULT_BOOKING }),
  defaultBookingSeed,
  normalizeBooking,
  getBookingConfigForFirm,
  updateBookingSettings,
  listSlotsForBooking,
  bookAsClient,
};
