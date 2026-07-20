const dns = require('node:dns');
const { AppError } = require('../../middlewares/error.middleware');

/** Prefer IPv4 — Render/AWS often cannot reach Contabo IPv6 (geoapi.pt). */
try {
  dns.setDefaultResultOrder('ipv4first');
} catch {
  // ignore on older runtimes
}

const FETCH_TIMEOUT_MS = 5000;
const USER_AGENT = 'TeglionApp/2.0 (postal-lookup)';

function digitsOnly(value) {
  return String(value || '').replace(/\D/g, '');
}

function formatPtPostal(digits) {
  if (digits.length <= 4) return digits;
  return `${digits.slice(0, 4)}-${digits.slice(4, 7)}`;
}

function isAbortError(err) {
  return err?.name === 'AbortError' || err?.code === 'ABORT_ERR';
}

function isNetworkError(err) {
  if (!err || err instanceof AppError) return false;
  if (isAbortError(err)) return true;
  const msg = String(err.message || err.cause?.message || '');
  return (
    err.name === 'TypeError' ||
    err.name === 'ConnectTimeoutError' ||
    err.code === 'ENETUNREACH' ||
    err.code === 'ECONNREFUSED' ||
    err.code === 'ETIMEDOUT' ||
    err.code === 'ECONNRESET' ||
    /fetch failed|connect timeout|ENETUNREACH|ETIMEDOUT/i.test(msg)
  );
}

async function fetchJson(url) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        'User-Agent': USER_AGENT,
      },
      signal: controller.signal,
    });
    if (!res.ok) {
      const err = new Error(`HTTP ${res.status}`);
      err.status = res.status;
      throw err;
    }
    return await res.json();
  } finally {
    clearTimeout(timer);
  }
}

function pickMostCommonStreet(pontos) {
  if (!Array.isArray(pontos) || pontos.length === 0) return '';
  const counts = new Map();
  for (const p of pontos) {
    const rua = String(p?.rua || '').trim();
    if (!rua) continue;
    counts.set(rua, (counts.get(rua) || 0) + 1);
  }
  let best = '';
  let bestCount = 0;
  for (const [rua, count] of counts) {
    if (count > bestCount) {
      best = rua;
      bestCount = count;
    }
  }
  return best;
}

function pickStreetFromGeoApi(row) {
  const direct = String(row.Morada || row.morada || row.rua || '').trim();
  if (direct) return direct;

  const fromPontos = pickMostCommonStreet(row.pontos);
  if (fromPontos) return fromPontos;

  const partes = Array.isArray(row.partes) ? row.partes : [];
  for (const p of partes) {
    const art = String(p?.Artéria || p?.Arteria || p?.['Artéria'] || '').trim();
    if (art) return art;
  }
  return '';
}

function mapGeoApiRow(row, fallbackCp) {
  return {
    postalCode: row.CP || fallbackCp,
    street: pickStreetFromGeoApi(row),
    district: row.Distrito || row.distrito || '',
    municipality: row.Concelho || row.concelho || row.Localidade || row.localidade || '',
    parish: row.Freguesia || row.freguesia || row.Localidade || '',
    city: row.Localidade || row.localidade || row.Concelho || '',
    state: row.Distrito || row.distrito || '',
  };
}

function formatStreetFromParts(street) {
  if (!street || typeof street !== 'object') return String(street || '').trim();
  const type = String(street.type || '').trim();
  const name = String(street.name || '').trim();
  return [type, name].filter(Boolean).join(' ').trim();
}

function mapPostcodePtRow(row, fallbackCp) {
  return {
    postalCode: row.code || fallbackCp,
    street: formatStreetFromParts(row.street),
    district: row.district?.name || '',
    municipality: row.municipality?.name || row.locality?.name || '',
    parish: row.locality?.name || '',
    city: row.locality?.name || row.municipality?.name || row.designation || '',
    state: row.district?.name || '',
  };
}

