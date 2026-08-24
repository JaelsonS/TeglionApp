require('../test/ensure-test-env');

const test = require('node:test');
const assert = require('node:assert/strict');
const { requireFirmStaff } = require('./firm-staff.middleware');
const { ROLE_PERMISSIONS, PERMISSIONS, hasPermission } = require('../utils/permissions');

function mockRes() {
  return {};
}

test('requireFirmStaff: rejects CLIENT', () => {
  const req = { user: { id: 'c1', role: 'CLIENT', firmId: 'f1' } };
  let err;
  requireFirmStaff(req, mockRes(), (e) => {
    err = e;
  });
  assert.ok(err);
  assert.equal(err.statusCode, 403);
  assert.equal(err.code || err.details?.code, 'FIRM_STAFF_REQUIRED');
});

test('requireFirmStaff: allows FIRM_OWNER / FIRM_STAFF', () => {
  for (const role of ['FIRM_OWNER', 'FIRM_STAFF', 'CONSULTANT']) {
    let called = false;
    requireFirmStaff({ user: { id: 'u1', role, firmId: 'f1' } }, mockRes(), (e) => {
      assert.equal(e, undefined);
      called = true;
    });
    assert.equal(called, true, role);
  }
});

test('CLIENT role has no firm-staff permissions', () => {
  assert.deepEqual(ROLE_PERMISSIONS.CLIENT, []);
  assert.equal(hasPermission('CLIENT', PERMISSIONS.FIRM_READ), false);
  assert.equal(hasPermission('CLIENT', PERMISSIONS.FIRM_CONSULTATIONS_MANAGE), false);
});
