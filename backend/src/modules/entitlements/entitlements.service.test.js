const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { can, limitsForStatus, showTeglionBranding } = require('./entitlements.service');

describe('entitlements plan limits', () => {
  it('payments.online permitido', async () => {
    const r = await can('firm-1', 'payments.online');
    assert.equal(r.allowed, true);
    assert.equal(r.source, 'plan');
  });

  it('trial tem tecto de clientes e equipa', () => {
    const caps = limitsForStatus('TRIAL');
    assert.equal(caps.max_clients, 40);
    assert.equal(caps.max_staff, 4);
  });

  it('activo tem tecto mais alto', () => {
    const caps = limitsForStatus('ACTIVE');
    assert.equal(caps.max_clients, 250);
    assert.equal(caps.max_staff, 10);
  });

  it('hide_teglion_branding fica bloqueado (crédito visível)', async () => {
    const r = await can('firm-1', 'hide_teglion_branding');
    assert.equal(r.allowed, false);
    assert.equal(await showTeglionBranding('firm-1'), true);
  });
});
