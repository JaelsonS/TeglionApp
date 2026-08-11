/**
 * Rotas públicas do "IRS Vertical Slice" — captação de serviço sem login.
 * Ver especificação da sessão (plan file, secção v4) para o racional completo.
 *
 * Disciplina de segurança (igual à de firm-branding-public.controller.js):
 * resolve sempre o Firm pelo slug primeiro, nunca aceita um id cru vindo do
 * pedido, e nunca revela mais do que o necessário (sem ids internos, sem
 * indicar se a identidade bateu num Lead novo/existente ou num Client).
 */
const { param, query, body, validationResult } = require('express-validator');
const { AppError } = require('../../middlewares/error.middleware');
const firmsRepository = require('../../db/supabase/repositories/firms.repository');
const accountingServicesRepository = require('../../db/supabase/repositories/accounting-services.repository');
const bookingService = require('../booking/booking.service');
const serviceInquiriesService = require('../firm/service-inquiries.service');
const { interpolateServiceTemplate } = require('../../utils/service-text-template');

/** Resolve Firm + Service publicado pelo par (firmSlug, serviceSlug) — nunca aceita ids crus. */
async function resolvePublicService(firmSlug, serviceSlug) {
  const firm = await firmsRepository.findFirmBySlugOrLabel(firmSlug);
  if (!firm) throw new AppError('Serviço não encontrado', 404, { code: 'NOT_FOUND' });
  const services = await accountingServicesRepository.listByFirm(firm.id, { activeOnly: true });
  const service = services.find((s) => s.slug === serviceSlug && s.isPubliclyListed);
  if (!service) throw new AppError('Serviço não encontrado', 404, { code: 'NOT_FOUND' });
  return { firm, service };
}

function assertValid(req) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new AppError('Parâmetros inválidos', 400, { errors: errors.array() });
  }
}

/**
 * Página pública unificada — lista todos os serviços publicados do
 * escritório num único link partilhável (`/:firmSlug`), em vez de um link
 * por serviço. Não substitui `/:firmSlug/servicos/:serviceSlug` — os dois
 * convivem: o escritório escolhe qual partilhar, ou os dois.
 */
async function getPublicFirmServices(req, res, next) {
  try {
    assertValid(req);
    const firmSlug = String(req.params.firmSlug || '').trim();
    const firm = await firmsRepository.findFirmBySlugOrLabel(firmSlug);
    if (!firm) throw new AppError('Escritório não encontrado', 404, { code: 'NOT_FOUND' });

    const services = await accountingServicesRepository.listByFirm(firm.id, { activeOnly: true });
    const items = services
      .filter((s) => s.isPubliclyListed && s.slug)
      .map((s) => ({
        slug: s.slug,
        name: interpolateServiceTemplate(s.name),
        description: interpolateServiceTemplate(s.description) || null,
        durationMinutes: s.durationMinutes,
        priceCents: s.priceCents,
        requiresBooking: s.requiresBooking !== false,
      }));

    return res.json({ firmName: firm.name, items });
  } catch (err) {
    return next(err);
  }
}

async function getPublicService(req, res, next) {
  try {
    assertValid(req);
    const { firm, service } = await resolvePublicService(
      String(req.params.firmSlug || '').trim(),
      String(req.params.serviceSlug || '').trim(),
    );

    return res.json({
      firmName: firm.name,
      serviceName: interpolateServiceTemplate(service.name),
      description: interpolateServiceTemplate(service.description) || null,
      intakeForm: service.intakeForm || { questions: [] },
      requiresBooking: service.requiresBooking !== false,
    });
  } catch (err) {
    return next(err);
  }
}

/** Slots disponíveis — reaproveita bookingService.listSlotsForBooking() tal e qual. */
async function getPublicSlots(req, res, next) {
  try {
    assertValid(req);
    const { firm, service } = await resolvePublicService(
      String(req.params.firmSlug || '').trim(),
      String(req.params.serviceSlug || '').trim(),
    );
    if (!service.requiresBooking) {
      return res.json({ slots: [] });
    }
    const now = new Date();
    const fromIso = req.query.from ? String(req.query.from) : now.toISOString();
    const toIso = req.query.to
      ? String(req.query.to)
      : new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000).toISOString();

    const { slots } = await bookingService.listSlotsForBooking({
      firmId: firm.id,
      serviceId: service.id,
      fromIso,
      toIso,
    });
    return res.json({ slots });
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
    const { inquiry, requiredDocuments, consultation } = await serviceInquiriesService.submitPublicIntake({
      firmSlug: String(req.params.firmSlug || '').trim(),
      serviceSlug: String(req.params.serviceSlug || '').trim(),
      payload: req.body || {},
    });
    return res.status(201).json({
      ok: true,
      accessToken: inquiry.accessToken,
      documentsRequired: requiredDocuments.length,
      // Um Lead novo nunca gera consultation (ver submitPublicIntake) — bookingConfirmed=false
      // nesse caso não é um erro, é a distinção real entre "reservado" e "preferência registada"
      // que a interface pública precisa comunicar sem ambiguidade.
      bookingConfirmed: Boolean(consultation),
      scheduledAt: consultation?.scheduledAt || null,
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

async function submitReply(req, res, next) {
  try {
    assertValid(req);
    const result = await serviceInquiriesService.recordTextReply({
      token: String(req.params.token || '').trim(),
      requestId: String(req.params.requestId || '').trim(),
      textReply: req.body?.textReply,
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

const getFirmServicesValidators = [param('firmSlug').isString().trim().isLength({ min: 2, max: 64 })];

const submitValidators = [
  param('firmSlug').isString().trim().isLength({ min: 2, max: 64 }),
  param('serviceSlug').isString().trim().isLength({ min: 1, max: 80 }),
  body('name').isString().trim().isLength({ min: 1, max: 200 }),
  body('email').optional({ nullable: true }).isString().trim().isLength({ max: 200 }),
  body('phone').optional({ nullable: true }).isString().trim().isLength({ max: 40 }),
  body('taxId').optional({ nullable: true }).isString().trim().isLength({ max: 40 }),
  body('scheduledAt').optional({ nullable: true }).isISO8601(),
];

const slotsValidators = [
  param('firmSlug').isString().trim().isLength({ min: 2, max: 64 }),
  param('serviceSlug').isString().trim().isLength({ min: 1, max: 80 }),
  query('from').optional().isISO8601(),
  query('to').optional().isISO8601(),
];

const tokenValidators = [param('token').isString().trim().isLength({ min: 64, max: 128 })];

const replyValidators = [
  param('token').isString().trim().isLength({ min: 64, max: 128 }),
  param('requestId').isUUID(),
  body('textReply').isString().trim().isLength({ min: 1, max: 4000 }),
];

module.exports = {
  getPublicFirmServices,
  getPublicService,
  getPublicSlots,
  submitIntake,
  getByToken,
  uploadByToken,
  submitReply,
  getFirmServicesValidators,
  getServiceValidators,
  submitValidators,
  slotsValidators,
  tokenValidators,
  replyValidators,
};
