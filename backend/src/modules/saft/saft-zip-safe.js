/**
 * Leitura segura de ZIP local (SAF-T .zip e OOXML .xlsx).
 * — Sem download de URLs; só bytes do upload.
 * — Sem path traversal; sem nested archives; limites de bombas.
 */
const { inflateRawSync } = require('zlib');

const MAX_ZIP_ENTRIES = 80;
const MAX_UNCOMPRESSED_ENTRY = 40 * 1024 * 1024;
const MAX_TOTAL_UNCOMPRESSED = 60 * 1024 * 1024;
const DANGEROUS_EXT = new Set([
  '.exe',
  '.dll',
  '.so',
  '.dylib',
  '.js',
  '.mjs',
  '.cjs',
  '.vbs',
  '.bat',
  '.cmd',
  '.ps1',
  '.jar',
  '.war',
  '.zip',
  '.7z',
  '.rar',
  '.gz',
  '.tgz',
  '.xz',
  '.xls', // OLE legado / macros — nunca dentro do pacote
  '.xlsm',
  '.xltm',
  '.docm',
]);

function isZipBuffer(buf) {
  return (
    Buffer.isBuffer(buf) &&
    buf.length >= 4 &&
    buf[0] === 0x50 &&
    buf[1] === 0x4b &&
    (buf[2] === 0x03 || buf[2] === 0x05 || buf[2] === 0x07)
  );
}

function isOleCompoundBuffer(buf) {
  // Excel .xls antigo / macros OLE
  return (
    Buffer.isBuffer(buf) &&
    buf.length >= 8 &&
    buf[0] === 0xd0 &&
    buf[1] === 0xcf &&
    buf[2] === 0x11 &&
    buf[3] === 0xe0
  );
}

function assertSafeZipEntryName(name) {
  const raw = String(name || '');
  if (!raw || raw.includes('\0')) {
    throw Object.assign(new Error('Nome de entrada ZIP inválido'), { code: 'ZIP_UNSAFE_NAME' });
  }
  const normalized = raw.replace(/\\/g, '/');
  if (normalized.startsWith('/') || /^[a-zA-Z]:/.test(normalized)) {
    throw Object.assign(new Error('ZIP com caminho absoluto rejeitado'), { code: 'ZIP_PATH_TRAVERSAL' });
  }
  const parts = normalized.split('/');
  if (parts.some((p) => p === '..')) {
    throw Object.assign(new Error('ZIP com path traversal (..) rejeitado'), {
      code: 'ZIP_PATH_TRAVERSAL',
    });
  }
  const lower = normalized.toLowerCase();
  if (lower.includes('vbaproject') || lower.endsWith('.bin') && lower.includes('vba')) {
    throw Object.assign(new Error('Excel/ZIP com macros VBA não é aceite'), {
      code: 'ZIP_MACROS_REJECTED',
    });
  }
  const base = parts[parts.length - 1] || '';
  const dot = base.lastIndexOf('.');
  const ext = dot >= 0 ? base.slice(dot).toLowerCase() : '';
  if (ext && DANGEROUS_EXT.has(ext)) {
    throw Object.assign(new Error(`Tipo de ficheiro dentro do ZIP não permitido (${ext})`), {
      code: 'ZIP_DANGEROUS_ENTRY',
    });
  }
  return normalized;
}

/**
 * Itera local file headers. Não segue URLs; não escreve em disco.
 * @returns {Array<{ name: string, buffer: Buffer, compression: number }>}
 */
