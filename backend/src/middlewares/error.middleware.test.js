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
