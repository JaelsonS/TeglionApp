const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { validateMagicBytes } = require('./file-magic-bytes');

describe('validateMagicBytes', () => {
  it('aceita PNG válido', () => {
    const buf = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00]);
    assert.equal(validateMagicBytes(buf, 'image/png').valid, true);
  });

  it('rejeita PNG com MIME JPEG', () => {
    const buf = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    assert.equal(validateMagicBytes(buf, 'image/jpeg').valid, false);
  });

  it('aceita PDF válido', () => {
    const buf = Buffer.from('%PDF-1.4\n', 'ascii');
    assert.equal(validateMagicBytes(buf, 'application/pdf').valid, true);
  });

  it('aceita DOCX (ZIP)', () => {
    const buf = Buffer.from([0x50, 0x4b, 0x03, 0x04, 0x00]);
    const mime = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    assert.equal(validateMagicBytes(buf, mime).valid, true);
  });
});
