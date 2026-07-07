const bookingService = require('../booking/booking.service');
const accountingServicesService = require('./accounting-services.service');
const { requireUserFirmId } = require('../../utils/contabil-scope');

exports.get = async (req, res, next) => {
  try {
    const firmId = requireUserFirmId(req);
    const [cfg, servicesList] = await Promise.all([
      bookingService.getBookingConfigForFirm(firmId),
      accountingServicesService.list({ firmId, activeOnly: false }),
    ]);
    return res.json({ booking: cfg, services: servicesList.items });
  } catch (err) {
    return next(err);
  }
};

exports.patch = async (req, res, next) => {
  try {
    const firmId = requireUserFirmId(req);
    const patch = req.body || {};
    const cfg = await bookingService.updateBookingSettings(firmId, patch);
    return res.json({ booking: cfg });
  } catch (err) {
    return next(err);
  }
};
