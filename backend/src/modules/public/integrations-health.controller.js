const { buildIntegrationsHealthPayload } = require('../../utils/integrations-health');

async function getIntegrationsHealth(_req, res) {
  try {
    const payload = await buildIntegrationsHealthPayload();
    return res.status(payload.ok ? 200 : 503).json(payload);
  } catch (err) {
    return res.status(503).json({
      ok: false,
      timestamp: new Date().toISOString(),
      error: err?.message || String(err),
    });
  }
}

module.exports = { getIntegrationsHealth };
