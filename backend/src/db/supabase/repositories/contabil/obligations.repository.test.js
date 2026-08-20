const test = require('node:test');
const assert = require('node:assert/strict');

require('../../../../test/ensure-test-env');
const ttlCache = require('../../../../utils/cache/ttl-cache');
const { todayInTimezone } = require('../../../../utils/firm-timezone');
const { maybeSyncOverdueObligations } = require('./obligations.repository');

function stubModule(relativePath, exports) {
  const resolved = require.resolve(relativePath, { paths: [__dirname] });
  require.cache[resolved] = { id: resolved, filename: resolved, loaded: true, exports };
  return resolved;
}

// Regressão do ROADMAP item 0.3: syncOverdueObligations calculava "hoje" sempre em UTC
// (new Date().toISOString().slice(0, 10)), ignorando o fuso do escritório. Este teste prova
// que ela agora consulta firms.settings.booking.timezone e usa esse fuso pra decidir a data
// de corte — usando Atlantic/Azores (UTC-1 fixo, sem DST) pra ficar determinístico o ano
// inteiro, em vez de depender de estarmos ou não em horário de verão europeu no momento do
// teste.
test('syncOverdueObligations usa o fuso do escritório (settings.booking.timezone), não UTC fixo', async () => {
  const calls = { fromArgs: [], ltValue: null };

  function fakeFrom(table) {
    if (table === 'firms') {
      return {
        select() {
          return this;
        },
        eq() {
          return this;
        },
        async maybeSingle() {
          return { data: { settings: { booking: { timezone: 'Atlantic/Azores' } } }, error: null };
        },
      };
    }
    if (table === 'obligations') {
      const builder = {
        update() {
          return builder;
        },
        eq() {
          return builder;
        },
        lt(field, value) {
          calls.ltValue = value;
          return builder;
        },
        in() {
          return Promise.resolve({ error: null });
        },
      };
      return builder;
    }
    throw new Error(`tabela inesperada no teste: ${table}`);
  }

  stubModule('../../client', {
    isSupabaseConfigured: () => true,
    getSupabaseAdmin: () => ({ from: fakeFrom }),
  });
  delete require.cache[require.resolve('./shared')];
  delete require.cache[require.resolve('./obligations.repository')];
  const { syncOverdueObligations } = require('./obligations.repository');

  await syncOverdueObligations('firm-azores');

  const expectedToday = todayInTimezone('Atlantic/Azores');
  assert.equal(calls.ltValue, expectedToday);
});

test('maybeSyncOverdueObligations: second call for the same firm skips the UPDATE', async () => {
  ttlCache.clearMemory();
  let calls = 0;
  const sync = async () => {
    calls += 1;
  };
  assert.equal(await maybeSyncOverdueObligations('firm-a', sync), true);
  assert.equal(await maybeSyncOverdueObligations('firm-a', sync), false);
  assert.equal(calls, 1);
});

test('maybeSyncOverdueObligations: different firms do not share the throttle', async () => {
  ttlCache.clearMemory();
  const seen = [];
  const sync = async (firmId) => {
    seen.push(firmId);
  };
  await maybeSyncOverdueObligations('firm-a', sync);
  await maybeSyncOverdueObligations('firm-b', sync);
  assert.deepEqual(seen, ['firm-a', 'firm-b']);
});
