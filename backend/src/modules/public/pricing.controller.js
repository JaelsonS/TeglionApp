const { getPricingPlans } = require('../../config/pricing-plans');

/**
 * Preços públicos (Landing Page / página de preços). Sem autenticação.
 * Mesma fonte de verdade usada pelo Dashboard/Billing (`billing.service.js`).
 */
function getPublicPricing(req, res) {
  const countryCode = String(req.query.country || 'PT');
  return res.json(getPricingPlans(countryCode));
}

module.exports = { getPublicPricing };
