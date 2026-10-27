/**
 * Denylist de IPs — fonte de verdade em Postgres; cache em memória para o middleware.
 * Cloudflare edge sync fica documentado; bloqueio efectivo nesta onda = middleware API (Render).
 */
const net = require('net');
const { AppError } = require('../../middlewares/error.middleware');
const { getSupabaseAdmin, isSupabaseConfigured } = require('../../db/supabase/client');
const auditRepository = require('../../db/supabase/repositories/contabil/audit.repository');
const { logger } = require('../../utils/logger');

const CACHE_TTL_MS = 30_000;
const MAX_REASON = 280;

/** @type {Set<string>} */
let activeSet = new Set();
let loadedAt = 0;
let loadPromise = null;

function normalizeIp(ip) {
  let s = String(ip || '').trim();
  if (!s) return null;
  if (s.startsWith('::ffff:')) s = s.slice(7);
  return s;
}

function isPrivateOrLocal(ip) {
  const s = normalizeIp(ip);
  if (!s) return true;
  if (s === '::1' || s === '127.0.0.1') return true;
  if (net.isIPv4(s)) {
    const parts = s.split('.').map(Number);
    if (parts[0] === 10) return true;
    if (parts[0] === 127) return true;
    if (parts[0] === 0) return true;
    if (parts[0] === 169 && parts[1] === 254) return true;
    if (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) return true;
    if (parts[0] === 192 && parts[1] === 168) return true;
    return false;
  }
  if (net.isIPv6(s)) {
    const lower = s.toLowerCase();
    if (lower === '::' || lower === '::1') return true;
    if (lower.startsWith('fc') || lower.startsWith('fd')) return true;
    if (lower.startsWith('fe80')) return true;
    return false;
  }
  return true;
}

function assertPublicIp(ip) {
  const normalized = normalizeIp(ip);
  if (!normalized || (!net.isIPv4(normalized) && !net.isIPv6(normalized))) {
    throw new AppError('IP inválido', 400, { code: 'VALIDATION_ERROR' });
  }
  if (isPrivateOrLocal(normalized)) {
    throw new AppError('Não é permitido denylist de IPs privados/locais', 400, {
      code: 'IP_DENYLIST_PRIVATE',
    });
  }
  return normalized;
}

async function refreshCache({ force = false } = {}) {
  if (!isSupabaseConfigured()) {
    activeSet = new Set();
    loadedAt = Date.now();
    return activeSet;
  }
  if (!force && Date.now() - loadedAt < CACHE_TTL_MS && loadedAt > 0) {
    return activeSet;
  }
  if (loadPromise) return loadPromise;

  loadPromise = (async () => {
    try {
      const sb = getSupabaseAdmin();
      const { data, error } = await sb
        .from('ip_denylist')
        .select('ip')
        .is('revoked_at', null)
        .limit(5000);
      if (error) throw error;
      activeSet = new Set((data || []).map((r) => normalizeIp(r.ip)).filter(Boolean));
      loadedAt = Date.now();
      return activeSet;
    } catch (err) {
      logger.warn('[ip-denylist] refresh falhou (fail-open)', {
        message: String(err?.message || err).slice(0, 120),
      });
      // Mantém cache anterior se existir; senão set vazio.
      if (!loadedAt) {
        activeSet = new Set();
        loadedAt = Date.now();
      }
      return activeSet;
    } finally {
      loadPromise = null;
    }
  })();

  return loadPromise;
}

async function isDenied(ip) {
  const normalized = normalizeIp(ip);
  if (!normalized || isPrivateOrLocal(normalized)) return false;
  const set = await refreshCache();
  return set.has(normalized);
}

