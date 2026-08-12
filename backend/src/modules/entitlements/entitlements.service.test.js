const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { can, limit } = require('./entitlements.service');

describe('entitlements open mode', () => {
  it('payments.online permitido', async () => {
    const r = await can('firm-1', 'payments.online');
    assert.equal(r.allowed, true);
    assert.equal(r.source, 'open');
  });

  it('limit é null (ilimitado)', async () => {
    assert.equal(await limit('firm-1', 'max_services'), null);
  });
});
