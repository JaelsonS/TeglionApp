const test = require('node:test');
const assert = require('node:assert/strict');

const { env } = require('../../../config/env');
const googleCalendarService = require('./google-calendar.service');

test('isGoogleCalendarConfigured: false quando faltam credenciais', () => {
  const prevId = env.GOOGLE_OAUTH_CLIENT_ID;
  const prevSecret = env.GOOGLE_OAUTH_CLIENT_SECRET;
  env.GOOGLE_OAUTH_CLIENT_ID = null;
  env.GOOGLE_OAUTH_CLIENT_SECRET = null;
  try {
    assert.equal(googleCalendarService.isGoogleCalendarConfigured(), false);
  } finally {
    env.GOOGLE_OAUTH_CLIENT_ID = prevId;
    env.GOOGLE_OAUTH_CLIENT_SECRET = prevSecret;
  }
});

test('isGoogleCalendarConfigured: true quando ambas as credenciais estão presentes', () => {
  const prevId = env.GOOGLE_OAUTH_CLIENT_ID;
  const prevSecret = env.GOOGLE_OAUTH_CLIENT_SECRET;
  env.GOOGLE_OAUTH_CLIENT_ID = 'client-x';
  env.GOOGLE_OAUTH_CLIENT_SECRET = 'secret-x';
  try {
    assert.equal(googleCalendarService.isGoogleCalendarConfigured(), true);
  } finally {
    env.GOOGLE_OAUTH_CLIENT_ID = prevId;
    env.GOOGLE_OAUTH_CLIENT_SECRET = prevSecret;
  }
});

test('buildCalendarAuthUrl: pede offline+consent (para garantir refresh_token) e o scope mínimo de eventos', () => {
  const prevId = env.GOOGLE_OAUTH_CLIENT_ID;
  const prevRedirect = env.GOOGLE_CALENDAR_REDIRECT_URI;
  env.GOOGLE_OAUTH_CLIENT_ID = 'client-x';
  env.GOOGLE_CALENDAR_REDIRECT_URI = 'https://teglion.com/api/contabil/integrations/google-calendar/callback';
  try {
    const url = new URL(googleCalendarService.buildCalendarAuthUrl('state-123'));
    assert.equal(url.searchParams.get('access_type'), 'offline');
    assert.equal(url.searchParams.get('prompt'), 'consent');
    assert.equal(url.searchParams.get('scope'), 'https://www.googleapis.com/auth/calendar.events');
    assert.equal(url.searchParams.get('state'), 'state-123');
    assert.equal(url.searchParams.get('redirect_uri'), env.GOOGLE_CALENDAR_REDIRECT_URI);
  } finally {
    env.GOOGLE_OAUTH_CLIENT_ID = prevId;
    env.GOOGLE_CALENDAR_REDIRECT_URI = prevRedirect;
  }
});

test('generateOAuthState: gera valores diferentes a cada chamada (não previsível)', () => {
  const a = googleCalendarService.generateOAuthState();
  const b = googleCalendarService.generateOAuthState();
  assert.notEqual(a, b);
  assert.ok(a.length >= 32);
});
