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
const firmBrandingService = require('../firm/firm-branding.service');
const firmPublicSiteService = require('../firm/firm-public-site.service');
const accountingServicesService = require('../firm/accounting-services.service');
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

async function mapPublicServiceSummary(s) {
  const enriched = await accountingServicesService.enrichService(s);
  return {
    slug: enriched.slug,
    name: interpolateServiceTemplate(enriched.name),
    description: interpolateServiceTemplate(enriched.description) || null,
    durationMinutes: enriched.durationMinutes,
    priceCents: enriched.priceCents,
    requiresBooking: enriched.requiresBooking !== false,
    imageUrl: enriched.imageUrl || null,
  };
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
    const items = await Promise.all(
      services.filter((s) => s.isPubliclyListed && s.slug).map(mapPublicServiceSummary),
    );

    let logoUrl = null;
    try {
      logoUrl = await firmBrandingService.resolveLogoUrl(firm);
    } catch {
      logoUrl = firm.settings?.branding?.logoUrl || null;
    }
    const branding = firm.settings?.branding || {};
    const publicProfile = firm.settings?.publicProfile || {};
    const contact = firm.settings?.contact || {};

    return res.json({
      firmName: firm.name,
      logoUrl,
      primaryColor: branding.primaryColor || null,
      secondaryColor: branding.secondaryColor || null,
      tagline: publicProfile.tagline || null,
      bio: publicProfile.bio || null,
      socialLinks: publicProfile.socialLinks || {},
      faqs: publicProfile.faqs || [],
      contact: {
        email: contact.email || null,
        phone: contact.phone || null,
        address: contact.address || null,
      },
      items,
    });
  } catch (err) {
    return next(err);
  }
}

/**
 * v9 — Website + Booking Builder (ver plan file da sessão). Página pública
 * completa (secções configuráveis + serviços reais + booking), a substituir
 * `getPublicFirmServices` acima na Fase 4. Serve sempre `published`, excepto
 * quando um `?preview=<token>` válido e não expirado é apresentado — nesse
 * caso serve `draft`, nunca indexável (o frontend aplica noindex). Sem
 * `firm_public_sites.published` ainda (escritório nunca publicou, ou linha
 * nem existe), cai para a tradução ao vivo do settings antigo — nunca uma
 * página em branco.
 */
async function getPublicFirmSite(req, res, next) {
  try {
    assertValid(req);
    const firmSlug = String(req.params.firmSlug || '').trim();
    const firm = await firmsRepository.findFirmBySlugOrLabel(firmSlug);
    if (!firm) throw new AppError('Escritório não encontrado', 404, { code: 'NOT_FOUND' });

    const site = await firmPublicSiteService.getSite(firm.id);
    const previewToken = req.query.preview ? String(req.query.preview).trim() : null;
    const previewValid = firmPublicSiteService.isPreviewTokenValid(site, previewToken);
    const config = previewValid
      ? site.draft
      : site.published || firmPublicSiteService.buildConfigFromLegacySettings(firm);

    const services = await accountingServicesRepository.listByFirm(firm.id, { activeOnly: true });
    const items = await Promise.all(
      services.filter((s) => s.isPubliclyListed && s.slug).map(mapPublicServiceSummary),
    );

    let logoUrl = null;
    try {
      logoUrl = await firmBrandingService.resolveLogoUrl(firm);
    } catch {
      logoUrl = firm.settings?.branding?.logoUrl || null;
    }
    const contact = firm.settings?.contact || {};

    if (previewValid) {
      res.set('X-Robots-Tag', 'noindex');
    }

    return res.json({
      firmName: firm.name,
      logoUrl,
      isPreview: previewValid,
      templateKey: site.templateKey || 'default',
      seo: config.seo,
      theme: config.theme,
      images: config.images,
      socialLinks: config.socialLinks,
      sections: config.sections,
      showPrices: config.showPrices !== false,
      termsText: config.termsText || null,
      privacyText: config.privacyText || null,
      complaintsBookUrl: config.complaintsBookUrl || null,
      complaintsBookLabel: config.complaintsBookLabel || null,
      praiseUrl: config.praiseUrl || null,
      praiseLabel: config.praiseLabel || null,
      praiseContact: config.praiseContact || null,
      contact: {
        email: contact.email || null,
        phone: contact.phone || null,
        address: contact.address || null,
      },
      services: items,
    });
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

    let showPrices = true;
    let termsText = null;
    let privacyText = null;
    try {
      const site = await firmPublicSiteService.getSite(firm.id);
      const config = site.published || site.draft;
      showPrices = config?.showPrices !== false;
      termsText = config?.termsText || null;
      privacyText = config?.privacyText || null;
    } catch {
      showPrices = true;
    }

    return res.json({
      firmName: firm.name,
      serviceName: interpolateServiceTemplate(service.name),
      description: interpolateServiceTemplate(service.description) || null,
      imageUrl: (await accountingServicesService.resolveServiceImageUrl(service.imageStorageKey || service.imageUrl)) || null,
      intakeForm: service.intakeForm || { questions: [] },
      requiresBooking: service.requiresBooking !== false,
      priceCents: service.priceCents,
      showPrices,
      termsText,
      privacyText,
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

async function captureLead(req, res, next) {
  try {
    assertValid(req);
    if (req.body?.website) {
      return res.status(201).json({ ok: true, accessToken: 'honeypot' });
    }
    const { accessToken } = await serviceInquiriesService.capturePublicLead({
      firmSlug: String(req.params.firmSlug || '').trim(),
      serviceSlug: String(req.params.serviceSlug || '').trim(),
      payload: req.body || {},
    });
    return res.status(201).json({ ok: true, accessToken });
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

const getFirmSiteValidators = [
  param('firmSlug').isString().trim().isLength({ min: 2, max: 64 }),
  query('preview').optional().isString().trim().isLength({ min: 1, max: 128 }),
];

const submitValidators = [
  param('firmSlug').isString().trim().isLength({ min: 2, max: 64 }),
  param('serviceSlug').isString().trim().isLength({ min: 1, max: 80 }),
  body('name').isString().trim().isLength({ min: 1, max: 200 }),
  body('email').isString().trim().isLength({ min: 3, max: 200 }),
  body('phone').optional({ nullable: true }).isString().trim().isLength({ max: 40 }),
  body('taxId').optional({ nullable: true }).isString().trim().isLength({ max: 40 }),
  body('scheduledAt').optional({ nullable: true }).isISO8601(),
  body('leadAccessToken').optional({ nullable: true }).isString().trim().isLength({ min: 32, max: 128 }),
];

const captureLeadValidators = [
  param('firmSlug').isString().trim().isLength({ min: 2, max: 64 }),
  param('serviceSlug').isString().trim().isLength({ min: 1, max: 80 }),
  body('name').isString().trim().isLength({ min: 1, max: 200 }),
  body('email').isString().trim().isLength({ min: 3, max: 200 }),
  body('phone').optional({ nullable: true }).isString().trim().isLength({ max: 40 }),
  body('taxId').optional({ nullable: true }).isString().trim().isLength({ max: 40 }),
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
  getPublicFirmSite,
  getPublicService,
  getPublicSlots,
  captureLead,
  submitIntake,
  getByToken,
  uploadByToken,
  submitReply,
  getFirmServicesValidators,
  getFirmSiteValidators,
  getServiceValidators,
  captureLeadValidators,
  submitValidators,
  slotsValidators,
  tokenValidators,
  replyValidators,
};