async function lookupPtGeoApi(cp) {
  const url = `https://json.geoapi.pt/cp/${encodeURIComponent(cp)}`;
  const data = await fetchJson(url);
  const row = Array.isArray(data) ? data[0] : data;
  if (!row) throw new AppError('Código postal não encontrado', 404);
  return mapGeoApiRow(row, cp);
}

async function lookupPtPostcodePt(cp) {
  const url = `https://postcode-pt.onrender.com/v1/postal-codes/${encodeURIComponent(cp)}`;
  try {
    const data = await fetchJson(url);
    const rows = Array.isArray(data) ? data : data ? [data] : [];
    if (rows.length === 0) throw new AppError('Código postal não encontrado', 404);
    const withStreet = rows.find((r) => formatStreetFromParts(r.street));
    return mapPostcodePtRow(withStreet || rows[0], cp);
  } catch (err) {
    if (err instanceof AppError) throw err;
    if (err?.status === 404) throw new AppError('Código postal não encontrado', 404);
    throw err;
  }
}

function unavailableError() {
  return new AppError(
    'Não foi possível localizar o endereço. Preencha manualmente.',
    503,
    undefined,
    'POSTAL_LOOKUP_UNAVAILABLE',
  );
}

async function lookupPt(postalCode) {
  const digits = digitsOnly(postalCode);
  if (digits.length !== 7) {
    throw new AppError('Código postal inválido', 400);
  }
  const cp = formatPtPostal(digits);

  let primaryNotFound = false;
  try {
    return await lookupPtGeoApi(cp);
  } catch (err) {
    if (err instanceof AppError && err.statusCode === 400) throw err;
    if (err instanceof AppError && err.statusCode === 404) {
      primaryNotFound = true;
    } else if (err?.status === 404) {
      primaryNotFound = true;
    } else if (!isNetworkError(err) && !(err instanceof AppError) && err?.status && err.status < 500) {
      primaryNotFound = err.status === 404;
    }
    // continue to fallback
  }

  try {
    return await lookupPtPostcodePt(cp);
  } catch (err) {
    if (err instanceof AppError && err.statusCode === 404) {
      throw err;
    }
    if (primaryNotFound) {
      throw new AppError('Código postal não encontrado', 404);
    }
    if (err instanceof AppError) throw err;
    throw unavailableError();
  }
}

async function lookupBr(postalCode) {
  const digits = digitsOnly(postalCode);
  if (digits.length !== 8) {
    throw new AppError('CEP inválido', 400);
  }
  const url = `https://viacep.com.br/ws/${digits}/json/`;
  try {
    const data = await fetchJson(url);
    if (data?.erro) throw new AppError('CEP não encontrado', 404);
    return {
      postalCode: data.cep || digits,
      street: data.logradouro || '',
      district: data.bairro || '',
      municipality: data.localidade || '',
      parish: data.bairro || '',
      city: data.localidade || '',
      state: data.uf || '',
    };
  } catch (err) {
    if (err instanceof AppError) throw err;
    if (err?.status === 404) throw new AppError('CEP não encontrado', 404);
    if (isNetworkError(err)) throw unavailableError();
    throw unavailableError();
  }
}

async function lookupPostalAddress({ country, postalCode }) {
  const c = String(country || 'PT').toUpperCase();
  const raw = await (c === 'BR' ? lookupBr(postalCode) : lookupPt(postalCode));

  return {
    address: {
      postalCode: raw.postalCode,
      street: raw.street,
      district: raw.district,
      municipality: raw.municipality || raw.city,
      parish: raw.parish,
      state: raw.state,
      city: raw.city || raw.municipality,
    },
  };
}

module.exports = {
  lookupPostalAddress,
  // exported for unit tests
  _test: {
    formatPtPostal,
    digitsOnly,
    pickStreetFromGeoApi,
    mapGeoApiRow,
    mapPostcodePtRow,
    isNetworkError,
    FETCH_TIMEOUT_MS,
  },
};
