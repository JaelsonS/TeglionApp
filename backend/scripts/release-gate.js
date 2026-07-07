#!/usr/bin/env node
require('dotenv').config();
require('dotenv').config({ path: require('path').join(__dirname, '../.env.local'), override: true });

const { spawn, spawnSync } = require('child_process');
const axios = require('axios');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const API_BASE = process.env.API_BASE || 'http://127.0.0.1:8001';

function runNodeScript(scriptRelPath, extraEnv = {}) {
    const fullPath = path.join(ROOT, scriptRelPath);
    const result = spawnSync(process.execPath, [fullPath], {
        cwd: ROOT,
        env: { ...process.env, ...extraEnv },
        stdio: 'inherit',
    });
    if (result.status !== 0) {
        throw new Error(`${scriptRelPath} falhou com status ${result.status}`);
    }
}

async function waitForHealth(base, timeoutMs = 60000) {
    const start = Date.now();
    while (Date.now() - start < timeoutMs) {
        try {
            const res = await axios.get(`${base.replace(/\/$/, '')}/health`, {
                timeout: 3000,
                validateStatus: () => true,
            });
            if (res.status === 200) return;
        } catch {
            // ignore and retry
        }
        await new Promise((resolve) => setTimeout(resolve, 1000));
    }
    throw new Error('API não ficou pronta dentro do timeout');
}

async function main() {
    console.log('\n=== Release Gate Backend (estrito) ===\n');

    const api = spawn(process.execPath, ['src/server.js'], {
        cwd: ROOT,
        env: {
            ...process.env,
            ALLOW_BEARER_AUTH: 'true',
        },
        stdio: 'inherit',
    });

    try {
        await waitForHealth(API_BASE);

        runNodeScript('scripts/tenant-isolation-test.js', {
            API_BASE,
            ALLOW_BEARER_AUTH: 'true',
            TENANT_ISOLATION_REQUIRE_API_BASE: 'true',
            TENANT_ISOLATION_FAIL_ON_WARNINGS: 'true',
        });

        runNodeScript('scripts/pilot-smoke-e2e.js', {
            API_BASE,
        });

        runNodeScript('scripts/runbook-incident-drill.js', {
            API_BASE,
        });

        console.log('\n✅ Release gate backend aprovado.\n');
    } finally {
        api.kill('SIGTERM');
    }
}

main().catch((err) => {
    console.error(`\n❌ Release gate backend falhou: ${err.message || String(err)}\n`);
    process.exit(1);
});
