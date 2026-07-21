#!/usr/bin/env node
/**
 * Smoke manual/automático de produção Teglion.
 *
 * Cobre: health, páginas públicas, Redis, Brevo, Sentry config,
 * JWT autenticado (owner real na BD), listagem de equipa, settings RBAC,
 * criação temporária de colaborador (sem e-mail) + desactivação.
 *
 * Uso:
 *   cd backend && node scripts/production-smoke-manual.js
 *   API_BASE=https://teglionapp.onrender.com FE_BASE=https://www.teglion.com node scripts/production-smoke-manual.js
 */
require('dotenv').config();
require('dotenv').config({ path: require('path').join(__dirname, '../.env.local'), override: true });

const axios = require('axios');
const { env } = require('../src/config/env');
const { getSupabaseAdmin, isSupabaseConfigured } = require('../src/db/supabase/client');
const { signAccessToken } = require('../src/config/jwt');
const { initRateLimitRedis, getSharedRedisClient, closeRateLimitRedis } = require('../src/utils/rate-limit-store');
const firmUsersRepository = require('../src/db/supabase/repositories/firm-users.repository');
const teamService = require('../src/modules/firm/team.service');
const firmSettingsService = require('../src/modules/firm/firm-settings.service');

const API_BASE = String(process.env.API_BASE || 'https://teglionapp.onrender.com').replace(/\/+$/, '');
const FE_BASE = String(process.env.FE_BASE || 'https://www.teglion.com').replace(/\/+$/, '');

const results = [];
let failed = 0;

function pass(name, detail = '') {
  results.push({ name, ok: true, detail });
  console.log(`✅ ${name}${detail ? ` — ${detail}` : ''}`);
}

function fail(name, detail = '') {
  results.push({ name, ok: false, detail });
  console.error(`❌ ${name}${detail ? ` — ${detail}` : ''}`);
  failed += 1;
}

async function check(name, fn) {
  try {
    const detail = await fn();
    pass(name, typeof detail === 'string' ? detail : '');
  } catch (err) {
    fail(name, err?.response?.data?.message || err?.message || String(err));
  }
}

async function httpGet(url, opts = {}) {
  const res = await axios.get(url, {
    timeout: 25000,
    validateStatus: () => true,
    maxRedirects: 5,
    ...opts,
  });
  return res;
}

