/**
 * Logs estruturados do backup — sem secrets.
 */

const { redactSecrets } = require('./redact');

function backupLog(event, fields = {}) {
  const payload = {
    event,
    ts: new Date().toISOString(),
    service: 'teglion-backup',
  };
  for (const [k, v] of Object.entries(fields || {})) {
    if (v === undefined) continue;
    if (typeof v === 'string') payload[k] = redactSecrets(v);
    else payload[k] = v;
  }
  // eslint-disable-next-line no-console
  console.log(JSON.stringify(payload));
}

module.exports = { backupLog };
