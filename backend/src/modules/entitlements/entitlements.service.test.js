const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { can, limit, showTeglionBranding } = require('./entitlements.service');

describe('entitlements open mode', () => {
  it('payments.online permitido', async () => {
    const r = await can('firm-1', 'payments.online');
    assert.equal(r.allowed, true);
    assert.equal(r.source, 'open');
  });

  it('limit é null (ilimitado)', async () => {
    assert.equal(await limit('firm-1', 'max_services'), null);
  });

  it('hide_teglion_branding fica bloqueado no modo open (crédito visível)', async () => {
    const r = await can('firm-1', 'hide_teglion_branding');
    assert.equal(r.allowed, false);
    assert.equal(r.reason, 'OPEN_MODE_LOCKED');
    assert.equal(r.source, 'open');
    assert.equal(await showTeglionBranding('firm-1'), true);
  });
});
