/**
 * Google Drive — importar um ficheiro escolhido pelo staff no seu próprio
 * Drive (Fase I, ver plan file da sessão, v3 secção M). Cliente-side usa o
 * Google Picker + `drive.file` scope (acesso só ao ficheiro escolhido, nunca
 * ao Drive inteiro) — o access_token é efémero, obtido no browser, usado
 * uma única vez aqui e nunca persistido (ao contrário da ligação do
 * Calendar, Fase Ha, que é uma conexão duradoura com refresh_token).
 */
const { env } = require('../../../config/env');

const DRIVE_API = 'https://www.googleapis.com/drive/v3';

function isGoogleDriveConfigured() {
  return Boolean(env.GOOGLE_OAUTH_CLIENT_ID && env.GOOGLE_PICKER_API_KEY);
}

/** Config pública para o Picker no frontend — nenhum destes valores é secreto
 * (o Client ID já é público na SSO; a API key é restringida por HTTP referrer
 * no Google Cloud Console, não por sigilo). */
function getPickerConfig() {
  return {
    configured: isGoogleDriveConfigured(),
    apiKey: env.GOOGLE_PICKER_API_KEY,
    clientId: env.GOOGLE_OAUTH_CLIENT_ID,
  };
}

async function fetchDriveFileMetadata({ accessToken, fileId }) {
  const params = new URLSearchParams({ fields: 'name,mimeType,size' });
  const res = await fetch(`${DRIVE_API}/files/${encodeURIComponent(fileId)}?${params.toString()}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Google Drive metadata failed (${res.status}): ${text.slice(0, 200)}`);
  }
  return res.json();
}

async function downloadDriveFile({ accessToken, fileId }) {
  const res = await fetch(`${DRIVE_API}/files/${encodeURIComponent(fileId)}?alt=media`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Google Drive download failed (${res.status}): ${text.slice(0, 200)}`);
  }
  const arrayBuffer = await res.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

module.exports = {
  isGoogleDriveConfigured,
  getPickerConfig,
  fetchDriveFileMetadata,
  downloadDriveFile,
};
