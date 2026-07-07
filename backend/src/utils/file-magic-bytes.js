/**
 * Validação de magic bytes — complementa MIME/extensão no upload.
 */

const MAGIC_CHECKS = {
  'image/jpeg': [
    (buf) => buf.length >= 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff,
  ],
  'image/png': [
    (buf) =>
      buf.length >= 8 &&
      buf[0] === 0x89 &&
      buf[1] === 0x50 &&
      buf[2] === 0x4e &&
      buf[3] === 0x47 &&
      buf[4] === 0x0d &&
      buf[5] === 0x0a &&
      buf[6] === 0x1a &&
      buf[7] === 0x0a,
  ],
  'image/webp': [
    (buf) =>
      buf.length >= 12 &&
      buf[0] === 0x52 &&
      buf[1] === 0x49 &&
      buf[2] === 0x46 &&
      buf[3] === 0x46 &&
      buf[8] === 0x57 &&
      buf[9] === 0x45 &&
      buf[10] === 0x42 &&
      buf[11] === 0x50,
  ],
  'image/gif': [
    (buf) =>
      buf.length >= 6 &&
      ((buf[0] === 0x47 && buf[1] === 0x49 && buf[2] === 0x46 && buf[3] === 0x38 && buf[4] === 0x37 && buf[5] === 0x61) ||
        (buf[0] === 0x47 && buf[1] === 0x49 && buf[2] === 0x46 && buf[3] === 0x38 && buf[4] === 0x39 && buf[5] === 0x61)),
  ],
  'application/pdf': [
    (buf) => buf.length >= 5 && buf.slice(0, 5).toString('ascii') === '%PDF-',
  ],
  'application/zip': [(buf) => isZip(buf)],
  'application/x-zip-compressed': [(buf) => isZip(buf)],
  'application/msword': [(buf) => isOleCompound(buf)],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': [(buf) => isZip(buf)],
  'application/vnd.ms-excel': [(buf) => isOleCompound(buf)],
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': [(buf) => isZip(buf)],
};

function isZip(buf) {
  return buf.length >= 4 && buf[0] === 0x50 && buf[1] === 0x4b && (buf[2] === 0x03 || buf[2] === 0x05 || buf[2] === 0x07);
}

function isOleCompound(buf) {
  return (
    buf.length >= 8 &&
    buf[0] === 0xd0 &&
    buf[1] === 0xcf &&
    buf[2] === 0x11 &&
    buf[3] === 0xe0 &&
    buf[4] === 0xa1 &&
    buf[5] === 0xb1 &&
    buf[6] === 0x1a &&
    buf[7] === 0xe1
  );
}

function validateMagicBytes(buffer, mime) {
  if (!buffer || !Buffer.isBuffer(buffer) || buffer.length === 0) {
    return { valid: false, error: 'Ficheiro vazio ou inválido.' };
  }

  const normalizedMime = String(mime || '').toLowerCase();
  const checks = MAGIC_CHECKS[normalizedMime];
  if (!checks) {
    return { valid: false, error: `Tipo de ficheiro não suportado: ${normalizedMime || 'desconhecido'}.` };
  }

  const ok = checks.some((fn) => fn(buffer));
  if (!ok) {
    return {
      valid: false,
      error: 'Conteúdo do ficheiro não corresponde ao tipo declarado (magic bytes inválidos).',
    };
  }

  return { valid: true };
}

module.exports = { validateMagicBytes };
