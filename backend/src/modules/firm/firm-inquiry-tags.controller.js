const firmInquiryTagsRepository = require('../../db/supabase/repositories/firm-inquiry-tags.repository');
const { AppError } = require('../../middlewares/error.middleware');
const { requireUserFirmId, parseEntityId } = require('../../utils/contabil-scope');

const HEX_COLOR = /^#([0-9A-Fa-f]{6})$/;

exports.list = async (req, res, next) => {
  try {
    const firmId = requireUserFirmId(req);
    const items = await firmInquiryTagsRepository.listByFirm(firmId);
    return res.json({ items });
  } catch (err) {
    return next(err);
  }
};

exports.create = async (req, res, next) => {
  try {
    const firmId = requireUserFirmId(req);
    const name = String(req.body?.name || '').trim();
    const colorHex = String(req.body?.colorHex || '#0F2942').trim();
    if (!name || name.length > 60) throw new AppError('Nome da etiqueta inválido', 400);
    if (!HEX_COLOR.test(colorHex)) throw new AppError('Cor inválida (use #RRGGBB)', 400);
    const tag = await firmInquiryTagsRepository.createRow({ firmId, name, colorHex });
    return res.status(201).json({ tag });
  } catch (err) {
    if (err?.code === '23505') return next(new AppError('Já existe uma etiqueta com este nome', 409));
    return next(err);
  }
};

exports.patch = async (req, res, next) => {
  try {
    const firmId = requireUserFirmId(req);
    const id = parseEntityId(req.params.id, 'id');
    const existing = await firmInquiryTagsRepository.findByIdForFirm(id, firmId);
    if (!existing) throw new AppError('Etiqueta não encontrada', 404);
    const patch = {};
    if (req.body?.name != null) {
      const name = String(req.body.name).trim();
      if (!name || name.length > 60) throw new AppError('Nome da etiqueta inválido', 400);
      patch.name = name;
    }
    if (req.body?.colorHex != null) {
      const colorHex = String(req.body.colorHex).trim();
      if (!HEX_COLOR.test(colorHex)) throw new AppError('Cor inválida (use #RRGGBB)', 400);
      patch.colorHex = colorHex;
    }
    const tag = await firmInquiryTagsRepository.updateRow(id, firmId, patch);
    return res.json({ tag });
  } catch (err) {
    if (err?.code === '23505') return next(new AppError('Já existe uma etiqueta com este nome', 409));
    return next(err);
  }
};

exports.remove = async (req, res, next) => {
  try {
    const firmId = requireUserFirmId(req);
    const id = parseEntityId(req.params.id, 'id');
    const existing = await firmInquiryTagsRepository.findByIdForFirm(id, firmId);
    if (!existing) throw new AppError('Etiqueta não encontrada', 404);
    await firmInquiryTagsRepository.removeRow(id, firmId);
    return res.json({ ok: true });
  } catch (err) {
    return next(err);
  }
};