async function listDenylist({ limit = 100, offset = 0, includeRevoked = false } = {}) {
  if (!isSupabaseConfigured()) {
    throw new AppError('Base de dados indisponível', 503);
  }
  const sb = getSupabaseAdmin();
  const safeLimit = Math.min(Math.max(Number(limit) || 100, 1), 200);
  const safeOffset = Math.max(Number(offset) || 0, 0);
  let query = sb
    .from('ip_denylist')
    .select('id, ip, reason, created_at, created_by, revoked_at, revoked_by', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(safeOffset, safeOffset + safeLimit - 1);
  if (!includeRevoked) {
    query = query.is('revoked_at', null);
  }
  const { data, error, count } = await query;
  if (error) throw error;
  return {
    items: (data || []).map((row) => ({
      id: row.id,
      ip: row.ip,
      reason: row.reason || null,
      createdAt: row.created_at,
      createdBy: row.created_by || null,
      revokedAt: row.revoked_at || null,
      revokedBy: row.revoked_by || null,
      active: !row.revoked_at,
    })),
    total: count ?? null,
  };
}

async function addIp(ip, { reason, actorId, actorIp } = {}) {
  const normalized = assertPublicIp(ip);
  if (!isSupabaseConfigured()) {
    throw new AppError('Base de dados indisponível', 503);
  }
  const sb = getSupabaseAdmin();
  const { data: existing } = await sb
    .from('ip_denylist')
    .select('id')
    .eq('ip', normalized)
    .is('revoked_at', null)
    .maybeSingle();
  if (existing) {
    return { id: existing.id, ip: normalized, already: true };
  }

  const { data, error } = await sb
    .from('ip_denylist')
    .insert({
      ip: normalized,
      reason: reason ? String(reason).trim().slice(0, MAX_REASON) : null,
      created_by: actorId || null,
    })
    .select('id, ip, reason, created_at')
    .single();
  if (error) throw error;

  await refreshCache({ force: true });
  await auditRepository.writeAuditLog({
    firmId: null,
    actorRole: 'PLATFORM_OPS',
    actorId: actorId || null,
    action: 'platform_ops.ip_denylist.add',
    entityType: 'ip_denylist',
    entityId: data.id,
    metadata: { ip: normalized, reason: data.reason },
    ipAddress: actorIp || null,
  });

  return { id: data.id, ip: data.ip, reason: data.reason, already: false };
}

async function revokeIp(ipOrId, { actorId, actorIp } = {}) {
  if (!isSupabaseConfigured()) {
    throw new AppError('Base de dados indisponível', 503);
  }
  const sb = getSupabaseAdmin();
  const raw = String(ipOrId || '').trim();
  if (!raw) throw new AppError('IP ou id em falta', 400, { code: 'VALIDATION_ERROR' });

  let query = sb.from('ip_denylist').select('id, ip').is('revoked_at', null);
  if (/^[0-9a-f-]{36}$/i.test(raw)) {
    query = query.eq('id', raw);
  } else {
    query = query.eq('ip', assertPublicIp(raw));
  }
  const { data: row, error: findErr } = await query.maybeSingle();
  if (findErr) throw findErr;
  if (!row) throw new AppError('IP não está na denylist activa', 404, { code: 'NOT_FOUND' });

  const { error } = await sb
    .from('ip_denylist')
    .update({
      revoked_at: new Date().toISOString(),
      revoked_by: actorId || null,
    })
    .eq('id', row.id);
  if (error) throw error;

  await refreshCache({ force: true });
  await auditRepository.writeAuditLog({
    firmId: null,
    actorRole: 'PLATFORM_OPS',
    actorId: actorId || null,
    action: 'platform_ops.ip_denylist.revoke',
    entityType: 'ip_denylist',
    entityId: row.id,
    metadata: { ip: row.ip },
    ipAddress: actorIp || null,
  });

  return { id: row.id, ip: row.ip, revoked: true };
}

async function activeCount() {
  const set = await refreshCache();
  return set.size;
}

module.exports = {
  normalizeIp,
  isPrivateOrLocal,
  assertPublicIp,
  refreshCache,
  isDenied,
  listDenylist,
  addIp,
  revokeIp,
  activeCount,
};
