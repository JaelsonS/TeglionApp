const { test } = require('node:test');
const assert = require('node:assert/strict');
const { stripDemoContentMarkers } = require('./demo-content-markers');

test('stripDemoContentMarkers: remove HTML comments from demo seeds', () => {
  assert.equal(
    stripDemoContentMarkers('Pedido da equipa Silva & Santos. <!--silva-santos-v1-->'),
    'Pedido da equipa Silva & Santos.',
  );
  assert.equal(stripDemoContentMarkers('<!--only-->'), '');
  assert.equal(stripDemoContentMarkers(null), null);
});
