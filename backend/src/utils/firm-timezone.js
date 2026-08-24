/**
 * Fuso horário do escritório para cálculo de "hoje" em obrigações/automações.
 *
 * Hoje eu ainda não tenho uma coluna `firms.timezone` dedicada (ver ROADMAP.md,
 * item 3.2) — o único fuso que eu salvo por escritório vive em
 * `firms.settings.booking.timezone`, restrito à mesma allow-list que o módulo de
 * Booking já usa. Reaproveito essa fonte aqui em vez de assumir UTC, porque hoje
 * todos os escritórios pilotos são portugueses e UTC diverge de Europe/Lisbon
 * durante o horário de verão — o suficiente pra marcar uma obrigação como
 * atrasada um dia antes ou depois da hora certa perto da virada do dia.
 */
const dayjs = require('dayjs');
const utc = require('dayjs/plugin/utc');
const timezone = require('dayjs/plugin/timezone');

dayjs.extend(utc);
dayjs.extend(timezone);

const { BOOKING_TIMEZONES } = require('../modules/booking/booking.service');

const DEFAULT_FIRM_TIMEZONE = 'Europe/Lisbon';
const ALLOWED_TIMEZONES = new Set(BOOKING_TIMEZONES);

function resolveFirmTimezone(firm) {
  const tz = firm?.settings?.booking?.timezone;
  return typeof tz === 'string' && ALLOWED_TIMEZONES.has(tz) ? tz : DEFAULT_FIRM_TIMEZONE;
}

/** 'YYYY-MM-DD' do dia civil atual no fuso do escritório (não UTC). */
function todayInTimezone(timezone_ = DEFAULT_FIRM_TIMEZONE, referenceDate = new Date()) {
  return dayjs(referenceDate).tz(timezone_).format('YYYY-MM-DD');
}

/** Soma dias de calendário a uma data 'YYYY-MM-DD' — aritmética pura, sem fuso. */
function addDaysToDateString(dateStr, days) {
  return dayjs(dateStr, 'YYYY-MM-DD').add(days, 'day').format('YYYY-MM-DD');
}

module.exports = {
  DEFAULT_FIRM_TIMEZONE,
  resolveFirmTimezone,
  todayInTimezone,
  addDaysToDateString,
};
