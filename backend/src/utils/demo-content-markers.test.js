const { test } = require('node:test');
const assert = require('node:assert/strict');
const {
  stripDemoContentMarkers,
  sanitizeFirmDisplayText,
  sanitizeObligationForFirmDisplay,
} = require('./demo-content-markers');

test('stripDemoContentMarkers: remove HTML comments from demo seeds', () => {
  assert.equal(
    stripDemoContentMarkers('Pedido da equipa Silva & Santos. <!--silva-santos-v1-->'),
    'Pedido da equipa Silva & Santos.',
  );
  assert.equal(stripDemoContentMarkers('<!--only-->'), '');
  assert.equal(stripDemoContentMarkers(null), null);
});

test('sanitizeFirmDisplayText: marker-only becomes null', () => {
  assert.equal(sanitizeFirmDisplayText('<!--silva-santos-v1-->'), null);
});

test('sanitizeObligationForFirmDisplay: strips notes', () => {
  const out = sanitizeObligationForFirmDisplay({
    title: 'IVA',
    notes: '<!--silva-santos-v1-->',
    accountantNotes: 'Ok <!--silva-santos-v1-->',
  });
  assert.equal(out.notes, null);
  assert.equal(out.accountantNotes, 'Ok');
});
