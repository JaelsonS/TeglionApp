const { describe, test } = require('node:test');
const assert = require('node:assert/strict');
const { normalizeIp, isPrivateOrLocal, assertPublicIp } = require('./ip-denylist.service');

describe('ip-denylist helpers', () => {
  test('normalizeIp strip mapped IPv4', () => {
    assert.equal(normalizeIp('::ffff:203.0.113.1'), '203.0.113.1');
  });

  test('rejects private and loopback', () => {
    assert.equal(isPrivateOrLocal('10.0.0.1'), true);
    assert.equal(isPrivateOrLocal('192.168.1.1'), true);
    assert.equal(isPrivateOrLocal('127.0.0.1'), true);
    assert.equal(isPrivateOrLocal('203.0.113.10'), false);
  });

  test('assertPublicIp accepts documentation range', () => {
    assert.equal(assertPublicIp('203.0.113.10'), '203.0.113.10');
  });

  test('assertPublicIp rejects private', () => {
    assert.throws(() => assertPublicIp('10.1.2.3'), /privados/);
  });
});
