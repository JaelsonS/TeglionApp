const { getClientAtStatus } = require('./at.adapter');

function getIntegrationStatus(req, res) {
  const nif = req.query.nif || null;
  return res.json(getClientAtStatus({ nif }));
}

module.exports = { getIntegrationStatus };
