require('../../test/ensure-test-env');

const { test } = require('node:test');
const assert = require('node:assert/strict');

const { lookupPostalAddress, _test } = require('./postal-lookup.service');
const { AppError } = require('../../middlewares/error.middleware');

test('formatPtPostal formata 7 dígitos', () => {
  assert.equal(_test.formatPtPostal('3090492'), '3090-492');
  assert.equal(_test.formatPtPostal('1000'), '1000');
});

test('pickStreetFromGeoApi usa Morada quando existe', () => {
  assert.equal(_test.pickStreetFromGeoApi({ Morada: 'Rua A' }), 'Rua A');
});

test('pickStreetFromGeoApi escolhe rua mais comum em pontos', () => {
  const street = _test.pickStreetFromGeoApi({
    pontos: [
      { rua: 'R MEIO' },
      { rua: 'R CABECO' },
      { rua: 'R CABECO' },
      { rua: 'R CABECO' },
    ],
  });
  assert.equal(street, 'R CABECO');
});

test('mapPostcodePtRow mapeia locality/municipality/district', () => {
  const mapped = _test.mapPostcodePtRow(
    {
      code: '3090-492',
      designation: 'PAIÃO',
      street: { type: null, name: null },
      locality: { name: 'Casal Novo' },
      municipality: { name: 'Figueira da Foz' },
      district: { name: 'Coimbra' },
    },
    '3090-492',
  );
  assert.equal(mapped.city, 'Casal Novo');
  assert.equal(mapped.municipality, 'Figueira da Foz');
  assert.equal(mapped.state, 'Coimbra');
  assert.equal(mapped.street, '');
});

test('lookupPostalAddress PT — inválido', async () => {
  await assert.rejects(
    () => lookupPostalAddress({ country: 'PT', postalCode: '123' }),
    (err) => err instanceof AppError && err.statusCode === 400,
  );
});

test('lookupPostalAddress PT — fallback quando geoapi falha de rede', async (t) => {
  const originalFetch = global.fetch;
  t.after(() => {
    global.fetch = originalFetch;
  });

  global.fetch = async (url) => {
    if (String(url).includes('geoapi.pt')) {
      const err = new TypeError('fetch failed');
      err.cause = new Error('Connect Timeout Error');
      throw err;
    }
    if (String(url).includes('postcode-pt')) {
      return {
        ok: true,
        json: async () => [
          {
            code: '3090-492',
            designation: 'PAIÃO',
            street: { type: 'Rua', name: 'do Meio' },
            locality: { name: 'Casal Novo' },
            municipality: { name: 'Figueira da Foz' },
            district: { name: 'Coimbra' },
          },
        ],
      };
    }
    throw new Error(`unexpected url: ${url}`);
  };

  const result = await lookupPostalAddress({ country: 'PT', postalCode: '3090-492' });
  assert.equal(result.address.city, 'Casal Novo');
  assert.equal(result.address.municipality, 'Figueira da Foz');
  assert.equal(result.address.street, 'Rua do Meio');
  assert.equal(result.address.state, 'Coimbra');
});

test('lookupPostalAddress PT — 503 quando ambos os providers falham', async (t) => {
  const originalFetch = global.fetch;
  t.after(() => {
    global.fetch = originalFetch;
  });

  global.fetch = async () => {
    const err = new TypeError('fetch failed');
    err.cause = new Error('Connect Timeout Error');
    throw err;
  };

  await assert.rejects(
    () => lookupPostalAddress({ country: 'PT', postalCode: '3090-492' }),
    (err) =>
      err instanceof AppError &&
      err.statusCode === 503 &&
      err.code === 'POSTAL_LOOKUP_UNAVAILABLE',
  );
});

test('isNetworkError detecta timeouts e ENETUNREACH', () => {
  assert.equal(_test.isNetworkError(new TypeError('fetch failed')), true);
  const abort = new Error('aborted');
  abort.name = 'AbortError';
  assert.equal(_test.isNetworkError(abort), true);
  assert.equal(_test.isNetworkError(new AppError('x', 404)), false);
});
