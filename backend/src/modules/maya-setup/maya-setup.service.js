const { AppError } = require('../../middlewares/error.middleware');
const firmsRepository = require('../../db/supabase/repositories/firms.repository');
const firmUsersRepository = require('../../db/supabase/repositories/firm-users.repository');
const mayaSetupSessionsRepository = require('../../db/supabase/repositories/maya-setup-sessions.repository');
const accountingServicesRepository = require('../../db/supabase/repositories/accounting-services.repository');
const firmPublicSitesRepository = require('../../db/supabase/repositories/firm-public-sites.repository');
const entitlementsService = require('../entitlements/entitlements.service');
const firmPublicSiteService = require('../firm/firm-public-site.service');
const accountingServicesService = require('../firm/accounting-services.service');
const bookingService = require('../booking/booking.service');
const securityAudit = require('../../services/audit/security-audit.service');
const { CONSULTING_SERVICES_CATALOG } = require('../../data/consulting-services-catalog');
const { parseProposalV1, CATALOG_KEY_SET } = require('./proposal.schema');
const openaiClient = require('./openai.client');

const ALLOWED_TONES = new Set(['formal', 'friendly']);
const ALLOWED_COUNTRIES = new Set(['PT', 'BR']);

function envPositiveInt(key, fallback) {
  const n = Number(process.env[key]);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : fallback;
}

