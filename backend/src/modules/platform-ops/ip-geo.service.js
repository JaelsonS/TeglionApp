/**
 * Lookup de país por IP (server-side) com cache Postgres.
 * Provider: ipapi.co JSON (sem key, rate-limit; falha aberta → null).
 */
const { getSupabaseAdmin, isSupabaseConfigured } = require('../../db/supabase/client');
const { logger } = require('../../utils/logger');

const CACHE_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 dias
const LOOKUP_TIMEOUT_MS = 2500;

function normalizeIp(ip) {
  let s = String(ip || '').trim();
  if (!s) return null;
  if (s.startsWith('::ffff:')) s = s.slice(7);
  if (s === '::1' || s === '127.0.0.1') return null;
  return s;
}

async function readCache(ip) {
  if (!isSupabaseConfigured()) return null;
  const sb = getSupabaseAdmin();
  const { data, error } = await sb.from('ip_geo_cache').select('*').eq('ip', ip).maybeSingle();
  if (error || !data) return null;
  const age = Date.now() - new Date(data.updated_at).getTime();
  if (Number.isNaN(age) || age > CACHE_TTL_MS) return null;
  return {
    ip,
    countryCode: data.country_code || null,
    countryName: data.country_name || null,
  };
}

async function writeCache(ip, countryCode, countryName) {
  if (!isSupabaseConfigured()) return;
  const sb = getSupabaseAdmin();
  await sb.from('ip_geo_cache').upsert(
    {
      ip,
      country_code: countryCode,
      country_name: countryName,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'ip' },
  );
}

async function lookupRemote(ip) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), LOOKUP_TIMEOUT_MS);
  try {
    const res = await fetch(`https://ipapi.co/${encodeURIComponent(ip)}/json/`, {
      signal: controller.signal,
      headers: { Accept: 'application/json' },
    });
    if (!res.ok) return null;
    const json = await res.json();
    if (json?.error) return null;
    const code = String(json.country_code || '').trim().toUpperCase() || null;
    const name = String(json.country_name || '').trim() || null;
    if (!code && !name) return null;
    return { countryCode: code, countryName: name };
  } catch (err) {
    logger.warn('[ip-geo] lookup falhou', { message: String(err?.message || err).slice(0, 120) });
    return null;
  } finally {
    clearTimeout(timer);
  }
}

async function resolveIpGeo(ip) {
  const normalized = normalizeIp(ip);
  if (!normalized) return { ip: null, countryCode: null, countryName: null };

  const cached = await readCache(normalized);
  if (cached) return cached;

  const remote = await lookupRemote(normalized);
  if (remote) {
    try {
      await writeCache(normalized, remote.countryCode, remote.countryName);
    } catch {
      /* cache best-effort */
    }
    return { ip: normalized, ...remote };
  }

  return { ip: normalized, countryCode: null, countryName: null };
}

async function resolveIpGeoMany(ips) {
  const unique = [...new Set((ips || []).map(normalizeIp).filter(Boolean))];
  const out = new Map();
  await Promise.all(
    unique.map(async (ip) => {
      out.set(ip, await resolveIpGeo(ip));
    }),
  );
  return out;
}

module.exports = {
  normalizeIp,
  resolveIpGeo,
  resolveIpGeoMany,
};
