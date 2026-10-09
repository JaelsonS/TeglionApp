const test = require('node:test');
const assert = require('node:assert/strict');

const { parseCustomServices } = require('./custom-services');

test('parseCustomServices trims and caps list', () => {
  const out = parseCustomServices([
    { name: '  Declarações  ', description: ' x ', durationMinutes: 5, priceCents: -1 },
    { name: '' },
    { name: 'B', durationMinutes: 9999, priceCents: 1e9 },
  ]);
  assert.equal(out.length, 2);
  assert.equal(out[0].name, 'Declarações');
  assert.equal(out[0].durationMinutes, 60);
  assert.equal(out[0].priceCents, 0);
  assert.equal(out[1].durationMinutes, 480);
  assert.equal(out[1].priceCents, 99999999);
});
