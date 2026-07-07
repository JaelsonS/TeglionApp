const service = require('./postal-lookup.service');

exports.lookup = async (req, res, next) => {
  try {
    const country = String(req.query.country || 'PT').toUpperCase();
    const postalCode = String(req.query.postalCode || '').trim();
    if (!postalCode) {
      return res.status(400).json({ message: 'Código postal obrigatório' });
    }
    const result = await service.lookupPostalAddress({ country, postalCode });
    return res.json(result);
  } catch (err) {
    return next(err);
  }
};
