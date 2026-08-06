/**
 * Rotas públicas do "IRS Vertical Slice" — captação de serviço sem login.
 * Ver especificação da sessão (plan file, secção v4) para o racional completo.
 *
 * Disciplina de segurança (igual à de firm-branding-public.controller.js):
 * resolve sempre o Firm pelo slug primeiro, nunca aceita um id cru vindo do
 * pedido, e nunca revela mais do que o necessário (sem ids internos, sem
 * indicar se a identidade bateu num Lead novo/existente ou num Client).
 */
const { param, body, validationResult } = require('express-validator');
const { AppError } = require('../../middlewares/error.middleware');
const firmsRepository = require('../../db/supabase/repositories/firms.repository');
const accountingServicesRepository = require('../../db/supabase/repositories/accounting-services.repository');
const serviceInquiriesService = require('../firm/service-inquiries.service');

function assertValid(req) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new AppError('Parâmetros inválidos', 400, { errors: errors.array() });
  }
}

async function getPublicService(req, res, next) {
  try {
    assertValid(req);
    const firm = await firmsRepository.findFirmBySlugOrLabel(String(req.params.firmSlug || '').trim());
    if (!firm) throw new AppError('Serviço não encontrado', 404, { code: 'NOT_FOUND' });

    const services = await accountingServicesRepository.listByFirm(firm.id, { activeOnly: true });
    const service = services.find(
      (s) => s.slug === String(req.params.serviceSlug || '').trim() && s.isPubliclyListed,
    );
    if (!service) throw new AppError('Serviço não encontrado', 404, { code: 'NOT_FOUND' });

    return res.json({
      firmName: firm.name,
      serviceName: service.name,
      description: service.description || null,
      intakeForm: service.intakeForm || { questions: [] },
    });
  } catch (err) {
    return next(err);
  }
}

async function submitIntake(req, res, next) {
  try {
    assertValid(req);
    // Honeypot: campo escondido no formulário público — se vier preenchido, é bot.
    // Responde 201 vazio (não denuncia a deteção) sem gravar nada.
    if (req.body?.website) {
      return res.status(201).json({ ok: true });
    }
    const { inquiry, requiredDocuments } = await serviceInquiriesService.submitPublicIntake({
      firmSlug: String(req.params.firmSlug || '').trim(),
      serviceSlug: String(req.params.serviceSlug || '').trim(),
      payload: req.body || {},
    });
    return res.status(201).json({
      ok: true,
      accessToken: inquiry.accessToken,
      documentsRequired: requiredDocuments.length,
    });
  } catch (err) {
    return next(err);
  }
}

async function getByToken(req, res, next) {
  try {
    assertValid(req);
    const result = await serviceInquiriesService.getByAccessToken(String(req.params.token || '').trim());
    return res.json(result);
  } catch (err) {
    return next(err);
  }
}

async function uploadByToken(req, res, next) {
  try {
    assertValid(req);
    if (!req.file) throw new AppError('Ficheiro obrigatório', 400);
    const tag = String(req.body?.tag || '').trim();
    if (!tag) throw new AppError('tag é obrigatório', 400);
    const result = await serviceInquiriesService.recordDocumentDelivery({
      token: String(req.params.token || '').trim(),
      tag,
      file: req.file,
    });
    return res.status(201).json(result);
  } catch (err) {
    return next(err);
  }
}

const getServiceValidators = [
  param('firmSlug').isString().trim().isLength({ min: 2, max: 64 }),
  param('serviceSlug').isString().trim().isLength({ min: 1, max: 80 }),
];

const submitValidators = [
  param('firmSlug').isString().trim().isLength({ min: 2, max: 64 }),
  param('serviceSlug').isString().trim().isLength({ min: 1, max: 80 }),
  body('name').isString().trim().isLength({ min: 1, max: 200 }),
  body('email').optional({ nullable: true }).isString().trim().isLength({ max: 200 }),
  body('phone').optional({ nullable: true }).isString().trim().isLength({ max: 40 }),
  body('taxId').optional({ nullable: true }).isString().trim().isLength({ max: 40 }),
];

const tokenValidators = [param('token').isString().trim().isLength({ min: 64, max: 128 })];

module.exports = {
  getPublicService,
  submitIntake,
  getByToken,
  uploadByToken,
  getServiceValidators,
  submitValidators,
  tokenValidators,
};
