/**
 * upload.middleware.js - SEGURANÇA APRIMORADA
 *
 * Multer apenas em memória (sem diskStorage). Binários vão para Supabase Storage via serviços.
 */

const multer = require('multer');
const path = require('path');
const crypto = require('crypto');
const { env } = require('../config/env');
const { logger } = require('../utils/logger');
const { validateMagicBytes } = require('../utils/file-magic-bytes');

const UPLOAD_MIDDLEWARE_MESSAGES = {
  invalidAvatarType: 'Avatar deve ser JPG, PNG ou WebP (máx 3MB)',
};

function uploadMiddlewareMessage(key) {
  return UPLOAD_MIDDLEWARE_MESSAGES[key] || key;
}

function generateId(length = 12) {
  return crypto.randomBytes(Math.ceil(length / 2)).toString('hex').slice(0, length);
}

const ALLOWED_MIMES = {
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/png': ['.png'],
  'image/webp': ['.webp'],
  'image/gif': ['.gif'],
  'application/pdf': ['.pdf'],
  'application/msword': ['.doc'],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
  'application/vnd.ms-excel': ['.xls'],
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
  'application/zip': ['.zip'],
  'application/x-zip-compressed': ['.zip'],
};

function isAllowedMime(mime) {
  if (!mime) return false;
  return mime.toLowerCase() in ALLOWED_MIMES;
}

function sanitizeFilename(filename) {
  if (!filename) return `file-${generateId(8)}`;

  let safe = filename.replace(/[\\/]/g, '');
  safe = safe.replace(/\0/g, '');
  const forbiddenChars = new Set(['<', '>', ':', '"', '|', '?', '*']);
  safe = Array.from(safe)
    .filter((char) => !forbiddenChars.has(char))
    .join('');
  safe = Array.from(safe)
    .filter((char) => char.charCodeAt(0) >= 32)
    .join('');
  safe = safe.replace(/\s+/g, '_');
  safe = safe.substring(0, 100);
  if (!safe || safe === '.') {
    return `file-${generateId(8)}`;
  }
  return safe;
}

const memoryStorage = multer.memoryStorage();

function validateMimeAndExt(file, allowedMimesList) {
  const mime = (file?.mimetype || '').toLowerCase();

  if (!allowedMimesList.includes(mime)) {
    return {
      valid: false,
      error: `MIME type "${mime}" não permitido. Tipos permitidos: ${Object.keys(ALLOWED_MIMES).join(', ')}`,
    };
  }

  const ext = path.extname(file.originalname).toLowerCase();
  const validExts = ALLOWED_MIMES[mime] || [];

  if (!validExts.includes(ext)) {
    return {
      valid: false,
      error: `Extensão "${ext}" não permitida para MIME "${mime}". Válidas: ${validExts.join(', ')}`,
    };
  }

  return { valid: true };
}

function assertUploadedFileMagic(req, res, next) {
  if (!req.file?.buffer) return next();

  const validation = validateMagicBytes(req.file.buffer, req.file.mimetype);
  if (!validation.valid) {
    logger.warn(`[UPLOAD] Magic bytes inválidos: ${validation.error}`);
    return next(new Error(validation.error));
  }

  return next();
}

function assertUploadedFilesMagic(req, res, next) {
  const files = req.files;
  if (!files) return next();

  const list = Array.isArray(files)
    ? files
    : Object.values(files).flat();

  for (const file of list) {
    if (!file?.buffer) continue;
    const validation = validateMagicBytes(file.buffer, file.mimetype);
    if (!validation.valid) {
      logger.warn(`[UPLOAD] Magic bytes inválidos (multi): ${validation.error}`);
      return next(new Error(validation.error));
    }
  }

  return next();
}

function wrapMulter(middleware) {
  return (req, res, next) => {
    middleware(req, res, (err) => {
      if (err) return next(err);
      if (req.files) return assertUploadedFilesMagic(req, res, next);
      return assertUploadedFileMagic(req, res, next);
    });
  };
}

function maxFileSizeBytes() {
  const mb = Number(env.MAX_FILE_SIZE) || 25;
  return Math.max(1, mb) * 1024 * 1024;
}

const upload = multer({
  storage: memoryStorage,
  limits: {
    fileSize: maxFileSizeBytes(),
  },
  fileFilter: (req, file, cb) => {
    const validation = validateMimeAndExt(file, Object.keys(ALLOWED_MIMES));

    if (!validation.valid) {
      logger.warn(`[UPLOAD] Rejeitado: ${validation.error}`);
      return cb(new Error(validation.error), false);
    }

    cb(null, true);
  },
});

const uploadAvatar = multer({
  storage: memoryStorage,
  limits: {
    fileSize: 3 * 1024 * 1024,
  },
  fileFilter: (req, file, cb) => {
    const allowedImageMimes = ['image/jpeg', 'image/png', 'image/webp'];
    const validation = validateMimeAndExt(file, allowedImageMimes);

    if (!validation.valid) {
      logger.warn(`[UPLOAD Avatar] Rejeitado: ${validation.error}`);
      return cb(new Error(uploadMiddlewareMessage('invalidAvatarType')), false);
    }

    cb(null, true);
  },
});

/** Só aplica multer em pedidos multipart — JSON mantém req.body do express.json(). */
function optionalSingle(fieldName = 'file') {
  return (req, res, next) => {
    const ct = String(req.headers['content-type'] || '');
    if (ct.includes('multipart/form-data')) {
      return wrapMulter(upload.single(fieldName))(req, res, next);
    }
    return next();
  };
}

const uploadSingle = (fieldName = 'file') => wrapMulter(upload.single(fieldName));
const uploadFields = (fields) => wrapMulter(upload.fields(fields));
const uploadAvatarSingle = (fieldName = 'logo') => wrapMulter(uploadAvatar.single(fieldName));

module.exports = {
  upload,
  uploadAvatar,
  sanitizeFilename,
  optionalSingle,
  uploadSingle,
  uploadFields,
  uploadAvatarSingle,
  assertUploadedFileMagic,
  maxFileSizeBytes,
  maxFileSizeMb: () => Number(env.MAX_FILE_SIZE) || 25,
};