function listSafeZipEntries(buffer, { allowXml = true, allowXlsxParts = false } = {}) {
  if (!isZipBuffer(buffer)) {
    throw Object.assign(new Error('ZIP inválido'), { code: 'INVALID_ZIP' });
  }

  let offset = 0;
  let entries = 0;
  let totalUncompressed = 0;
  const out = [];

  while (offset + 30 <= buffer.length && entries < MAX_ZIP_ENTRIES) {
    if (buffer[offset] !== 0x50 || buffer[offset + 1] !== 0x4b) break;
    // Local file header only (0x04034b50)
    if (buffer[offset + 2] !== 0x03 || buffer[offset + 3] !== 0x04) break;

    const flags = buffer.readUInt16LE(offset + 6);
    const compression = buffer.readUInt16LE(offset + 8);
    const compSize = buffer.readUInt32LE(offset + 18);
    const uncompSize = buffer.readUInt32LE(offset + 22);
    const nameLen = buffer.readUInt16LE(offset + 26);
    const extraLen = buffer.readUInt16LE(offset + 28);
    const nameStart = offset + 30;
    const nameEnd = nameStart + nameLen;
    if (nameEnd + extraLen > buffer.length) break;

    // Data descriptor (bit 3): tamanhos no header podem ser 0 — recusar (ambíguo / bomb-prone)
    if (flags & 0x08) {
      throw Object.assign(
        new Error('ZIP com data descriptor não é aceite (protecção zip-bomb)'),
        { code: 'ZIP_DATA_DESCRIPTOR' },
      );
    }

    const name = assertSafeZipEntryName(buffer.slice(nameStart, nameEnd).toString('utf8'));
    const dataStart = nameEnd + extraLen;
    const dataEnd = dataStart + compSize;
    if (dataEnd > buffer.length) break;

    entries += 1;
    const lower = name.toLowerCase();
    const isDir = name.endsWith('/');
    const isJunk = lower.includes('__macosx') || lower.split('/').pop()?.startsWith('.');

    if (!isDir && !isJunk) {
      const isXml = lower.endsWith('.xml');
      // Nunca extrair binários/media — só XML (SAF-T ou partes OOXML de texto).
      if ((allowXml || allowXlsxParts) && isXml) {
        if (uncompSize > MAX_UNCOMPRESSED_ENTRY) {
          throw Object.assign(new Error('Entrada ZIP demasiado grande'), {
            code: 'ZIP_ENTRY_TOO_LARGE',
          });
        }
        totalUncompressed += uncompSize;
        if (totalUncompressed > MAX_TOTAL_UNCOMPRESSED) {
          throw Object.assign(new Error('ZIP descomprimido demasiado grande'), {
            code: 'ZIP_BOMB',
          });
        }

        const compressed = buffer.slice(dataStart, dataEnd);
        let entryBuf;
        if (compression === 0) {
          entryBuf = compressed;
        } else if (compression === 8) {
          try {
            entryBuf = inflateRawSync(compressed, { maxOutputLength: MAX_UNCOMPRESSED_ENTRY });
          } catch {
            throw Object.assign(new Error('Falha ao descomprimir entrada ZIP'), {
              code: 'ZIP_INFLATE_FAILED',
            });
          }
        } else {
          throw Object.assign(new Error('Compressão ZIP não suportada (só stored/deflate)'), {
            code: 'ZIP_COMPRESSION',
          });
        }
        if (entryBuf.length > MAX_UNCOMPRESSED_ENTRY) {
          throw Object.assign(new Error('Entrada ZIP demasiado grande após inflate'), {
            code: 'ZIP_ENTRY_TOO_LARGE',
          });
        }
        out.push({ name, buffer: entryBuf, compression });
      } else if (!allowXlsxParts) {
        // Em ZIP SAF-T clássico ignoramos não-XML; mas rejeitamos binários perigosos já cobertos por assertSafeZipEntryName
      }
    }

    offset = dataEnd;
  }

  return out;
}

module.exports = {
  isZipBuffer,
  isOleCompoundBuffer,
  assertSafeZipEntryName,
  listSafeZipEntries,
  MAX_ZIP_ENTRIES,
  MAX_UNCOMPRESSED_ENTRY,
  MAX_TOTAL_UNCOMPRESSED,
};