async function main() {
  console.log('\n=== Teglion Production Smoke Manual ===\n');
  console.log(`API_BASE=${API_BASE}`);
  console.log(`FE_BASE=${FE_BASE}\n`);

  await check('API /api/public/health', async () => {
    const res = await httpGet(`${API_BASE}/api/public/health`);
    if (res.status !== 200 || !res.data?.ok) throw new Error(`status=${res.status} body=${JSON.stringify(res.data)}`);
    return res.data.service || 'ok';
  });

  await check('API /api/public/countries', async () => {
    const res = await httpGet(`${API_BASE}/api/public/countries`);
    if (res.status !== 200 || !Array.isArray(res.data?.countries)) throw new Error(`status=${res.status}`);
    return `${res.data.countries.length} países`;
  });

  const fePages = [
    ['/', 'landing'],
    ['/pricing', 'pricing'],
    ['/auth/firm/login', 'login firm'],
    ['/auth/client/login', 'login client'],
    ['/recover-password', 'recover'],
    ['/reset-password', 'reset shell'],
  ];
  for (const [path, label] of fePages) {
    await check(`FE ${label} (${path})`, async () => {
      const res = await httpGet(`${FE_BASE}${path}`);
      if (res.status >= 400) throw new Error(`HTTP ${res.status}`);
      return `HTTP ${res.status}`;
    });
  }

  await check('Config Brevo (EMAIL_ENABLED)', async () => {
    if (!env.EMAIL_ENABLED) throw new Error('BREVO_API_KEY ausente');
    return 'activo';
  });

  await check('Config Sentry DSN', async () => {
    if (!env.SENTRY_DSN) throw new Error('SENTRY_DSN ausente');
    return 'configurado';
  });

  await check('Redis Upstash (init + PING)', async () => {
    const ok = await initRateLimitRedis();
    if (!ok) throw new Error('initRateLimitRedis falhou');
    const client = getSharedRedisClient();
    if (!client) throw new Error('cliente Redis null');
    const pong = await client.ping();
    if (pong !== 'PONG') throw new Error(`ping=${pong}`);
    return 'store partilhado activo';
  });

  await check('Supabase + owner firm', async () => {
    if (!isSupabaseConfigured()) throw new Error('Supabase não configurado');
    const sb = getSupabaseAdmin();
    const { data, error } = await sb
      .from('firm_users')
      .select('id, firm_id, email, role, is_active, permissions_override')
      .eq('role', 'FIRM_OWNER')
      .eq('is_active', true)
      .order('created_at', { ascending: true })
      .limit(1)
      .maybeSingle();
    if (error) throw error;
    if (!data) throw new Error('nenhum FIRM_OWNER activo');
    global.__smokeOwner = data;
    return `owner=${data.email} firm=${data.firm_id}`;
  });

  await check('Settings bundle canManageTeam (owner)', async () => {
    const owner = global.__smokeOwner;
    const bundle = await firmSettingsService.getSettingsBundle(owner.firm_id, owner.id);
    if (!bundle?.capabilities?.canManageTeam) throw new Error('canManageTeam=false para owner');
    return 'canManageTeam=true';
  });

  await check('Listagem equipa (service layer + BD prod)', async () => {
    const owner = global.__smokeOwner;
    const items = await teamService.listMembers(owner.firm_id);
    if (!Array.isArray(items)) throw new Error('lista inválida');
    global.__smokeFirmId = owner.firm_id;
    global.__smokeActor = { id: owner.id, role: owner.role, firmId: owner.firm_id, email: owner.email };
    return `${items.length} membros`;
  });

  await check('API autenticada /team (cookie-only em prod)', async () => {
    const owner = global.__smokeOwner;
    const row = await firmUsersRepository.findFirmUserById(owner.id);
    const role = firmUsersRepository.jwtRoleFromFirmRole(row.role);
    const user = {
      id: row.id,
      role,
      firmId: row.firm_id,
      permissions: Array.isArray(row.permissions_override) ? row.permissions_override : undefined,
      masterAccess: row.role === 'FIRM_OWNER',
    };
    const token = signAccessToken(user);
    const res = await axios.get(`${API_BASE}/api/contabil/team`, {
      timeout: 25000,
      headers: {
        Authorization: `Bearer ${token}`,
        Origin: FE_BASE,
      },
      validateStatus: () => true,
    });
    // Produção exige cookie; Bearer sem ALLOW_BEARER_AUTH → 401 esperado
    if (res.status === 401 && (res.data?.code === 'BEARER_NOT_ALLOWED' || /cookie/i.test(String(res.data?.message || '')))) {
      return 'cookie-only OK (Bearer bloqueado como esperado)';
    }
    if (res.status === 200) return `HTTP 200 (${(res.data?.items || []).length} membros)`;
    throw new Error(`HTTP ${res.status} ${JSON.stringify(res.data)}`);
  });

  await check('Criar colaborador DIRECT (sem welcome email) + desactivar', async () => {
    const firmId = global.__smokeFirmId;
    const actor = global.__smokeActor;
    const stamp = Date.now().toString(36);
    const email = `smoke.teglion.${stamp}@teglion.com`;
    const created = await teamService.createMember({
      firmId,
      actor,
      payload: {
        fullName: `Smoke Test ${stamp}`,
        email,
        password: 'SmokeTest9aZ!',
        creationMode: 'DIRECT',
        sendWelcomeEmail: false,
        jobTitle: 'Smoke QA',
      },
      req: { headers: {}, ip: '127.0.0.1' },
    });
    if (!created?.id) throw new Error('createMember sem id');
    if (created.welcomeEmailSent === true) throw new Error('welcomeEmailSent deveria ser false');

    const deactivated = await teamService.deactivateMember({
      firmId,
      memberId: created.id,
      actor,
      req: { headers: {}, ip: '127.0.0.1' },
    });
    if (deactivated?.isActive !== false && deactivated?.is_active !== false) {
      // map may use isActive
      const member = await teamService.getMember(firmId, created.id);
      if (member.isActive !== false) throw new Error('membro não ficou inactivo');
    }
    return `criado+desactivado ${email}`;
  });

  await check('Auth recover endpoint (contrato soft-success)', async () => {
    const res = await axios.post(
      `${API_BASE}/api/auth/recover`,
      { email: 'smoke-nonexistent@teglion.com', role: 'firm' },
      {
        timeout: 25000,
        headers: { 'Content-Type': 'application/json', Origin: FE_BASE },
        validateStatus: () => true,
      },
    );
    // 200 soft-success, ou 403 CSRF em alguns setups — ambos informativos
    if (![200, 403].includes(res.status)) {
      throw new Error(`HTTP ${res.status} ${JSON.stringify(res.data)}`);
    }
    return `HTTP ${res.status}`;
  });

  await closeRateLimitRedis().catch(() => {});

  console.log('\n--- Relatório ---');
  console.log(`Passou: ${results.filter((r) => r.ok).length}`);
  console.log(`Falhou: ${failed}`);
  if (failed) {
    console.log('\nFalhas:');
    results.filter((r) => !r.ok).forEach((r) => console.log(`  - ${r.name}: ${r.detail}`));
    process.exit(1);
  }
  console.log('\n✅ Smoke produção APROVADO.\n');
  console.log('Nota: entrega real de e-mail Brevo (welcome/reset) não é validada na inbox aqui.');
  console.log('Valida manualmente 1 e-mail de recover/welcome no Brevo dashboard se necessário.\n');
}

main().catch(async (err) => {
  console.error('Smoke crash:', err);
  await closeRateLimitRedis().catch(() => {});
  process.exit(1);
});
