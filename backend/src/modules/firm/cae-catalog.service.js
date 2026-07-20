/**
 * Catálogo CAE-Rev.3 (classes, 4 dígitos) — fonte INE autocomplete prefetch.
 * Pesquisa local (rápida/fiável) + enriquecimento opcional na API live do INE.
 * @see https://www.ine.pt/xportal/xmain?xpid=INE&xpgid=ine_api
 */

const dns = require('node:dns');
const catalogRaw = require('../../data/cae-rev3-classes.json');

try {
  dns.setDefaultResultOrder('ipv4first');
} catch {
  // ignore
}

const INE_SEARCH_URL = 'https://apife.ine.pt/dic/CAEREV3/';
const INE_TIMEOUT_MS = 2500;
const MAX_RESULTS = 25;
const LIVE_CACHE_TTL_MS = 10 * 60 * 1000;
const liveCache = new Map();

function stripDiacritics(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

function normalizeQuery(value) {
  return stripDiacritics(value)
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ');
}

function digitsOnly(value) {
  return String(value || '').replace(/\D/g, '');
}

function formatItem(code, label) {
  const c = String(code || '').trim();
  const d = String(label || '').trim();
  if (!c) return null;
  return {
    code: c,
    label: d,
    value: d ? `${c} — ${d}` : c,
  };
}

const CATALOG = (Array.isArray(catalogRaw) ? catalogRaw : [])
  .map((row) => {
    const item = formatItem(row.code, row.label);
    if (!item) return null;
    const tokens = normalizeQuery(row.tokens || '');
    return {
      ...item,
      labelNorm: normalizeQuery(item.label),
      tokens,
      searchText: normalizeQuery(`${item.code} ${item.label} ${tokens}`),
    };
  })
  .filter(Boolean);

function scoreLocal(item, q, qDigits) {
  const code = item.code;
  const labelNorm = item.labelNorm || '';
  const tokens = item.tokens || '';
  const mostlyDigits = qDigits.length > 0 && qDigits.length >= Math.max(1, q.replace(/[\s.—-]/g, '').length - 1);

  if (qDigits) {
    if (code === qDigits) return 100;
    if (code.startsWith(qDigits)) return 90 - Math.min(code.length - qDigits.length, 20);
    if (qDigits.startsWith(code)) return 85;
  }

  // Queries that are essentially a CAE code should not match arbitrary label substrings
  // (e.g. "620" inside "1620 …").
  if (mostlyDigits) return 0;

  if (!q) return 0;
  if (labelNorm.startsWith(q)) return 70;
  if (labelNorm.includes(` ${q}`) || labelNorm.includes(q)) return 60;
  // INE tokens: whole-word / prefix (padaria → panificação)
  if (tokens.split(' ').some((t) => t === q || t.startsWith(q))) return 55;
  if (tokens.includes(q)) return 40;
  return 0;
}

function searchLocal(query, { limit = MAX_RESULTS } = {}) {
  const q = normalizeQuery(query);
  const qDigits = digitsOnly(q);
  if (!q && !qDigits) return [];

  const scored = [];
  for (const item of CATALOG) {
    const score = scoreLocal(item, q, qDigits);
    if (score > 0) scored.push({ score, item });
  }
  scored.sort((a, b) => b.score - a.score || a.item.code.localeCompare(b.item.code));
  return scored.slice(0, limit).map((row) => ({
    code: row.item.code,
    label: row.item.label,
    value: row.item.value,
    source: 'catalog',
  }));
}

function getLiveCache(key) {
  const hit = liveCache.get(key);
  if (!hit) return null;
  if (Date.now() > hit.expiresAt) {
    liveCache.delete(key);
    return null;
  }
  return hit.items;
}

function setLiveCache(key, items) {
  liveCache.set(key, { items, expiresAt: Date.now() + LIVE_CACHE_TTL_MS });
}

async function searchIneLive(query) {
  const q = String(query || '').trim();
  if (q.length < 2) return [];

  const cacheKey = normalizeQuery(q);
  const cached = getLiveCache(cacheKey);
  if (cached) return cached;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), INE_TIMEOUT_MS);
  try {
    const url = `${INE_SEARCH_URL}?q=${encodeURIComponent(q)}`;
    const res = await fetch(url, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        'User-Agent': 'TeglionApp/2.0 (cae-catalog)',
      },
      signal: controller.signal,
    });
    if (!res.ok) return [];
    const data = await res.json();
    if (!Array.isArray(data)) return [];
    const items = data
      .map((row) => formatItem(row?.c, row?.d))
      .filter(Boolean)
      .map((item) => ({ ...item, source: 'ine' }));
    setLiveCache(cacheKey, items);
    return items;
  } catch {
    return [];
  } finally {
    clearTimeout(timer);
  }
}

function mergeResults(primary, secondary, limit = MAX_RESULTS) {
  const seen = new Set();
  const out = [];
  for (const list of [primary, secondary]) {
    for (const item of list || []) {
      const key = String(item.code || item.value || '').toLowerCase();
      if (!key || seen.has(key)) continue;
      seen.add(key);
      out.push(item);
      if (out.length >= limit) return out;
    }
  }
  return out;
}

/**
 * Pesquisa CAE: catálogo local primeiro; enriquece com INE quando possível.
 */
async function searchCae(query, { limit = MAX_RESULTS, live = true } = {}) {
  const q = String(query || '').trim();
  if (!q) return { items: [], source: 'empty' };

  const local = searchLocal(q, { limit });
  if (!live) return { items: local, source: 'catalog' };

  // Live ajuda sobretudo em texto livre; dígitos já cobertos pelo catálogo.
  const qDigits = digitsOnly(q);
  const wantsLive = q.length >= 2 && (qDigits.length < q.replace(/\s|—|-/g, '').length || local.length < 8);
  if (!wantsLive) return { items: local, source: 'catalog' };

  const remote = await searchIneLive(q);
  const items = mergeResults(local, remote, limit);
  return {
    items,
    source: remote.length ? 'catalog+ine' : 'catalog',
  };
}

function catalogSize() {
  return CATALOG.length;
}

module.exports = {
  searchCae,
  searchLocal,
  catalogSize,
  _test: {
    normalizeQuery,
    digitsOnly,
    formatItem,
    scoreLocal,
    mergeResults,
    CATALOG,
    MAX_RESULTS,
  },
};
