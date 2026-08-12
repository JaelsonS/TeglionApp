const { env } = require('../../../config/env');
const { requireUserFirmId } = require('../../../utils/contabil-scope');
const { buildAuthCookieOptions } = require('../../../utils/auth-cookies');
const { logger } = require('../../../utils/logger');
const { AppError } = require('../../../middlewares/error.middleware');
const {
  isGoogleCalendarConfigured,
  generateOAuthState,
  buildCalendarAuthUrl,
} = require('./google-calendar.service');
const connectionsService = require('./google-calendar-connections.service');

const STATE_COOKIE = 'gcal_oauth_state';

function toHttpError(err) {
  if (err instanceof AppError) return err;
  const status = Number(err?.status) || 500;
  return new AppError(err?.message || 'Erro Google Calendar', status, undefined, err?.code || undefined);
}

async function getStatus(req, res, next) {
  try {
    const firmId = requireUserFirmId(req);
    const result = await connectionsService.getStatus({ firmId, staffUserId: req.user.id });
    return res.json({ configured: isGoogleCalendarConfigured(), ...result });
  } catch (err) {
    return next(err);
  }
}

function startConnect(req, res) {
  if (!isGoogleCalendarConfigured()) {
    return res.status(503).json({ code: 'GOOGLE_CALENDAR_DISABLED', message: 'Integração Google Calendar não configurada.' });
  }
  const state = generateOAuthState();
  res.cookie(STATE_COOKIE, state, { ...buildAuthCookieOptions(req), maxAge: 10 * 60 * 1000 });
  return res.redirect(buildCalendarAuthUrl(state));
}

async function callback(req, res) {
  const settingsUrl = `${env.FRONTEND_URL}/app/firm/agenda?panel=settings`;

  if (!isGoogleCalendarConfigured()) {
    return res.redirect(`${settingsUrl}&calendar=error`);
  }

  const { code, state, error } = req.query;
  const savedState = req.cookies?.[STATE_COOKIE];
  res.clearCookie(STATE_COOKIE, buildAuthCookieOptions(req));

  if (error || !state || !savedState || state !== savedState || !code) {
    return res.redirect(`${settingsUrl}&calendar=error`);
  }

  try {
    const firmId = requireUserFirmId(req);
    await connectionsService.completeConnection({ firmId, staffUserId: req.user.id, code: String(code).trim() });
    return res.redirect(`${settingsUrl}&calendar=connected`);
  } catch (err) {
    logger.safe.warn('[google-calendar] callback failed', { message: err?.message });
    return res.redirect(`${settingsUrl}&calendar=error`);
  }
}

async function disconnect(req, res, next) {
  try {
    const firmId = requireUserFirmId(req);
    const result = await connectionsService.disconnect({ firmId, staffUserId: req.user.id });
    return res.json(result);
  } catch (err) {
    return next(err);
  }
}

async function listCalendars(req, res, next) {
  try {
    const firmId = requireUserFirmId(req);
    const calendars = await connectionsService.listCalendarsForStaff({ firmId, staffUserId: req.user.id });
    return res.json({ calendars });
  } catch (err) {
    return next(toHttpError(err));
  }
}

async function selectCalendar(req, res, next) {
  try {
    const firmId = requireUserFirmId(req);
    const { calendarId, calendarSummary } = req.body || {};
    const result = await connectionsService.selectCalendar({
      firmId,
      staffUserId: req.user.id,
      calendarId,
      calendarSummary,
    });
    return res.json(result);
  } catch (err) {
    return next(toHttpError(err));
  }
}

async function setPublicSync(req, res, next) {
  try {
    const firmId = requireUserFirmId(req);
    const enabled = Boolean(req.body?.enabled);
    const result = await connectionsService.setPublicSync({
      firmId,
      staffUserId: req.user.id,
      enabled,
    });
    return res.json(result);
  } catch (err) {
    return next(toHttpError(err));
  }
}

module.exports = {
  getStatus,
  startConnect,
  callback,
  disconnect,
  listCalendars,
  selectCalendar,
  setPublicSync,
};