function parseFreeFirmAllowlist() {
  return String(process.env.MAYA_SETUP_FREE_FIRM_IDS || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

async function assertMayaSetupEntitlement(firmId) {
  const allow = parseFreeFirmAllowlist();
  if (allow.length && allow.includes(String(firmId))) {
    return { allowed: true, source: 'allowlist' };
  }
  const r = await entitlementsService.can(firmId, 'ai');
  if (!r.allowed) {
    throw new AppError('Configuração rápida Maya não disponível no plano actual.', 403, {
      code: 'MAYA_SETUP_NOT_ENTITLED',
    });
  }
  return r;
}

async function assertOwnerActor(firmId, actorUserId) {
  const actor = await firmUsersRepository.findFirmUserById(actorUserId);
  if (!actor || String(actor.firm_id) !== String(firmId) || actor.role !== 'FIRM_OWNER') {
    throw new AppError('Apenas o dono do escritório pode usar a configuração rápida Maya.', 403, {
      code: 'FIRM_OWNER_REQUIRED',
    });
  }
  if (actor.is_active === false) {
    throw new AppError('Conta inactiva.', 403);
  }
  return actor;
}

function normalizeAnswers(raw, firmCountry) {
  const input = raw && typeof raw === 'object' ? raw : {};
  if (input.consentOpenAi !== true) {
    throw new AppError('Confirme o consentimento para processamento via OpenAI.', 400, {
      code: 'MAYA_CONSENT_REQUIRED',
    });
  }
  const countryCode = ALLOWED_COUNTRIES.has(String(input.countryCode || '').toUpperCase())
    ? String(input.countryCode).toUpperCase()
    : String(firmCountry || 'PT').toUpperCase();
  const tone = ALLOWED_TONES.has(String(input.tone)) ? String(input.tone) : 'friendly';
  const specialties = Array.isArray(input.specialties)
    ? input.specialties.map((s) => String(s).trim().slice(0, 80)).filter(Boolean).slice(0, 8)
    : [];
  const catalogKeys = Array.isArray(input.serviceCatalogKeys)
    ? input.serviceCatalogKeys
        .map((k) => String(k).trim())
        .filter((k) => CATALOG_KEY_SET.has(k))
        .slice(0, 12)
    : [];
  const irsCampaign = countryCode === 'PT' && input.irsCampaign === true;
  const cityRegion = String(input.cityRegion || '').trim().slice(0, 120);
  const scheduleHint =
    input.scheduleHint && typeof input.scheduleHint === 'object' ? input.scheduleHint : null;

  return {
    consentOpenAi: true,
    consentVersion: String(input.consentVersion || '1').slice(0, 20),
    countryCode,
    tone,
    specialties,
    serviceCatalogKeys: catalogKeys,
    irsCampaign,
    cityRegion,
    scheduleHint,
  };
}

async function createSession({ firmId, actorUserId, answers }) {
  await assertOwnerActor(firmId, actorUserId);
  await assertMayaSetupEntitlement(firmId);
  const firm = await firmsRepository.findFirmById(firmId);
  if (!firm) throw new AppError('Escritório não encontrado', 404);
  const normalizedAnswers = normalizeAnswers(answers, firm.countryCode);
  const session = await mayaSetupSessionsRepository.createSession({
    firmId,
    createdBy: actorUserId,
    answers: normalizedAnswers,
  });
  await securityAudit.recordSecurityEvent({
    firmId,
    actorRole: 'FIRM_OWNER',
    actorId: actorUserId,
    action: 'maya.setup.session.created',
    entityType: 'MAYA_SETUP_SESSION',
    entityId: session.id,
    metadata: { countryCode: normalizedAnswers.countryCode },
  });
  return { session: sanitizeSessionForClient(session) };
}

function sanitizeSessionForClient(session) {
  return {
    id: session.id,
    status: session.status,
    answers: session.answers,
    proposal: session.proposal,
    appliedAt: session.appliedAt,
    createdAt: session.createdAt,
    updatedAt: session.updatedAt,
  };
}

async function getSession({ firmId, actorUserId, sessionId }) {
  await assertOwnerActor(firmId, actorUserId);
  const session = await mayaSetupSessionsRepository.findByIdForFirm(sessionId, firmId);
  if (!session) throw new AppError('Sessão não encontrada', 404);
  return { session: sanitizeSessionForClient(session) };
}

async function assertGenerateRateLimit(firmId) {
  const max = envPositiveInt('MAYA_SETUP_GENERATE_DAILY_LIMIT', 5);
  const dayStart = new Date();
  dayStart.setUTCHours(0, 0, 0, 0);
  const used = await mayaSetupSessionsRepository.sumGenerateCountToday(firmId, dayStart.toISOString());
  if (used >= max) {
    throw new AppError(
      `Limite diário de gerações atingido (${max}/dia). Tente amanhã ou ajuste as respostas na sessão actual.`,
      429,
      { code: 'MAYA_SETUP_RATE_LIMIT' },
    );
  }
}

async function generateProposal({ firmId, actorUserId, sessionId, req }) {
  await assertOwnerActor(firmId, actorUserId);
  await assertMayaSetupEntitlement(firmId);
  await assertGenerateRateLimit(firmId);

  const session = await mayaSetupSessionsRepository.findByIdForFirm(sessionId, firmId);
  if (!session) throw new AppError('Sessão não encontrada', 404);
  if (session.status === 'applied') {
    throw new AppError('Esta sessão já foi aplicada.', 409, { code: 'MAYA_SETUP_ALREADY_APPLIED' });
  }

  const firm = await firmsRepository.findFirmById(firmId);
  const answers = session.answers || {};
  const countryCode = answers.countryCode || firm.countryCode || 'PT';

  const context = {
    firmName: firm.name,
    firmSlug: firm.slug,
    countryCode,
    cityRegion: answers.cityRegion,
    irsCampaign: answers.irsCampaign,
    answers,
    allowedCatalogKeys: [...CATALOG_KEY_SET],
  };

  const { proposal: rawProposal, requestId } = await openaiClient.generateMayaSetupProposal(context);
  const proposal = parseProposalV1(rawProposal, { countryCode });

  const updated = await mayaSetupSessionsRepository.updateSession(sessionId, firmId, {
    proposal,
    status: 'generated',
    generateCount: (session.generateCount || 0) + 1,
  });

  await securityAudit.recordSecurityEvent({
    firmId,
    actorRole: 'FIRM_OWNER',
    actorId: actorUserId,
    action: 'maya.setup.generate',
    entityType: 'MAYA_SETUP_SESSION',
    entityId: sessionId,
    metadata: {
      openAiRequestId: requestId,
      serviceCount: proposal.services?.length || 0,
      irsTemplates: proposal.irs?.templateIds?.length || 0,
    },
    req,
  });

  return { session: sanitizeSessionForClient(updated) };
}

function mergePublicSitePatch(existingDraft, patch) {
  const base =
    existingDraft && typeof existingDraft === 'object'
      ? JSON.parse(JSON.stringify(existingDraft))
      : firmPublicSiteService.defaultSiteConfig();

  if (patch.seo) {
    base.seo = { ...base.seo, ...patch.seo };
  }
  if (patch.theme) {
    base.theme = { ...base.theme, ...patch.theme };
  }
  if (Array.isArray(patch.sections)) {
    for (const pSec of patch.sections) {
      const type = pSec.type;
      const idx = base.sections.findIndex((s) => s.type === type);
      if (idx < 0) continue;
      base.sections[idx] = {
        ...base.sections[idx],
        enabled: pSec.enabled !== undefined ? pSec.enabled : base.sections[idx].enabled,
        content: {
          ...base.sections[idx].content,
          ...(pSec.content || {}),
        },
      };
    }
  }
  return base;
}

function catalogEntry(catalogKey) {
  return CONSULTING_SERVICES_CATALOG.find((e) => e.catalogKey === catalogKey);
}

async function applyServicesFromProposal(firmId, services) {
  const existingKeys = await accountingServicesRepository.listCatalogKeys(firmId);
  const created = [];
  const skipped = [];

  for (const spec of services || []) {
    const key = spec.catalogKey;
    if (existingKeys.has(key)) {
      skipped.push(key);
      continue;
    }
    const entry = catalogEntry(key);
    if (!entry) continue;
    const { item } = await accountingServicesService.create({
      firmId,
      payload: {
        catalogKey: key,
        name: spec.name || entry.name,
        description: spec.description || entry.description || null,
        durationMinutes: entry.durationMinutes,
        priceCents: entry.priceCents,
        isActive: true,
        isPubliclyListed: false,
        slug: spec.slug || null,
        publicGroup: spec.publicGroup || entry.category || null,
        requiresBooking: entry.requiresBooking === true,
        documentRequirements: entry.documentRequirements,
        intakeForm: entry.intakeForm,
      },
    });
    existingKeys.add(key);
    created.push(item);
  }
  return { created, skipped };
}

async function applyIrsFromProposal(firmId, irs, countryCode) {
  if (String(countryCode).toUpperCase() !== 'PT' || !irs?.activateCampaign) {
    return { activated: [] };
  }
  const keys = Array.isArray(irs.templateIds) ? irs.templateIds.filter(Boolean) : [];
  if (!keys.length) return { activated: [] };
  const { items } = await accountingServicesService.activateFromCatalog({ firmId, catalogKeys: keys });
  return { activated: items };
}

async function applyBookingFromProposal(firmId, booking) {
  if (!booking) return null;
  const schedule = booking.defaultSchedule || {};
  const weekdays = Object.keys(schedule)
    .map(Number)
    .filter((d) => Number.isInteger(d) && d >= 0 && d <= 6)
    .sort((a, b) => a - b);
  let dayStart = '09:00';
  let dayEnd = '17:00';
  const firstDay = weekdays[0];
  const firstIntervals = schedule[firstDay] || schedule[String(firstDay)];
  if (Array.isArray(firstIntervals) && firstIntervals[0]) {
    dayStart = firstIntervals[0].start || dayStart;
    dayEnd = firstIntervals[firstIntervals.length - 1].end || dayEnd;
  }
  return bookingService.updateBookingSettings(firmId, {
    timezone: booking.timezone,
    schedule,
    weekdays: weekdays.length ? weekdays : [1, 2, 3, 4, 5],
    dayStart,
    dayEnd,
  });
}

async function applyProposal({ firmId, actorUserId, sessionId, req }) {
  await assertOwnerActor(firmId, actorUserId);
  await assertMayaSetupEntitlement(firmId);

  const session = await mayaSetupSessionsRepository.findByIdForFirm(sessionId, firmId);
  if (!session) throw new AppError('Sessão não encontrada', 404);
  if (session.status === 'applied' && session.appliedAt) {
    return {
      session: sanitizeSessionForClient(session),
      idempotent: true,
      applySummary: session.proposal?.applySummary || null,
    };
  }
  if (!session.proposal) {
    throw new AppError('Gere uma proposta antes de aplicar.', 400, { code: 'MAYA_SETUP_NO_PROPOSAL' });
  }

  const firm = await firmsRepository.findFirmById(firmId);
  const countryCode = session.answers?.countryCode || firm.countryCode || 'PT';
  const proposal = parseProposalV1(session.proposal, { countryCode });

  const siteRow = await firmPublicSitesRepository.findByFirmId(firmId);
  const mergedDraft = mergePublicSitePatch(siteRow?.draft, proposal.publicSitePatch || {});
  const draftResult = await firmPublicSiteService.saveDraft(firmId, actorUserId, mergedDraft);

  const servicesResult = await applyServicesFromProposal(firmId, proposal.services);
  const irsResult = await applyIrsFromProposal(firmId, proposal.irs, countryCode);
  const bookingResult = await applyBookingFromProposal(firmId, proposal.booking);

  const applySummary = {
    draftUpdated: true,
    servicesCreated: servicesResult.created.length,
    servicesSkippedExisting: servicesResult.skipped,
    irsActivated: irsResult.activated.length,
    bookingUpdated: Boolean(bookingResult),
  };

  const proposalWithSummary = { ...proposal, applySummary };
  const updated = await mayaSetupSessionsRepository.updateSession(sessionId, firmId, {
    status: 'applied',
    proposal: proposalWithSummary,
    appliedAt: new Date().toISOString(),
    appliedBy: actorUserId,
  });

  await securityAudit.recordSecurityEvent({
    firmId,
    actorRole: 'FIRM_OWNER',
    actorId: actorUserId,
    action: 'maya.setup.apply',
    entityType: 'MAYA_SETUP_SESSION',
    entityId: sessionId,
    metadata: applySummary,
    req,
  });

  return {
    session: sanitizeSessionForClient(updated),
    draft: draftResult.draft,
    applySummary,
    idempotent: false,
  };
}

module.exports = {
  createSession,
  getSession,
  generateProposal,
  applyProposal,
  normalizeAnswers,
  mergePublicSitePatch,
  assertOwnerActor,
  assertMayaSetupEntitlement,
};
