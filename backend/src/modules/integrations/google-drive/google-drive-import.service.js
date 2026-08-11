/**
 * Orquestração da importação de um ficheiro do Google Drive para a conversa
 * de um cliente (Fase I) — separa a mecânica da API do Drive
 * (google-drive.service.js) do que fazemos com o resultado: validar (mesma
 * whitelist/magic-bytes de qualquer upload local), guardar no storage, e
 * anexar como mensagem — mesmo destino final de "Anexar ficheiro" no chat,
 * só a origem dos bytes é diferente.
 */
const { AppError } = require('../../../middlewares/error.middleware');
const clientsRepository = require('../../../db/supabase/repositories/clients.repository');
const contabilStorage = require('../../../services/storage/contabil-storage.service');
const messagesService = require('../../messages/messages.service');
const googleDriveService = require('./google-drive.service');
const { validateMimeAndExt, validateMagicBytes, ALLOWED_MIMES, maxFileSizeBytes, maxFileSizeMb } = require('../../../middlewares/upload.middleware');

async function importFileFromDrive({ firmId, clientId, senderId, fileId, accessToken, body }) {
  if (!fileId || !accessToken) throw new AppError('fileId e accessToken são obrigatórios', 400);

  const client = await clientsRepository.findClientById(firmId, clientId);
  if (!client) throw new AppError('Cliente não encontrado', 404);

  const metadata = await googleDriveService.fetchDriveFileMetadata({ accessToken, fileId });

  const declaredSize = Number(metadata.size) || 0;
  if (declaredSize > maxFileSizeBytes()) {
    throw new AppError(`Ficheiro excede o limite de ${maxFileSizeMb()}MB`, 400);
  }

  // Ficheiros nativos do Google (Docs/Sheets/Slides/Drawings) não têm bytes
  // próprios — precisam de ser exportados para um formato real (PDF/XLSX)
  // em vez de descarregados directamente.
  const exportTarget = googleDriveService.getExportTarget(metadata.mimeType);
  if (googleDriveService.isGoogleNativeFile(metadata.mimeType) && !exportTarget) {
    throw new AppError(
      'Este tipo de ficheiro do Google (ex: Formulários, Apps Script) não pode ser importado directamente. Abra-o no Google Drive, exporte para PDF e tente novamente.',
      400,
    );
  }

  const buffer = exportTarget
    ? await googleDriveService.exportDriveFile({ accessToken, fileId, exportMimeType: exportTarget.mimeType })
    : await googleDriveService.downloadDriveFile({ accessToken, fileId });

  const hasExtension = /\.[a-z0-9]{2,5}$/i.test(metadata.name || '');
  const originalname = exportTarget && !hasExtension
    ? `${metadata.name || 'documento'}${exportTarget.extension}`
    : metadata.name || 'documento';

  const file = {
    buffer,
    mimetype: exportTarget ? exportTarget.mimeType : metadata.mimeType || 'application/octet-stream',
    originalname,
    size: buffer.length,
  };

  if (file.size > maxFileSizeBytes()) {
    throw new AppError(`Ficheiro excede o limite de ${maxFileSizeMb()}MB`, 400);
  }

  const mimeCheck = validateMimeAndExt(file, Object.keys(ALLOWED_MIMES));
  if (!mimeCheck.valid) throw new AppError(mimeCheck.error, 400);

  const magicCheck = validateMagicBytes(file.buffer, file.mimetype);
  if (!magicCheck.valid) throw new AppError(magicCheck.error, 400);

  const uploaded = await contabilStorage.uploadClientDocument({ firmId, clientId, file });
  const attachment = {
    storageKey: uploaded.path,
    name: file.originalname,
    mime: file.mimetype,
    size: file.size,
  };

  return messagesService.sendFirmMessage({
    firmId,
    clientId,
    senderId,
    body: body || file.originalname,
    attachment,
  });
}

module.exports = { importFileFromDrive };
