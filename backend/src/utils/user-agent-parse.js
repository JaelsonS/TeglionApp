/**
 * Análise de User-Agent para rastreamento de visualização (PT).
 */
function parseUserAgent(ua) {
  const raw = String(ua || '');
  const lower = raw.toLowerCase();

  let device = 'Computador';
  let os = '';
  let browser = 'Navegador';

  if (/iphone/i.test(raw)) {
    device = 'iPhone';
    os = 'iOS';
  } else if (/ipad/i.test(raw)) {
    device = 'iPad';
    os = 'iOS';
  } else if (/android/i.test(raw)) {
    device = /mobile/i.test(raw) ? 'Android' : 'Tablet Android';
    os = 'Android';
  } else if (/macintosh|mac os/i.test(raw)) {
    os = 'macOS';
  } else if (/windows/i.test(raw)) {
    os = 'Windows';
  } else if (/linux/i.test(raw)) {
    os = 'Linux';
  }

  if (/edg\//i.test(raw)) browser = 'Edge';
  else if (/chrome\//i.test(raw) && !/edg/i.test(raw)) browser = 'Chrome';
  else if (/safari\//i.test(raw) && !/chrome/i.test(raw)) browser = 'Safari';
  else if (/firefox\//i.test(raw)) browser = 'Firefox';

  const deviceLabel = os ? `${device} — ${browser}` : `${device} — ${browser}`;

  return {
    deviceType: /iphone|ipad|android|mobile/i.test(lower) ? 'Telemóvel' : /tablet|ipad/i.test(lower) ? 'Tablet' : 'Computador',
    deviceLabel,
    browserName: browser,
    osName: os || device,
  };
}

module.exports = { parseUserAgent };
