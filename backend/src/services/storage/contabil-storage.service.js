/**
 * Supabase Storage — bucket contabil-documents
 * Path: firm/{firm_id}/clients/{client_id}/documents/{filename}
 */
const { getSupabaseAdmin, isSupabaseConfigured } = require('../../db/supabase/client');
const { AppError } = require('../../middlewares/error.middleware');
const { env } = require('../../config/env');

const BUCKET = env.SUPABASE_STORAGE_BUCKET || 'contabil-documents';
const SIGNED_URL_TTL = Number(env.DOCUMENTS_SIGNED_URL_TTL_SECONDS || 300);

function sanitizeFilename(name) {
  return String(name || 'documento')
    .replace(/[/\\]/g, '_')
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .slice(0, 180);
}

function buildStoragePath(firmId, clientId, filename) {
  const safe = sanitizeFilename(filename);
  return `firm/${firmId}/clients/${clientId}/documents/${Date.now()}-${safe}`;
}

function buildFirmLogoPath(firmId, filename) {
  const safe = sanitizeFilename(filename);
  return `firm/${firmId}/branding/logo-${Date.now()}-${safe}`;
}

function buildNewsCoverPath(firmId, filename) {
  const safe = sanitizeFilename(filename);
  return `firm/${firmId}/news/covers/${Date.now()}-${safe}`;
}

function ensureStorage() {
  if (!isSupabaseConfigured()) {
    throw new AppError('Armazenamento não configurado (Supabase).', 503, { code: 'STORAGE_NOT_CONFIGURED' });
  }
  const sb = getSupabaseAdmin();
  if (!sb) throw new AppError('Armazenamento indisponível.', 503);
  return sb;
}

async function uploadClientDocument({ firmId, clientId, file }) {
  if (!file?.buffer?.length) throw new AppError('Ficheiro vazio', 400);
  const sb = ensureStorage();
  const path = buildStoragePath(firmId, clientId, file.originalname);

  const { error } = await sb.storage.from(BUCKET).upload(path, file.buffer, {
    contentType: file.mimetype || 'application/octet-stream',
    upsert: false,
  });
  if (error) {
    throw new AppError(error.message || 'Falha ao guardar ficheiro', 500, { code: 'STORAGE_UPLOAD_FAILED' });
  }

  return {
    bucket: BUCKET,
    path,
    provider: 'supabase',
  };
}

async function createSignedDownloadUrl(storageKey, ttlSeconds = SIGNED_URL_TTL) {
  if (!storageKey) throw new AppError('Documento sem ficheiro associado', 404);
  const sb = ensureStorage();
  const { data, error } = await sb.storage.from(BUCKET).createSignedUrl(storageKey, ttlSeconds);
  if (error || !data?.signedUrl) {
    throw new AppError('Não foi possível gerar link de download', 500, { code: 'STORAGE_SIGNED_URL_FAILED' });
  }
  return data.signedUrl;
}

async function downloadToBuffer(storageKey) {
  const sb = ensureStorage();
  const { data, error } = await sb.storage.from(BUCKET).download(storageKey);
  if (error || !data) {
    throw new AppError('Ficheiro não encontrado no armazenamento', 404, { code: 'STORAGE_NOT_FOUND' });
  }
  const arrayBuffer = await data.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

async function uploadNewsCover({ firmId, file }) {
  if (!file?.buffer?.length) throw new AppError('Imagem vazia', 400);
  const mime = String(file.mimetype || '').toLowerCase();
  if (!['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(mime)) {
    throw new AppError('Use JPG, PNG, WebP ou GIF para a imagem da publicação.', 400, {
      code: 'INVALID_COVER_TYPE',
    });
  }
  const sb = ensureStorage();
  const path = buildNewsCoverPath(firmId, file.originalname);
  const { error } = await sb.storage.from(BUCKET).upload(path, file.buffer, {
    contentType: mime,
    upsert: false,
  });
  if (error) {
    throw new AppError(error.message || 'Falha ao guardar imagem', 500, { code: 'STORAGE_UPLOAD_FAILED' });
  }
  return { bucket: BUCKET, path, provider: 'supabase' };
}

async function deleteObject(path) {
  if (!path) return;
  const sb = ensureStorage();
  const { error } = await sb.storage.from(BUCKET).remove([String(path)]);
  if (error) {
    throw new AppError(error.message || 'Falha ao remover ficheiro', 500, { code: 'STORAGE_DELETE_FAILED' });
  }
}

async function uploadFirmLogo({ firmId, file }) {
  if (!file?.buffer?.length) throw new AppError('Imagem vazia', 400);
  const mime = String(file.mimetype || '').toLowerCase();
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(mime)) {
    throw new AppError('Use JPG, PNG ou WebP para o logótipo.', 400, { code: 'INVALID_LOGO_TYPE' });
  }
  const sb = ensureStorage();
  const path = buildFirmLogoPath(firmId, file.originalname);
  const { error } = await sb.storage.from(BUCKET).upload(path, file.buffer, {
    contentType: mime,
    upsert: true,
  });
  if (error) {
    throw new AppError(error.message || 'Falha ao guardar logótipo', 500, { code: 'STORAGE_UPLOAD_FAILED' });
  }
  return { bucket: BUCKET, path, provider: 'supabase' };
}

module.exports = {
  BUCKET,
  buildStoragePath,
  buildFirmLogoPath,
  buildNewsCoverPath,
  uploadClientDocument,
  deleteObject,
  uploadFirmLogo,
  uploadNewsCover,
  createSignedDownloadUrl,
  downloadToBuffer,
};
