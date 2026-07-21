#!/usr/bin/env node
require('dotenv').config();
require('dotenv').config({ path: require('path').join(__dirname, '../.env.local'), override: true });

const axios = require('axios');

const base = String(process.env.API_BASE || process.env.BACKEND_URL || '').replace(/\/$/, '');

function ok(msg, detail = '') {
    console.log(`✅ ${msg}${detail ? ` — ${detail}` : ''}`);
}

function fail(msg, detail = '') {
    console.error(`❌ ${msg}${detail ? ` — ${detail}` : ''}`);
}

async function expectStatus(path, expected) {
    const res = await axios.get(`${base}${path}`, {
        timeout: 15000,
        validateStatus: () => true,
        headers: {
            'X-Request-Id': `drill-${Date.now().toString(36)}`,
        },
    });

    if (res.status !== expected) {
        throw new Error(`${path} status=${res.status} esperado=${expected}`);
    }

    return res;
}

async function main() {
    if (!base) {
        fail('API_BASE obrigatório', 'defina API_BASE ou BACKEND_URL');
        process.exit(1);
    }

    console.log('\n=== Drill de Incidente Teglion ===\n');

    const health = await expectStatus('/health', 200);
    ok('Health geral', `${base}/health`);

    if (!health.data || typeof health.data !== 'object') {
        throw new Error('Payload de /health inválido');
    }

    const publicHealth = await expectStatus('/api/public/health', 200);
    ok('Health público API', '/api/public/health');

    if (!publicHealth.headers['x-request-id']) {
        throw new Error('x-request-id ausente em endpoint público');
    }
    ok('Correlação request-id em health', publicHealth.headers['x-request-id']);

    const unauthorized = await axios.get(`${base}/api/contabil/clients`, {
        timeout: 15000,
        validateStatus: () => true,
        headers: {
            'X-Request-Id': `drill-auth-${Date.now().toString(36)}`,
        },
    });

    if (unauthorized.status !== 401) {
        throw new Error(`Esperado 401 em /api/contabil/clients sem auth, recebido ${unauthorized.status}`);
    }
    if (!unauthorized.data?.requestId) {
        throw new Error('Payload de erro sem requestId em /api/contabil/clients');
    }
    ok('Resposta 401 com requestId', unauthorized.data.requestId);

    const missingRoute = await axios.get(`${base}/api/route-does-not-exist`, {
        timeout: 15000,
        validateStatus: () => true,
        headers: {
            'X-Request-Id': `drill-404-${Date.now().toString(36)}`,
        },
    });

    if (missingRoute.status !== 404) {
        throw new Error(`Esperado 404 em rota inexistente, recebido ${missingRoute.status}`);
    }

    if (!missingRoute.data?.code || missingRoute.data.code !== 'ROUTE_NOT_FOUND') {
        throw new Error('Código de erro inválido em rota inexistente');
    }
    ok('Contrato de erro 404', missingRoute.data.code);

    console.log('\n✅ Drill operacional aprovado: saúde, correlação e contrato de erro validados.\n');
}

main().catch((err) => {
    fail('Drill de incidente falhou', err.message || String(err));
    process.exit(1);
});
