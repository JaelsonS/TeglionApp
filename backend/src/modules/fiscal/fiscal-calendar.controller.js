const firmsRepository = require('../../db/supabase/repositories/firms.repository');
const { listFiscalCalendar, listAvailableYears, listFiscalCalendarForCountry } = require('./fiscal-calendar.service');

async function getCalendar(req, res, next) {
  try {
    const year = req.query.year || 2026;
    const category = req.query.category || null;
    const month = req.query.month || null;
    const firmId = String(req.user?.firmId || '');
    let countryCode = 'PT';
    if (firmId) {
      const firm = await firmsRepository.findFirmById(firmId);
      countryCode = firm?.countryCode || 'PT';
    }
    return res.json(listFiscalCalendarForCountry(countryCode, { year, category, month }));
  } catch (err) {
    return next(err);
  }
}

async function getAvailableYears(req, res, next) {
  try {
    const firmId = String(req.user?.firmId || '');
    let countryCode = 'PT';
    if (firmId) {
      const firm = await firmsRepository.findFirmById(firmId);
      countryCode = firm?.countryCode || 'PT';
    }
    if (countryCode !== 'PT') {
      const y = new Date().getFullYear();
      return res.json({ years: [y - 1, y, y + 1], country: countryCode, status: 'coming_soon' });
    }
    return res.json({ years: listAvailableYears(), country: 'PT' });
  } catch (err) {
    return next(err);
  }
}

module.exports = { getCalendar, getAvailableYears };
