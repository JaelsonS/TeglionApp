/**
 * Marcadores HTML de scripts de demo (ex. <!--silva-santos-v1-->).
 * Nunca devem aparecer em respostas públicas nem em HTML sanitizado no cliente.
 */

const DEMO_HTML_COMMENT_RE = /<!--[\s\S]*?-->/g;

function stripDemoContentMarkers(raw) {
  if (raw == null) return raw;
  let s = String(raw);
  s = s.replace(DEMO_HTML_COMMENT_RE, '');
  s = s.replace(/\s{2,}/g, ' ').trim();
  return s;
}

module.exports = {
  stripDemoContentMarkers,
};
