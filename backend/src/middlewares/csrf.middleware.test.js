require('../test/ensure-test-env');

const test = require('node:test');
const assert = require('node:assert/strict');
const { env } = require('../config/env');
const {
  csrfProtection,
  CSRF_COOKIE_NAME,
  CSRF_HEADER_NAME,
  trustedAuthenticatedSpaCanBypassCsrfMismatch,
} = require('./csrf.middleware');

function restoreEnv(snapshot) {
  env.FRONTEND_URL = snapshot.frontend;
  env.isDevelopment = snapshot.isDevelopment;
  env.isProduction = snapshot.isProduction;
}

function mockRes() {
  const res = {
    statusCode: 200,
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.body = payload;
      return this;
    },
  };
  return res;
}

function baseReq(overrides = {}) {
  const headers = {
    origin: 'https://teglion.com',
    'x-requested-with': 'XMLHttpRequest',
    [CSRF_HEADER_NAME]: 'a'.repeat(64),
    ...(overrides.headers || {}),
  };
  return {
    method: 'POST',
    path: '/api/contabil/fee-charges',
    originalUrl: '/api/contabil/fee-charges',
    url: '/api/contabil/fee-charges',
    cookies: {
      accessToken: 'session-token',
      [CSRF_COOKIE_NAME]: 'b'.repeat(64),
      ...(overrides.cookies || {}),
    },
    get(name) {
      const key = String(name || '').toLowerCase();
      for (const [k, v] of Object.entries(headers)) {
        if (k.toLowerCase() === key) return v;
      }
      return undefined;
    },
    headers,
    ...overrides,
  };
}

test('CSRF prod: mismatch com header falso → 403 (sem bypass)', () => {
  const snapshot = {
    frontend: env.FRONTEND_URL,
    isDevelopment: env.isDevelopment,
    isProduction: env.isProduction,
  };
  env.FRONTEND_URL = 'https://teglion.com';
  env.isProduction = true;
  env.isDevelopment = false;
  try {
    const req = baseReq();
    const res = mockRes();
    let nextCalled = false;
    csrfProtection(req, res, () => {
      nextCalled = true;
    });
    assert.equal(nextCalled, false);
    assert.equal(res.statusCode, 403);
    assert.equal(res.body?.code, 'CSRF_INVALID');
  } finally {
    restoreEnv(snapshot);
  }
});

test('CSRF prod: cookie === header → next()', () => {
  const snapshot = {
    frontend: env.FRONTEND_URL,
    isDevelopment: env.isDevelopment,
    isProduction: env.isProduction,
  };
  env.FRONTEND_URL = 'https://teglion.com';
  env.isProduction = true;
  env.isDevelopment = false;
  try {
    const token = 'c'.repeat(64);
    const req = baseReq({
      cookies: { accessToken: 'session', [CSRF_COOKIE_NAME]: token },
      headers: {
        origin: 'https://teglion.com',
        'x-requested-with': 'XMLHttpRequest',
        [CSRF_HEADER_NAME]: token,
      },
    });
    const res = mockRes();
    let nextCalled = false;
    csrfProtection(req, res, () => {
      nextCalled = true;
    });
    assert.equal(nextCalled, true);
    assert.equal(res.statusCode, 200);
  } finally {
    restoreEnv(snapshot);
  }
});

test('CSRF staging: mismatch autenticado SPA → next() (bypass estreito)', () => {
  const snapshot = {
    frontend: env.FRONTEND_URL,
    isDevelopment: env.isDevelopment,
    isProduction: env.isProduction,
  };
  env.FRONTEND_URL = 'https://staging.teglion.com';
  env.isProduction = true;
  env.isDevelopment = false;
  try {
    const req = baseReq({
      headers: {
        origin: 'https://staging.teglion.com',
        'x-requested-with': 'XMLHttpRequest',
        [CSRF_HEADER_NAME]: 'd'.repeat(64),
      },
    });
    const res = mockRes();
    let nextCalled = false;
    csrfProtection(req, res, () => {
      nextCalled = true;
    });
    assert.equal(nextCalled, true);
  } finally {
    restoreEnv(snapshot);
  }
});

