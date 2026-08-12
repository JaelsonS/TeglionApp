/**
 * Google Drive — importar um ficheiro escolhido pelo staff no Picker.
 * access_token é efémero (browser), nunca persistido.
 */
const { env } = require('../../../config/env');
const { AppError } = require('../../../middlewares/error.middleware');

const DRIVE_API = 'https://www.googleapis.com/drive/v3';

const GOOGLE_NATIVE_EXPORT_TARGETS = {
  'application/vnd.google-apps.document': {
    mimeType: 'application/pdf',
    extension: '.pdf',
  },
  'application/vnd.google-apps.spreadsheet': {
    mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    extension: '.xlsx',
  },
  'application/vnd.google-apps.presentation': {
    mimeType: 'application/pdf',
    extension: '.pdf',
  },
  'application/vnd.google-apps.drawing': {
    mimeType: 'application/pdf',
    extension: '.pdf',
  },
};

function isGoogleNativeFile(mimeType) {
  return typeof mimeType === 'string' && mimeType.startsWith('application/vnd.google-apps.');
}

function getExportTarget(mimeType) {
  return GOOGLE_NATIVE_EXPORT_TARGETS[mimeType] || null;
}

function isGoogleDriveConfigured() {
  return Boolean(env.GOOGLE_OAUTH_CLIENT_ID && env.GOOGLE_PICKER_API_KEY);
}

/** Config pública — `pickerApiKey` (não `apiKey`) para não ser removida pelo sanitize. */
function getPickerConfig() {
  return {
    configured: isGoogleDriveConfigured(),
    pickerApiKey: env.GOOGLE_PICKER_API_KEY,
    clientId: env.GOOGLE_OAUTH_CLIENT_ID,
  };
}

function driveApiError(operation, status, bodyText) {
  const err = new Error(`Google Drive ${operation} failed (${status}): ${String(bodyText || '').slice(0, 200)}`);
  err.status = status;
  err.operation = operation;
  return err;
}

/** Converte falhas da API Drive em AppError com mensagem PT utilizável. */
function mapDriveErrorToAppError(err) {
  if (err instanceof AppError) return err;
  const status = Number(err?.status);
  if (status === 401 || status === 403) {
    return new AppError(
      'Não foi possível aceder ao ficheiro no Google Drive. Autorize novamente e tente outra vez.',
      403,
    );
  }
  if (status === 404) {
    return new AppError('Ficheiro não encontrado no Google Drive (pode ter sido apagado ou movido).', 404);
  }
  if (status === 429) {
    return new AppError('Google Drive está temporariamente indisponível. Tente novamente dentro de momentos.', 429);
  }
  if (status >= 500) {
    return new AppError('Google Drive está com problemas temporários. Tente novamente mais tarde.', 502);
  }
  return new AppError('Não foi possível importar o ficheiro do Google Drive.', 502);
}

async function fetchDriveFileMetadata({ accessToken, fileId }) {
  const params = new URLSearchParams({
    fields: 'name,mimeType,size',
    supportsAllDrives: 'true',
  });
  const res = await fetch(`${DRIVE_API}/files/${encodeURIComponent(fileId)}?${params.toString()}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) {
    const text = await res.text();
    throw driveApiError('metadata', res.status, text);
  }
  return res.json();
}

async function downloadDriveFile({ accessToken, fileId }) {
  const params = new URLSearchParams({
    alt: 'media',
    supportsAllDrives: 'true',
  });
  const res = await fetch(`${DRIVE_API}/files/${encodeURIComponent(fileId)}?${params.toString()}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) {
    const text = await res.text();
    throw driveApiError('download', res.status, text);
  }
  const arrayBuffer = await res.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

async function exportDriveFile({ accessToken, fileId, exportMimeType }) {
  const params = new URLSearchParams({
    mimeType: exportMimeType,
    supportsAllDrives: 'true',
  });
  const res = await fetch(`${DRIVE_API}/files/${encodeURIComponent(fileId)}/export?${params.toString()}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) {
    const text = await res.text();
    throw driveApiError('export', res.status, text);
  }
  const arrayBuffer = await res.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

module.exports = {
  isGoogleDriveConfigured,
  getPickerConfig,
  fetchDriveFileMetadata,
  downloadDriveFile,
  exportDriveFile,
  isGoogleNativeFile,
  getExportTarget,
  mapDriveErrorToAppError,
  driveApiError,
};
