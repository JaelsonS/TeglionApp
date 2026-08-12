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

test('buildCalendarAuthUrl: offline+consent e scopes de eventos+lista+email', () => {
  const prevId = env.GOOGLE_OAUTH_CLIENT_ID;
  const prevRedirect = env.GOOGLE_CALENDAR_REDIRECT_URI;
  env.GOOGLE_OAUTH_CLIENT_ID = 'client-x';
  env.GOOGLE_CALENDAR_REDIRECT_URI = 'https://teglion.com/api/contabil/integrations/google-calendar/callback';
  try {
    const url = new URL(googleCalendarService.buildCalendarAuthUrl('state-123'));
    assert.equal(url.searchParams.get('access_type'), 'offline');
    assert.equal(url.searchParams.get('prompt'), 'consent');
    const scope = url.searchParams.get('scope') || '';
    assert.ok(scope.includes('calendar.events'));
    assert.ok(scope.includes('calendar.calendarlist.readonly'));
    assert.ok(scope.includes('email') || scope.includes('openid'));
    assert.equal(url.searchParams.get('state'), 'state-123');
    assert.equal(url.searchParams.get('redirect_uri'), env.GOOGLE_CALENDAR_REDIRECT_URI);
  } finally {
    env.GOOGLE_OAUTH_CLIENT_ID = prevId;
    env.GOOGLE_CALENDAR_REDIRECT_URI = prevRedirect;
  }
});

test('generateOAuthState: gera valores diferentes a cada chamada', () => {
  const a = googleCalendarService.generateOAuthState();
  const b = googleCalendarService.generateOAuthState();
  assert.notEqual(a, b);
  assert.ok(a.length >= 32);
});

test('consultationICalUID: determinístico por consultation id', () => {
  assert.equal(
    googleCalendarService.consultationICalUID('c1'),
    'teglion-consultation-c1@teglion.com',
  );
});
