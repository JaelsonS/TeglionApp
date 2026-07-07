const { listSupportedCountries } = require('../../config/country-config.registry');

function getSupportedCountries(_req, res) {
  return res.json({ countries: listSupportedCountries() });
}

module.exports = { getSupportedCountries };
