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

/** Texto para APIs/UI do escritório — remove marcadores de demo; vazio → null. */
function sanitizeFirmDisplayText(raw) {
  if (raw == null) return raw;
  const s = stripDemoContentMarkers(raw);
  return s.length ? s : null;
}

function sanitizeTaskForFirmDisplay(task) {
  if (!task || typeof task !== 'object') return task;
  return {
    ...task,
    title: sanitizeFirmDisplayText(task.title) ?? task.title,
    description: sanitizeFirmDisplayText(task.description),
  };
}

function sanitizeObligationForFirmDisplay(ob) {
  if (!ob || typeof ob !== 'object') return ob;
  return {
    ...ob,
    title: sanitizeFirmDisplayText(ob.title) ?? ob.title,
    notes: sanitizeFirmDisplayText(ob.notes),
    accountantNotes: sanitizeFirmDisplayText(ob.accountantNotes),
  };
}

module.exports = {
  stripDemoContentMarkers,
  sanitizeFirmDisplayText,
  sanitizeTaskForFirmDisplay,
  sanitizeObligationForFirmDisplay,
};
