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
const accountingServiceGroupsRepository = require('../../db/supabase/repositories/accounting-service-groups.repository');
const bookingService = require('../booking/booking.service');
const serviceInquiriesService = require('../firm/service-inquiries.service');
const firmBrandingService = require('../firm/firm-branding.service');
const firmPublicSiteService = require('../firm/firm-public-site.service');
const accountingServicesService = require('../firm/accounting-services.service');
const entitlements = require('../entitlements/entitlements.service');
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

async function mapPublicServiceSummary(s, groupNameById, { options = [] } = {}) {
  const enriched = await accountingServicesService.enrichService(s, groupNameById);
  const publicOptions = options
    .filter((o) => o.isActive !== false && o.isPubliclyListed && o.slug)
    .map((o) => ({
      slug: o.slug,
      name: interpolateServiceTemplate(o.name),
      description: null,
      durationMinutes: o.durationMinutes,
      priceCents: o.priceCents,
      priceTaxMode: o.priceTaxMode || null,
      requiresBooking: o.requiresBooking === true,
    }));
  const fromPriceCents =
    publicOptions.length > 0
      ? Math.min(...publicOptions.map((o) => Number(o.priceCents) || 0))
      : enriched.priceCents;
  return {
    slug: enriched.slug,
    name: interpolateServiceTemplate(enriched.name),
    description: interpolateServiceTemplate(enriched.description) || null,
    durationMinutes: enriched.durationMinutes,
    priceCents: enriched.priceCents,
    priceTaxMode: enriched.priceTaxMode || null,
    requiresBooking: enriched.requiresBooking === true,
    publicGroup: enriched.publicGroup || null,
    paymentRequired: enriched.paymentRequired === true,
    imageUrl: enriched.imageUrl || null,
    imageOriginalUrl: enriched.imageOriginalUrl || null,
    imageFocusX: enriched.imageFocusX,
    imageFocusY: enriched.imageFocusY,
    imageZoom: enriched.imageZoom,
    hasOptions: publicOptions.length > 0,
    fromPriceCents: publicOptions.length > 0 ? fromPriceCents : null,
    options: publicOptions.length > 0 ? publicOptions : undefined,
  };
}

/**
 * Catálogo público de topo: serviços publicados, excepto opções de ofertas
 * também publicadas (evita poluição — a opção aparece dentro da oferta).
 */
async function listPublicCatalogServices(firmId) {
  const [services, groupNameById] = await Promise.all([
    accountingServicesRepository.listByFirm(firmId, { activeOnly: true }),
    resolveGroupNameMap(firmId),
  ]);
  const withOptions = await accountingServicesService.attachOptionsToServices(firmId, services);
  const optionChildIds = new Set();
  for (const s of withOptions) {
    if (s.isPubliclyListed && s.slug && (s.options || []).length > 0) {
      for (const opt of s.options) optionChildIds.add(opt.id);
    }
  }
  const items = [];
  for (const s of withOptions) {
    if (!s.isPubliclyListed || !s.slug) continue;
    if (optionChildIds.has(s.id)) continue;
    items.push(await mapPublicServiceSummary(s, groupNameById, { options: s.options || [] }));
  }
  return items;
}

async function resolveGroupNameMap(firmId) {
  const groups = await accountingServiceGroupsRepository.listByFirm(firmId);
  // F-05: um grupo desactivado não pode continuar a aparecer como cabeçalho
  // público só porque "visível publicamente" ficou marcado — as duas flags
  // são independentes na UI de gestão, mas para o visitante público o grupo
  // só existe quando as duas são verdadeiras.
  return new Map(groups.filter((g) => g.isPubliclyListed && g.isActive).map((g) => [g.id, g.name]));
}

function assertValid(req) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new AppError('Parâmetros inválidos', 400, { errors: errors.array() });
  }
}

