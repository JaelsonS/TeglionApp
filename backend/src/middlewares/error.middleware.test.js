const dotenv = require('dotenv');
const originalDotenvConfig = dotenv.config.bind(dotenv);
dotenv.config = (options = {}) => originalDotenvConfig({ ...options, override: false });

process.env.NODE_ENV = process.env.NODE_ENV || 'test';
process.env.JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || 'test-access-secret-min-32-chars!!';
process.env.JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'test-refresh-secret-min-32-chars!';
process.env.SUPABASE_URL = process.env.SUPABASE_URL || 'https://example.supabase.co';
process.env.SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'test-service-role-key';

const { test } = require('node:test');
const assert = require('node:assert/strict');

const { AppError, errorMiddleware } = require('./error.middleware');

function createMockRes() {
    return {
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
}

test('errorMiddleware inclui requestId no payload de erro', () => {
    const req = {
        id: 'req-123',
        method: 'POST',
        path: '/api/contabil/clients',
        get() {
            return undefined;
        },
    };
    const res = createMockRes();

    errorMiddleware(new AppError('Falha de validação', 400, { code: 'VALIDATION_ERROR' }), req, res, () => { });

    assert.equal(res.statusCode, 400);
    assert.equal(res.body.requestId, 'req-123');
    assert.equal(res.body.code, 'VALIDATION_ERROR');
});

test('errorMiddleware mapeia 503 para SERVICE_UNAVAILABLE quando sem code', () => {
    const req = {
        id: 'req-503',
        method: 'GET',
        path: '/api/public/postal-lookup',
        get() {
            return undefined;
        },
    };
    const res = createMockRes();

    errorMiddleware(new AppError('indisponível', 503), req, res, () => { });

    assert.equal(res.statusCode, 503);
    assert.equal(res.body.code, 'SERVICE_UNAVAILABLE');
    assert.equal(res.body.message, 'indisponível');
});

test('errorMiddleware preserva POSTAL_LOOKUP_UNAVAILABLE', () => {
    const req = {
        id: 'req-postal',
        method: 'GET',
        path: '/api/public/postal-lookup',
        get() {
            return undefined;
        },
    };
    const res = createMockRes();

    errorMiddleware(
        new AppError('Não foi possível localizar o endereço. Preencha manualmente.', 503, undefined, 'POSTAL_LOOKUP_UNAVAILABLE'),
        req,
        res,
        () => { },
    );

    assert.equal(res.statusCode, 503);
    assert.equal(res.body.code, 'POSTAL_LOOKUP_UNAVAILABLE');
});

test('errorMiddleware usa X-Request-Id quando req.id não existe', () => {
    const req = {
        method: 'GET',
        path: '/api/contabil/dashboard',
        get(name) {
            if (String(name).toLowerCase() === 'x-request-id') return 'edge-789';
            return undefined;
        },
    };
    const res = createMockRes();

    errorMiddleware(new Error('boom'), req, res, () => { });

    assert.equal(res.statusCode, 500);
    assert.equal(res.body.requestId, 'edge-789');
    assert.equal(res.body.code, 'INTERNAL_ERROR');
});
