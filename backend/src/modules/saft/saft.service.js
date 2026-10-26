const crypto = require('crypto');
const path = require('path');
const { AppError } = require('../../middlewares/error.middleware');
const clientsRepository = require('../../db/supabase/repositories/clients.repository');
const saftImportsRepository = require('../../db/supabase/repositories/client-saft-imports.repository');
const {
  bufferToXmlText,
  summarizeSaftXml,
  extractXmlFromZip,
  isZipBuffer,
} = require('./saft-xml-safe');
const { INTERNAL_DISCLAIMER, MAX_SAFT_UPLOAD_BYTES } = require('./saft.constants');

function sha256Hex(buffer) {
  return crypto.createHash('sha256').update(buffer).digest('hex');
}

function detectSourceKind(filename, buffer) {
  const ext = path.extname(filename || '').toLowerCase();
  if (ext === '.zip' || isZipBuffer(buffer)) return 'zip';
  if (ext === '.xml') return 'xml';
  // MIME octet-stream: sniff
  if (isZipBuffer(buffer)) return 'zip';
  const head = buffer.slice(0, 200).toString('utf8').trimStart();
  if (head.startsWith('<?xml') || /<(?:\w+:)?AuditFile\b/i.test(head)) return 'xml';
  throw new AppError('Só são aceites ficheiros .xml ou .zip com SAF-T', 400, 'INVALID_SAFT_TYPE');
}

function parseBufferToSummary(buffer, sourceKind) {
  let xmlBuffer = buffer;
  let zipEntryName = null;
  if (sourceKind === 'zip') {
    const extracted = extractXmlFromZip(buffer);
    xmlBuffer = extracted.xmlBuffer;
    zipEntryName = extracted.entryName;
  }
  const xmlText = bufferToXmlText(xmlBuffer);
  const parsed = summarizeSaftXml(xmlText);
  return { ...parsed, zipEntryName };
}

async function getMeta() {
  return {
    disclaimer: INTERNAL_DISCLAIMER,
    accepted: ['.xml', '.zip'],
    maxBytes: MAX_SAFT_UPLOAD_BYTES,
    storesFileContent: false,
    sendsToAt: false,
  };
}

async function listImports({ firmId, clientId, limit }) {
  const items = await saftImportsRepository.listImports(firmId, { clientId, limit });
  return { items, disclaimer: INTERNAL_DISCLAIMER };
}

async function getImport({ firmId, importId }) {
  const item = await saftImportsRepository.findById(firmId, importId);
  if (!item) throw new AppError('Importação não encontrada', 404, 'SAFT_NOT_FOUND');
  return { item, disclaimer: INTERNAL_DISCLAIMER };
}

async function importSaft({ firmId, clientId, actorId, file }) {
  if (!file?.buffer) {
    throw new AppError('Ficheiro obrigatório', 400, 'FILE_REQUIRED');
  }
  if (file.buffer.length > MAX_SAFT_UPLOAD_BYTES) {
    throw new AppError('Ficheiro demasiado grande (máx. 25 MB)', 400, 'FILE_TOO_LARGE');
  }

  let resolvedClientId = null;
  if (clientId) {
    const client = await clientsRepository.findClientById(firmId, String(clientId));
    if (!client) throw new AppError('Cliente não encontrado', 404, 'CLIENT_NOT_FOUND');
    resolvedClientId = client.id;
  }

  const originalFilename = String(file.originalname || 'saft.xml').slice(0, 200);
  const sourceKind = detectSourceKind(originalFilename, file.buffer);
  const contentSha256 = sha256Hex(file.buffer);

  const existing = await saftImportsRepository.findByHash(firmId, contentSha256);
  if (existing) {
    return {
      item: existing,
      duplicate: true,
      disclaimer: INTERNAL_DISCLAIMER,
    };
  }

  let parsed;
  try {
    parsed = parseBufferToSummary(file.buffer, sourceKind);
  } catch (err) {
    const code = err.code || 'SAFT_PARSE_FAILED';
    const status = code === 'UNSAFE_XML' ? 400 : 400;
    throw new AppError(err.message || 'Falha ao ler SAF-T', status, code);
  }

  if (parsed.validationStatus === 'invalid') {
    throw new AppError(
      `SAF-T inválido: ${(parsed.validationNotes || []).join('; ') || 'estrutura incompleta'}`,
      400,
      'SAFT_INVALID',
    );
  }

  const summary = {
    ...parsed.summary,
    zipEntryName: parsed.zipEntryName || null,
  };

  const item = await saftImportsRepository.insertImport({
    firmId,
    clientId: resolvedClientId,
    originalFilename,
    contentSha256,
    fileBytes: file.buffer.length,
    sourceKind,
    auditFileVersion: parsed.auditFileVersion,
    companyId: parsed.companyId,
    taxRegistrationNumber: parsed.taxRegistrationNumber,
    companyName: parsed.companyName,
    fiscalYear: parsed.fiscalYear,
    startDate: parsed.startDate,
    endDate: parsed.endDate,
    currencyCode: parsed.currencyCode,
    productId: parsed.productId,
    productVersion: parsed.productVersion,
    summary,
    validationStatus: parsed.validationStatus,
    validationNotes: parsed.validationNotes,
    createdBy: actorId || null,
  });

  return { item, duplicate: false, disclaimer: INTERNAL_DISCLAIMER };
}

async function removeImport({ firmId, importId }) {
  const existing = await saftImportsRepository.findById(firmId, importId);
  if (!existing) throw new AppError('Importação não encontrada', 404, 'SAFT_NOT_FOUND');
  await saftImportsRepository.deleteImport(firmId, importId);
  return { ok: true };
}

/** Exposto para testes unitários sem DB. */
function previewSaftBuffer(buffer, filename = 'saft.xml') {
  const sourceKind = detectSourceKind(filename, buffer);
  return parseBufferToSummary(buffer, sourceKind);
}

module.exports = {
  getMeta,
  listImports,
  getImport,
  importSaft,
  removeImport,
  previewSaftBuffer,
  detectSourceKind,
  INTERNAL_DISCLAIMER,
};
