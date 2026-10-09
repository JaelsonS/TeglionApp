/**
 * MayaSetupProposalV1 — validação estrita antes de gravar qualquer proposta OpenAI.
 */
const { AppError } = require('../../middlewares/error.middleware');
const { CONSULTING_SERVICES_CATALOG } = require('../../data/consulting-services-catalog');
const { BOOKING_TIMEZONES } = require('../booking/booking.service');

const CATALOG_KEY_SET = new Set(CONSULTING_SERVICES_CATALOG.map((e) => e.catalogKey));
const IRS_CATALOG_PREFIX = 'irs-';
const SECTION_TYPES = new Set([
  'header', 'hero', 'about', 'services', 'bookingServices', 'features', 'process', 'faq', 'contact', 'footer',
]);
const HEX_RE = /^#[0-9a-f]{6}$/i;

function normalizeHexColor(value) {
  if (value == null) return null;
  const s = String(value).trim();
  if (HEX_RE.test(s)) return s.toLowerCase();
  if (/^[0-9a-f]{6}$/i.test(s)) return `#${s.toLowerCase()}`;
  return null;
}
const TIME_RE = /^\d{1,2}:\d{2}$/;
const TZ_SET = new Set(BOOKING_TIMEZONES);

function trimStr(v, max) {
  if (v == null) return null;
  const s = String(v).trim();
  if (!s) return null;
  return s.slice(0, max);
}

function parseProposalV1(raw, { countryCode = 'PT' } = {}) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    throw new AppError('Proposta inválida — formato incorrecto.', 502, { code: 'MAYA_PROPOSAL_INVALID' });
  }

  const publicSitePatch = parsePublicSitePatch(raw.publicSitePatch);
  const services = parseServices(raw.services, countryCode);
  const irs = parseIrs(raw.irs, countryCode);
  const booking = parseBooking(raw.booking, countryCode);
  const rationale = trimStr(raw.rationale, 800);

  return {
    version: 1,
    publicSitePatch,
    services,
    irs,
    booking,
    ...(rationale ? { rationale } : {}),
  };
}

function parsePublicSitePatch(raw) {
  if (raw == null) return {};
  if (typeof raw !== 'object' || Array.isArray(raw)) {
    throw new AppError('publicSitePatch inválido', 502, { code: 'MAYA_PROPOSAL_INVALID' });
  }
  const out = {};
  if (raw.seo && typeof raw.seo === 'object') {
    out.seo = {
      title: trimStr(raw.seo.title, 70),
      description: trimStr(raw.seo.description, 200),
    };
  }
  if (raw.theme && typeof raw.theme === 'object') {
    const theme = {};
    for (const key of [
      'primaryColor',
      'secondaryColor',
      'textColor',
      'backgroundColor',
      'surfaceColor',
      'mutedTextColor',
    ]) {
      if (raw.theme[key] == null) continue;
      const c = normalizeHexColor(raw.theme[key]);
      if (!c) continue;
      theme[key] = c;
    }
    if (Object.keys(theme).length) out.theme = theme;
  }
  if (Array.isArray(raw.sections)) {
    out.sections = raw.sections
      .slice(0, 12)
      .map((s) => {
        const type = String(s?.type || '');
        if (!SECTION_TYPES.has(type)) return null;
        const content = s?.content && typeof s.content === 'object' ? s.content : {};
        const safeContent = {};
        if (content.title != null) safeContent.title = trimStr(content.title, 120) || '';
        if (content.tagline != null) safeContent.tagline = trimStr(content.tagline, 160) || '';
        if (content.bio != null) safeContent.bio = trimStr(content.bio, 2000) || '';
        if (content.heading != null) safeContent.heading = trimStr(content.heading, 160) || '';
        if (content.body != null) safeContent.body = trimStr(content.body, 4000) || '';
        if (Array.isArray(content.items)) {
          safeContent.items = content.items.slice(0, 12).map((it) => ({
            title: trimStr(it?.title, 120) || '',
            description: trimStr(it?.description, 400) || '',
            question: trimStr(it?.question, 200) || '',
            answer: trimStr(it?.answer, 2000) || '',
          })).filter((it) => it.title || it.question);
        }
        if (Array.isArray(content.steps)) {
          safeContent.steps = content.steps.slice(0, 10).map((st) => ({
            title: trimStr(st?.title, 120) || '',
            description: trimStr(st?.description, 400) || '',
          })).filter((st) => st.title);
        }
        return {
          type,
          enabled: s.enabled !== false,
          content: safeContent,
        };
      })
      .filter(Boolean);
  }
  return out;
}

function parseServices(raw, countryCode) {
  if (!Array.isArray(raw)) {
    throw new AppError('services deve ser uma lista', 502, { code: 'MAYA_PROPOSAL_INVALID' });
  }
  const cc = String(countryCode || 'PT').toUpperCase();
  return raw.slice(0, 12).map((item) => {
    const catalogKey = trimStr(item?.catalogKey || item?.templateKey, 80);
    if (!catalogKey || !CATALOG_KEY_SET.has(catalogKey)) {
      throw new AppError(`catalogKey desconhecido: ${catalogKey || '(vazio)'}`, 502, {
        code: 'MAYA_PROPOSAL_INVALID',
      });
    }
    if (cc === 'BR' && (catalogKey === 'irs-modelo-3' || catalogKey.startsWith(IRS_CATALOG_PREFIX))) {
      throw new AppError('Templates IRS não aplicáveis a escritórios BR', 502, {
        code: 'MAYA_PROPOSAL_INVALID',
      });
    }
    return {
      catalogKey,
      name: trimStr(item?.name, 200),
      slug: item?.slug != null ? trimStr(item.slug, 80) : null,
      publicGroup: trimStr(item?.publicGroup, 80),
      description: trimStr(item?.description, 4000),
    };
  });
}

