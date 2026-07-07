const { AppError } = require('../../middlewares/error.middleware');

function digitsOnly(value) {
  return String(value || '').replace(/\D/g, '');
}

function formatPtPostal(digits) {
  if (digits.length <= 4) return digits;
  return `${digits.slice(0, 4)}-${digits.slice(4, 7)}`;
}

async function lookupPt(postalCode) {
  const digits = digitsOnly(postalCode);
  if (digits.length !== 7) {
    throw new AppError('Código postal inválido', 400);
  }
  const cp = formatPtPostal(digits);
  const url = `https://json.geoapi.pt/cp/${encodeURIComponent(cp)}`;
  const res = await fetch(url, { headers: { Accept: 'application/json' } });
  if (!res.ok) {
    throw new AppError('Código postal não encontrado', 404);
  }
  const data = await res.json();
  const row = Array.isArray(data) ? data[0] : data;
  if (!row) throw new AppError('Código postal não encontrado', 404);

  return {
    postalCode: row.CP || cp,
    street: row.Morada || row.morada || row.rua || '',
    district: row.Distrito || row.distrito || '',
    municipality: row.Concelho || row.concelho || row.Localidade || row.localidade || '',
    parish: row.Freguesia || row.freguesia || row.Localidade || '',
    city: row.Localidade || row.localidade || row.Concelho || '',
    state: row.Distrito || row.distrito || '',
  };
}

async function lookupBr(postalCode) {
  const digits = digitsOnly(postalCode);
  if (digits.length !== 8) {
    throw new AppError('CEP inválido', 400);
  }
  const url = `https://viacep.com.br/ws/${digits}/json/`;
  const res = await fetch(url, { headers: { Accept: 'application/json' } });
  if (!res.ok) throw new AppError('CEP não encontrado', 404);
  const data = await res.json();
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

module.exports = { lookupPostalAddress };