test('CSRF staging: mismatch sem sessão em rota autenticada → 403', () => {
  const snapshot = {
    frontend: env.FRONTEND_URL,
    isDevelopment: env.isDevelopment,
    isProduction: env.isProduction,
  };
  env.FRONTEND_URL = 'https://staging.teglion.com';
  env.isProduction = true;
  env.isDevelopment = false;
  try {
    const req = baseReq({
      cookies: { [CSRF_COOKIE_NAME]: 'b'.repeat(64) },
      headers: {
        origin: 'https://staging.teglion.com',
        'x-requested-with': 'XMLHttpRequest',
        [CSRF_HEADER_NAME]: 'd'.repeat(64),
      },
    });
    const res = mockRes();
    let nextCalled = false;
    csrfProtection(req, res, () => {
      nextCalled = true;
    });
    assert.equal(nextCalled, false);
    assert.equal(res.statusCode, 403);
  } finally {
    restoreEnv(snapshot);
  }
});

test('CSRF staging: mismatch sem sessão em login-firm → next() (public auth)', () => {
  const snapshot = {
    frontend: env.FRONTEND_URL,
    isDevelopment: env.isDevelopment,
    isProduction: env.isProduction,
  };
  env.FRONTEND_URL = 'https://staging.teglion.com';
  env.isProduction = true;
  env.isDevelopment = false;
  try {
    const req = baseReq({
      method: 'POST',
      path: '/api/auth/login-firm',
      originalUrl: '/api/auth/login-firm',
      url: '/api/auth/login-firm',
      cookies: { [CSRF_COOKIE_NAME]: 'b'.repeat(64) },
      headers: {
        origin: 'https://staging.teglion.com',
        'x-requested-with': 'XMLHttpRequest',
        [CSRF_HEADER_NAME]: 'd'.repeat(64),
      },
    });
    const res = mockRes();
    let nextCalled = false;
    csrfProtection(req, res, () => {
      nextCalled = true;
    });
    assert.equal(nextCalled, true);
  } finally {
    restoreEnv(snapshot);
  }
});

test('helper: bypass false em FRONTEND_URL de produção', () => {
  const snapshot = {
    frontend: env.FRONTEND_URL,
    isDevelopment: env.isDevelopment,
    isProduction: env.isProduction,
  };
  env.FRONTEND_URL = 'https://www.teglion.com';
  try {
    const req = baseReq({
      headers: {
        origin: 'https://www.teglion.com',
        'x-requested-with': 'XMLHttpRequest',
        [CSRF_HEADER_NAME]: 'e'.repeat(64),
      },
    });
    assert.equal(trustedAuthenticatedSpaCanBypassCsrfMismatch(req, 'e'.repeat(64)), false);
  } finally {
    restoreEnv(snapshot);
  }
});

test('CSRF prod: sem cookie nem header → 403 (não usa bypass staging)', () => {
  const snapshot = {
    frontend: env.FRONTEND_URL,
    isDevelopment: env.isDevelopment,
    isProduction: env.isProduction,
  };
  env.FRONTEND_URL = 'https://teglion.com';
  env.isProduction = true;
  env.isDevelopment = false;
  try {
    const req = baseReq({
      cookies: { accessToken: 'session' },
      headers: {
        origin: 'https://teglion.com',
        'x-requested-with': 'XMLHttpRequest',
      },
    });
    // remove CSRF header
    const headers = {
      origin: 'https://teglion.com',
      'x-requested-with': 'XMLHttpRequest',
    };
    req.get = (name) => {
      const key = String(name || '').toLowerCase();
      for (const [k, v] of Object.entries(headers)) {
        if (k.toLowerCase() === key) return v;
      }
      return undefined;
    };
    const res = mockRes();
    let nextCalled = false;
    csrfProtection(req, res, () => {
      nextCalled = true;
    });
    assert.equal(nextCalled, false);
    assert.equal(res.statusCode, 403);
  } finally {
    restoreEnv(snapshot);
  }
});