/** Nome nas redes / página pública; fallback para o nome interno do escritório. */
function resolvePublicFirmName(firm) {
  const display = firm?.settings?.publicProfile?.displayName;
  const trimmed = display != null ? String(display).trim() : '';
  return trimmed || firm.name;
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

    const items = await listPublicCatalogServices(firm.id);

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
      firmName: resolvePublicFirmName(firm),
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

    const items = await listPublicCatalogServices(firm.id);

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

    // storageKey contém firmId no path — nunca expor no JSON público (só url assinada).
    const publicImages = {
      hero: (config.images?.hero || []).map((img) => ({
        id: img.id || null,
        alt: img.alt || '',
        url: img.url || null,
      })),
      institutional: (config.images?.institutional || []).map((img) => ({
        id: img.id || null,
        alt: img.alt || '',
        url: img.url || null,
      })),
    };

    const showTeglionCredit = await entitlements.showTeglionBranding(firm.id);

    const publicSlugs = items.map((s) => s.slug).filter(Boolean);
    const publicSections = firmPublicSiteService.filterPublicCtas(config.sections, publicSlugs);

    return res.json({
      firmName: resolvePublicFirmName(firm),
      logoUrl,
      isPreview: previewValid,
      templateKey: site.templateKey || 'default',
      seo: config.seo,
      theme: config.theme,
      images: publicImages,
      socialLinks: config.socialLinks,
      sections: publicSections,
      showPrices: config.showPrices !== false,
      termsText: config.termsText || null,
      privacyText: config.privacyText || null,
      complaintsBookUrl: config.complaintsBookUrl || null,
      complaintsBookLabel: config.complaintsBookLabel || null,
      praiseUrl: config.praiseUrl || null,
      praiseLabel: config.praiseLabel || null,
      praiseContact: config.praiseContact || null,
      showTeglionCredit,
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
    let theme = null;
    try {
      const site = await firmPublicSiteService.getSite(firm.id);
      // Nunca servir draft sem preview token — só published ou legado settings.
      const config = site.published || firmPublicSiteService.buildConfigFromLegacySettings(firm);
      showPrices = config?.showPrices !== false;
      termsText = config?.termsText || null;
      privacyText = config?.privacyText || null;
      theme = config?.theme || null;
    } catch {
      showPrices = true;
    }

    let logoUrl = null;
    try {
      logoUrl = await firmBrandingService.resolveLogoUrl(firm);
    } catch {
      logoUrl = firm.settings?.branding?.logoUrl || null;
    }

    const showFirmLogo = service.intakeForm?.pageOptions?.showFirmLogo !== false;
    const showTeglionCredit = await entitlements.showTeglionBranding(firm.id);

    const withOptions = await accountingServicesService.attachOptionsToServices(firm.id, [service]);
    const optionSummaries = (withOptions[0]?.options || [])
      .filter((o) => o.isActive !== false && o.isPubliclyListed && o.slug)
      .map((o) => ({
        slug: o.slug,
        name: interpolateServiceTemplate(o.name),
        durationMinutes: o.durationMinutes,
        priceCents: o.priceCents,
        priceTaxMode: o.priceTaxMode || null,
        requiresBooking: o.requiresBooking === true,
      }));

    return res.json({
      firmName: resolvePublicFirmName(firm),
      logoUrl: showFirmLogo ? logoUrl : null,
      showFirmLogo,
      showTeglionCredit,
      serviceName: interpolateServiceTemplate(service.name),
      description: interpolateServiceTemplate(service.description) || null,
      imageUrl: (await accountingServicesService.resolveServiceImageUrl(service.imageStorageKey || service.imageUrl)) || null,
      imageOriginalUrl: (await accountingServicesService.resolveServiceImageUrl(service.imageOriginalUrl)) || null,
      imageFocusX: service.imageFocusX,
      imageFocusY: service.imageFocusY,
      imageZoom: service.imageZoom,
      intakeForm: service.intakeForm || { questions: [] },
      requiresBooking: service.requiresBooking === true,
      intakeStartMode: service.requiresBooking && service.intakeStartMode === 'calendar' ? 'calendar' : 'form',
      paymentRequired: service.paymentRequired === true,
      priceCents: service.priceCents,
      priceTaxMode: service.priceTaxMode || null,
      showPrices,
      termsText,
      privacyText,
      theme,
      hasOptions: optionSummaries.length > 0,
      options: optionSummaries,
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

async function holdPublicSlot(req, res, next) {
  try {
    assertValid(req);
    if (req.body?.website) {
      return res.status(201).json({ ok: true, holdToken: 'honeypot', expiresAt: null, scheduledAt: null });
    }
    const { firm, service } = await resolvePublicService(
      String(req.params.firmSlug || '').trim(),
      String(req.params.serviceSlug || '').trim(),
    );
    if (!service.requiresBooking) {
      throw new AppError('Este serviço não tem agendamento', 400);
    }
    if (service.intakeStartMode !== 'calendar') {
      throw new AppError('Este serviço inicia pelo formulário', 400);
    }
    const held = await bookingService.createAnonymousHold({
      firmId: firm.id,
      serviceId: service.id,
      scheduledAt: req.body?.scheduledAt,
    });
    return res.status(201).json({
      ok: true,
      holdToken: held.holdToken,
      expiresAt: held.expiresAt,
      scheduledAt: held.scheduledAt,
    });
  } catch (err) {
    return next(err);
  }
}

async function captureLead(req, res, next) {
  try {
    assertValid(req);
    if (req.body?.website) {
      // `intakeToken` (não accessToken): response-sanitize remove accessToken e
      // partia o fluxo lead→submit, criando solicitações duplicadas.
      return res.status(201).json({ ok: true, intakeToken: 'honeypot' });
    }
    const { accessToken } = await serviceInquiriesService.capturePublicLead({
      firmSlug: String(req.params.firmSlug || '').trim(),
      serviceSlug: String(req.params.serviceSlug || '').trim(),
      payload: req.body || {},
    });
    return res.status(201).json({ ok: true, intakeToken: accessToken });
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
    const {
      inquiry,
      requiredDocuments,
      consultation,
      checkoutUrl,
      paymentPublicToken,
      holdExpiresAt,
      paymentRequired,
    } = await serviceInquiriesService.submitPublicIntake({
      firmSlug: String(req.params.firmSlug || '').trim(),
      serviceSlug: String(req.params.serviceSlug || '').trim(),
      payload: req.body || {},
    });
    return res.status(201).json({
      ok: true,
      // Token opaco do portal público — NÃO usar a chave `accessToken` (sanitize).
      intakeToken: inquiry.accessToken,
      documentsRequired: requiredDocuments.length,
      bookingConfirmed: Boolean(consultation) && consultation.status === 'SCHEDULED',
      bookingPendingPayment: Boolean(consultation) && consultation.status === 'PENDING_PAYMENT',
      scheduledAt: consultation?.scheduledAt || null,
      checkoutUrl: checkoutUrl || null,
      paymentPublicToken: paymentPublicToken || null,
      holdExpiresAt: holdExpiresAt || null,
      paymentRequired: Boolean(paymentRequired),
      consultationId: consultation?.id || null,
    });
  } catch (err) {
    return next(err);
  }
}

async function getBookingPaymentStatus(req, res, next) {
  try {
    assertValid(req);
    const connectPaymentsService = require('../connect/connect-payments.service');
    const data = await connectPaymentsService.getPublicPaymentStatus({
      consultationId: String(req.query.c || '').trim(),
      token: String(req.query.t || '').trim(),
    });
    return res.json(data);
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
  body('holdToken').optional({ nullable: true }).isString().trim().isLength({ min: 32, max: 128 }),
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

const holdSlotValidators = [
  param('firmSlug').isString().trim().isLength({ min: 2, max: 64 }),
  param('serviceSlug').isString().trim().isLength({ min: 1, max: 80 }),
  body('scheduledAt').isISO8601(),
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

const bookingPaymentStatusValidators = [
  query('c').isUUID(),
  query('t').isString().trim().isLength({ min: 32, max: 128 }),
];

module.exports = {
  getPublicFirmServices,
  getPublicFirmSite,
  getPublicService,
  getPublicSlots,
  holdPublicSlot,
  captureLead,
  submitIntake,
  getBookingPaymentStatus,
  getByToken,
  uploadByToken,
  submitReply,
  getFirmServicesValidators,
  getFirmSiteValidators,
  getServiceValidators,
  captureLeadValidators,
  submitValidators,
  slotsValidators,
  holdSlotValidators,
  tokenValidators,
  replyValidators,
  bookingPaymentStatusValidators,
};
