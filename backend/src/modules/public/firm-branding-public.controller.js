const { query } = require('express-validator');
const { validationResult } = require('express-validator');
const { AppError } = require('../../middlewares/error.middleware');
const firmsRepository = require('../../db/supabase/repositories/firms.repository');
const firmBrandingService = require('../firm/firm-branding.service');

function assertValid(req) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new AppError('Parâmetros inválidos', 400, { errors: errors.array() });
  }
}

async function getBySlug(req, res, next) {
  try {
    assertValid(req);
    const slug = String(req.query.slug || '').trim();
    const firm = await firmsRepository.findFirmBySlugOrLabel(slug);
    if (!firm) {
      throw new AppError('Escritório não encontrado', 404, { code: 'FIRM_NOT_FOUND' });
    }
    let logoUrl = null;
    try {
      logoUrl = await firmBrandingService.resolveLogoUrl(firm);
    } catch {
      logoUrl = firm.settings?.branding?.logoUrl || null;
    }
    return res.status(200).json({
      slug: firm.slug,
      name: firm.name,
      logoUrl,
    });
  } catch (err) {
    return next(err);
  }
}

const validators = [query('slug').isString().trim().isLength({ min: 2, max: 64 })];

module.exports = { getBySlug, validators };
