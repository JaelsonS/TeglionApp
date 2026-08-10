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