function parseIrs(raw, countryCode) {
  const cc = String(countryCode || 'PT').toUpperCase();
  if (cc !== 'PT') {
    return { activateCampaign: false, templateIds: [] };
  }
  if (!raw || typeof raw !== 'object') {
    return { activateCampaign: false, templateIds: [] };
  }
  const activateCampaign = raw.activateCampaign === true;
  const templateIds = Array.isArray(raw.templateIds)
    ? raw.templateIds
        .map((id) => trimStr(id, 80))
        .filter((id) => id && CATALOG_KEY_SET.has(id) && id.startsWith(IRS_CATALOG_PREFIX))
        .slice(0, 8)
    : [];
  return { activateCampaign, templateIds };
}

function parseBooking(raw, countryCode) {
  if (!raw || typeof raw !== 'object') return null;
  const cc = String(countryCode || 'PT').toUpperCase();
  let timezone = trimStr(raw.timezone, 64);
  if (!timezone || !TZ_SET.has(timezone)) {
    timezone = cc === 'BR' ? 'UTC' : 'Europe/Lisbon';
  }
  const defaultSchedule = {};
  const sched = raw.defaultSchedule && typeof raw.defaultSchedule === 'object' ? raw.defaultSchedule : {};
  for (let d = 1; d <= 5; d += 1) {
    const intervals = sched[d] ?? sched[String(d)];
    if (!Array.isArray(intervals)) continue;
    const normalized = intervals
      .slice(0, 4)
      .map((iv) => {
        if (!iv || typeof iv !== 'object') return null;
        if (!TIME_RE.test(iv.start) || !TIME_RE.test(iv.end)) return null;
        return { start: iv.start, end: iv.end };
      })
      .filter(Boolean);
    if (normalized.length) defaultSchedule[d] = normalized;
  }
  if (!Object.keys(defaultSchedule).length) {
    defaultSchedule[1] = [{ start: '09:00', end: '13:00' }];
    defaultSchedule[2] = [{ start: '09:00', end: '13:00' }];
    defaultSchedule[3] = [{ start: '09:00', end: '13:00' }];
    defaultSchedule[4] = [{ start: '09:00', end: '13:00' }];
    defaultSchedule[5] = [{ start: '09:00', end: '13:00' }];
  }
  return { timezone, defaultSchedule };
}

/** JSON Schema (subset) para structured outputs OpenAI. */
/**
 * OpenAI devolve JSON variável — alinhar ao questionário antes de enrich/parse estrito.
 */
function coerceOpenAiProposal(raw, { countryCode = 'PT', answers = {} } = {}) {
  const base = raw && typeof raw === 'object' && !Array.isArray(raw) ? raw : {};
  const cc = String(countryCode || 'PT').toUpperCase();
  const selectedKeys = Array.isArray(answers.serviceCatalogKeys)
    ? answers.serviceCatalogKeys.filter((k) => CATALOG_KEY_SET.has(String(k)))
    : [];

  let publicSitePatch =
    base.publicSitePatch && typeof base.publicSitePatch === 'object' && !Array.isArray(base.publicSitePatch)
      ? { ...base.publicSitePatch }
      : {};
  if (publicSitePatch.theme && typeof publicSitePatch.theme === 'object') {
    const theme = { ...publicSitePatch.theme };
    for (const key of Object.keys(theme)) {
      const norm = normalizeHexColor(theme[key]);
      if (norm) theme[key] = norm;
      else delete theme[key];
    }
    publicSitePatch.theme = theme;
  }

  let services = [];
  if (selectedKeys.length) {
    services = (Array.isArray(base.services) ? base.services : [])
      .map((item) => {
        const catalogKey = trimStr(item?.catalogKey || item?.templateKey, 80);
        if (!catalogKey || !CATALOG_KEY_SET.has(catalogKey)) return null;
        if (cc === 'BR' && (catalogKey === 'irs-modelo-3' || catalogKey.startsWith(IRS_CATALOG_PREFIX))) return null;
        if (!selectedKeys.includes(catalogKey)) return null;
        return {
          catalogKey,
          name: item?.name,
          slug: item?.slug,
          publicGroup: item?.publicGroup,
          description: item?.description,
        };
      })
      .filter(Boolean);
    if (!services.length) {
      services = selectedKeys.map((catalogKey) => ({ catalogKey }));
    }
  }

  return {
    publicSitePatch,
    services,
    irs: base.irs && typeof base.irs === 'object' ? base.irs : { activateCampaign: false, templateIds: [] },
    booking: base.booking && typeof base.booking === 'object' ? base.booking : null,
    rationale: base.rationale,
  };
}

function openAiJsonSchema() {
  return {
    type: 'object',
    additionalProperties: false,
    required: ['publicSitePatch', 'services', 'irs', 'booking'],
    properties: {
      publicSitePatch: { type: 'object' },
      services: { type: 'array', items: { type: 'object' } },
      irs: { type: 'object' },
      booking: { type: 'object' },
      rationale: { type: 'string' },
    },
  };
}

module.exports = {
  parseProposalV1,
  coerceOpenAiProposal,
  normalizeHexColor,
  openAiJsonSchema,
  CATALOG_KEY_SET,
};
