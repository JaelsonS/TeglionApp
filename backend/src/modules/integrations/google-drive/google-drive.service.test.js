const test = require('node:test');
const assert = require('node:assert/strict');

const { env } = require('../../../config/env');
const googleDriveService = require('./google-drive.service');

test('isGoogleDriveConfigured/getPickerConfig: false quando faltam credenciais', () => {
  const prevId = env.GOOGLE_OAUTH_CLIENT_ID;
  const prevKey = env.GOOGLE_PICKER_API_KEY;
  env.GOOGLE_OAUTH_CLIENT_ID = null;
  env.GOOGLE_PICKER_API_KEY = null;
  try {
    assert.equal(googleDriveService.isGoogleDriveConfigured(), false);
    assert.equal(googleDriveService.getPickerConfig().configured, false);
  } finally {
    env.GOOGLE_OAUTH_CLIENT_ID = prevId;
    env.GOOGLE_PICKER_API_KEY = prevKey;
  }
});

test('isGoogleNativeFile: identifica mimetypes application/vnd.google-apps.* e rejeita os restantes', () => {
  assert.equal(googleDriveService.isGoogleNativeFile('application/vnd.google-apps.document'), true);
  assert.equal(googleDriveService.isGoogleNativeFile('application/pdf'), false);
  assert.equal(googleDriveService.isGoogleNativeFile(undefined), false);
});

test('getExportTarget: mapeia Docs/Sheets/Slides/Drawings para formatos já na whitelist de upload; devolve null para o resto', () => {
  assert.deepEqual(googleDriveService.getExportTarget('application/vnd.google-apps.document'), {
    mimeType: 'application/pdf',
    extension: '.pdf',
  });
  assert.deepEqual(googleDriveService.getExportTarget('application/vnd.google-apps.spreadsheet'), {
    mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    extension: '.xlsx',
  });
  assert.equal(googleDriveService.getExportTarget('application/vnd.google-apps.form'), null);
  assert.equal(googleDriveService.getExportTarget('application/pdf'), null);
});

test('isGoogleDriveConfigured/getPickerConfig: true e devolve client_id/pickerApiKey quando ambos presentes', () => {
  const prevId = env.GOOGLE_OAUTH_CLIENT_ID;
  const prevKey = env.GOOGLE_PICKER_API_KEY;
  env.GOOGLE_OAUTH_CLIENT_ID = 'client-x';
  env.GOOGLE_PICKER_API_KEY = 'picker-key-x';
  try {
    assert.equal(googleDriveService.isGoogleDriveConfigured(), true);
    assert.deepEqual(googleDriveService.getPickerConfig(), {
      configured: true,
      pickerApiKey: 'picker-key-x',
      clientId: 'client-x',
    });
  } finally {
    env.GOOGLE_OAUTH_CLIENT_ID = prevId;
    env.GOOGLE_PICKER_API_KEY = prevKey;
  }
});

test('mapDriveErrorToAppError: 401/403 → mensagem PT e status 403', () => {
  const err = googleDriveService.driveApiError('metadata', 401, 'unauthorized');
  const mapped = googleDriveService.mapDriveErrorToAppError(err);
  assert.equal(mapped.statusCode, 403);
  assert.match(mapped.message, /Google Drive/i);
});

test('mapDriveErrorToAppError: 404 → ficheiro não encontrado', () => {
  const err = googleDriveService.driveApiError('download', 404, 'not found');
  const mapped = googleDriveService.mapDriveErrorToAppError(err);
  assert.equal(mapped.statusCode, 404);
});
