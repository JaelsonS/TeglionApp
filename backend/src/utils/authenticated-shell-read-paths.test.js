const { test } = require('node:test');
const assert = require('node:assert/strict');

const {
  isAuthenticatedShellReadPath,
  LEGACY_BADGE_PATHS_STILL_RATE_LIMITED,
  EXACT_SHELL_READ_PATHS,
} = require('./authenticated-shell-read-paths');

test('shell read paths: nav-badges e unread-summary skipped; métricas/inbox NÃO', () => {
  assert.equal(isAuthenticatedShellReadPath('/api/contabil/nav-badges'), true);
  assert.equal(isAuthenticatedShellReadPath('/api/contabil/messages/unread-summary'), true);
  assert.equal(isAuthenticatedShellReadPath('/api/contabil/live/events'), true);
  assert.equal(isAuthenticatedShellReadPath('/api/auth/me'), true);

  for (const path of LEGACY_BADGE_PATHS_STILL_RATE_LIMITED) {
    assert.equal(
      isAuthenticatedShellReadPath(path),
      false,
      `${path} must remain in the authenticated rate-limit bucket`,
    );
  }
});

test('shell read paths: auth/MFA/vault nunca skipped via shell helper', () => {
  const sensitive = [
    '/api/auth/login',
    '/api/auth/mfa/challenge/verify',
    '/api/auth/mfa/disable',
    '/api/contabil/clients/x/official-accesses',
    '/api/contabil/firm/close',
    '/api/contabil/team/1/permissions',
  ];
  for (const path of sensitive) {
    assert.equal(isAuthenticatedShellReadPath(path), false, path);
  }
});

test('shell read paths: query string ignored; notifications prefix ok', () => {
  assert.equal(isAuthenticatedShellReadPath('/api/contabil/nav-badges?x=1'), true);
  assert.equal(isAuthenticatedShellReadPath('/api/contabil/notifications'), true);
  assert.equal(isAuthenticatedShellReadPath('/api/contabil/notifications/foo'), true);
  assert.ok(EXACT_SHELL_READ_PATHS.includes('/api/contabil/nav-badges'));
});
