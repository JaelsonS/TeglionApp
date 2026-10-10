const crypto = require('crypto');
const { AppError } = require('../../middlewares/error.middleware');
const firmsRepository = require('../../db/supabase/repositories/firms.repository');
const firmUsersRepository = require('../../db/supabase/repositories/firm-users.repository');
const firmPublicSitesRepository = require('../../db/supabase/repositories/firm-public-sites.repository');
const accountingServicesRepository = require('../../db/supabase/repositories/accounting-services.repository');
const contabilStorage = require('../../services/storage/contabil-storage.service');
const {
  normalizeThemeLogos,
  resolvePublicSiteLogoUrl,
  resolvePublicSiteZoneLogoUrl,
  resolveThemeLogoPreviewUrls,
} = require('./public-site-logo');
const {
  normalizeSectionMediaFields,
  normalizeContentAlign,
  normalizeBySectionImages,
} = require('./public-site-section-media');
const { normalizeHttpsUrlOrNull, coerceExternalHttpsUrlOrNull } = require('../../utils/safe-url');
const {
  mergeRawConfigImages,
  reconcilePublicSiteImages,
  repairHeroImageReferences,
} = require('./public-site-image-reconcile');

const SECTION_TYPES = new Set([
  'header', 'hero', 'about', 'services', 'bookingServices', 'features', 'process', 'faq', 'contact', 'footer',
]);
const CTA_TYPES = new Set(['booking', 'whatsapp', 'service-detail', 'contact-form', 'external-url', 'phone']);
const NAV_LINK_KINDS = new Set(['section', 'areas', 'service', 'external']);
const NAV_SECTION_IDS = new Set([
  'servicos',
  'outros-servicos',
  'contactos',
  'sobre',
  'faq',
  'como-trabalhamos',
  'destaques',
]);
const MAX_NAV_LINKS = 8;
const SOCIAL_LINK_KEYS = ['instagram', 'facebook', 'linkedin', 'whatsapp', 'website'];
const MAX_SECTIONS = 20;
const MAX_ITEMS = 30;
const MAX_IMAGES_PER_SLOT = 10;
const HEX_RE = /^#[0-9a-f]{6}$/i;
const PREVIEW_TOKEN_TTL_HOURS = 24;
const PUBLIC_SITE_IMAGE_SIGNED_TTL = 86400; // 24h, mesmo padrão do logótipo/capa de notícia
const IMAGE_SLOTS = new Set(['hero', 'institutional', 'section']);

function withSectionMedia(base, rawContent) {
  return { ...base, ...normalizeSectionMediaFields(rawContent) };
}

/** Mesmo padrão de `generateStableId()` já usado no intake_form (Fase B/C) e
 * nas FAQs da página pública (v8/hoje): o id nasce no cliente e nunca é
 * re-derivado do conteúdo — isto só cobre chamadas directas à API. */
function generateStableId(prefix) {
  return `${prefix}${crypto.randomUUID()}`;
}

function normalizeHexOrNull(value) {
  if (value == null) return null;
  const trimmed = String(value).trim();
  if (!trimmed) return null;
  if (!HEX_RE.test(trimmed)) throw new AppError('Cor inválida — use o formato hex #rrggbb.', 400);
  return trimmed;
}

function normalizeImageRef(raw) {
  if (!raw || typeof raw !== 'object') return null;
  const storageKey = raw.storageKey ? String(raw.storageKey).trim().slice(0, 300) : '';
  if (!storageKey) return null;
  return {
    id: String(raw.id || generateStableId('img_')).slice(0, 80),
    storageKey,
    alt: raw.alt ? String(raw.alt).trim().slice(0, 200) : '',
  };
}

function normalizeOptionalHex(value) {
  if (value == null) return null;
  const trimmed = String(value).trim();
  if (!trimmed) return null;
  return normalizeHexOrNull(trimmed);
}

function normalizePhoneOrNull(value) {
  if (value == null) return null;
  const trimmed = String(value).trim().slice(0, 24);
  if (!trimmed) return null;
  const digits = trimmed.replace(/\D/g, '');
  if (digits.length < 8 || digits.length > 15) return null;
  return trimmed;
}

function normalizeCtas(raw) {
  return Array.isArray(raw) ? raw.slice(0, 3).map(normalizeCta).filter(Boolean) : [];
}

function normalizeCta(raw) {
  if (!raw || typeof raw !== 'object') return null;
  const type = String(raw?.target?.type || raw?.type || '');
  if (!CTA_TYPES.has(type)) return null;
  const label = raw.label ? String(raw.label).trim().slice(0, 80) : '';
  if (!label) return null;
  const target = { type };
  if (raw.target?.serviceId) target.serviceId = String(raw.target.serviceId).trim().slice(0, 100);
  if (type === 'external-url') {
    const url = coerceExternalHttpsUrlOrNull(raw.target?.url);
    if (url) target.url = url;
  }
  if (type === 'phone' || type === 'whatsapp') {
    const phone = normalizePhoneOrNull(raw.target?.phone);
    if (phone) target.phone = phone;
  }
  return {
    id: String(raw.id || generateStableId('cta_')).slice(0, 80),
    label,
    style: raw.style === 'secondary' ? 'secondary' : 'primary',
    backgroundColor: normalizeOptionalHex(raw.backgroundColor),
    textColor: normalizeOptionalHex(raw.textColor),
    target,
  };
}

function defaultNavLinksFromFlags(content) {
  return [
    {
      id: 'nav_services',
      label: 'Serviços',
      enabled: content.showServicesLink !== false,
      kind: 'section',
      sectionId: 'servicos',
    },
    {
      id: 'nav_areas',
      label: 'Áreas',
      enabled: content.showAreasMenu !== false,
      kind: 'areas',
    },
    {
      id: 'nav_contact',
      label: 'Contactos',
      enabled: content.showContactLink !== false,
      kind: 'section',
      sectionId: 'contactos',
    },
  ];
}

function normalizeNavLink(raw) {
  if (!raw || typeof raw !== 'object') return null;
  const kind = String(raw.kind || '');
  if (!NAV_LINK_KINDS.has(kind)) return null;
  const label = raw.label ? String(raw.label).trim().slice(0, 40) : '';
  if (!label) return null;
  const link = {
    id: String(raw.id || generateStableId('nav_')).slice(0, 80),
    label,
    enabled: raw.enabled !== false,
    kind,
  };
  if (kind === 'section') {
    const sectionId = String(raw.sectionId || 'servicos');
    link.sectionId = NAV_SECTION_IDS.has(sectionId) ? sectionId : 'servicos';
  }
  if (kind === 'external') {
    const url = coerceExternalHttpsUrlOrNull(raw.url);
    if (url) link.url = url;
  }
  if (kind === 'service') {
    const serviceId = raw.serviceId ? String(raw.serviceId).trim().slice(0, 100) : '';
    if (serviceId) link.serviceId = serviceId;
  }
  return link;
}

function normalizeNavLinks(content) {
  if (Array.isArray(content.navLinks) && content.navLinks.length > 0) {
    return content.navLinks.slice(0, MAX_NAV_LINKS).map(normalizeNavLink).filter(Boolean);
  }
  return defaultNavLinksFromFlags(content);
}

function normalizeHeroImageFit(value) {
  return value === 'contain' ? 'contain' : 'cover';
}

const HERO_IMAGE_FOCUS = new Set([
  'top-left', 'top', 'top-right',
  'center-left', 'center', 'center-right',
  'bottom-left', 'bottom', 'bottom-right',
]);

function normalizeHeroImageFocus(value) {
  const v = String(value || '').trim();
  if (HERO_IMAGE_FOCUS.has(v)) return v;
  if (v === 'left') return 'center-left';
  if (v === 'right') return 'center-right';
  if (v === 'top' || v === 'bottom') return v;
  return 'center';
}

function normalizeHeroImagePosition(value) {
  return normalizeHeroImageFocus(value);
}

function normalizeHeroBackgroundOverlay(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return 42;
  return Math.min(80, Math.max(0, Math.round(n)));
}

function normalizeHeroFocusPercent(value) {
  if (value == null || value === '') return null;
  const n = Number(value);
  if (!Number.isFinite(n)) return null;
  return Math.min(100, Math.max(0, Math.round(n)));
}

function normalizeHeroImageZoom(value) {
  if (value == null || value === '') return null;
  const n = Number(value);
  if (!Number.isFinite(n)) return null;
  return Math.min(3, Math.max(1, Math.round(n * 100) / 100));
}

/** Preserva quebras de linha (Enter no editor); limita linhas e comprimento total. */
function normalizeMultilineText(value, maxLen, { maxLines = 6 } = {}) {
  if (value == null || value === '') return '';
  const normalized = String(value)
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .trim();
  if (!normalized) return '';
  const lines = normalized
    .split('\n')
    .slice(0, maxLines)
    .map((line) => line.trimEnd());
  return lines.join('\n').slice(0, maxLen);
}

function normalizeSectionContent(type, raw) {
  const content = raw && typeof raw === 'object' ? raw : {};
  switch (type) {
    case 'hero':
      return withSectionMedia(
        {
          title: normalizeMultilineText(content.title, 120, { maxLines: 5 }),
          tagline: normalizeMultilineText(content.tagline, 160, { maxLines: 3 }),
          bio: content.bio ? String(content.bio).trim().slice(0, 2000) : '',
          imageIds: Array.isArray(content.imageIds) ? content.imageIds.slice(0, 5).map((id) => String(id).slice(0, 80)) : [],
          ctas: normalizeCtas(content.ctas),
          backgroundColor: normalizeOptionalHex(content.backgroundColor),
          titleColor: normalizeOptionalHex(content.titleColor),
          taglineColor: normalizeOptionalHex(content.taglineColor),
          bioColor: normalizeOptionalHex(content.bioColor),
          imageFit: normalizeHeroImageFit(content.imageFit),
          imagePosition: normalizeHeroImageFocus(content.imagePosition),
          imageFocusX: normalizeHeroFocusPercent(content.imageFocusX),
          imageFocusY: normalizeHeroFocusPercent(content.imageFocusY),
          imageZoom: normalizeHeroImageZoom(content.imageZoom),
          backgroundOverlay: normalizeHeroBackgroundOverlay(content.backgroundOverlay),
          showLogo: content.showLogo !== false,
        },
        content,
      );
    case 'about':
      return withSectionMedia(
        {
          heading: content.heading ? String(content.heading).trim().slice(0, 160) : '',
          body: content.body ? String(content.body).trim().slice(0, 4000) : '',
          imageIds: Array.isArray(content.imageIds) ? content.imageIds.slice(0, 5).map((id) => String(id).slice(0, 80)) : [],
          ctas: normalizeCtas(content.ctas),
          backgroundColor: normalizeOptionalHex(content.backgroundColor),
          headingColor: normalizeOptionalHex(content.headingColor),
          bodyColor: normalizeOptionalHex(content.bodyColor),
        },
        content,
      );
    case 'services':
    case 'bookingServices':
      return withSectionMedia(
        {
          heading: content.heading ? String(content.heading).trim().slice(0, 160) : '',
          mode: 'auto',
          imageIds: Array.isArray(content.imageIds) ? content.imageIds.slice(0, 5).map((id) => String(id).slice(0, 80)) : [],
          ctas: normalizeCtas(content.ctas),
          backgroundColor: normalizeOptionalHex(content.backgroundColor),
          headingColor: normalizeOptionalHex(content.headingColor),
          featuredHeading: content.featuredHeading ? String(content.featuredHeading).trim().slice(0, 80) : '',
          catalogHeading: content.catalogHeading ? String(content.catalogHeading).trim().slice(0, 80) : '',
          featuredServiceSlugs: Array.isArray(content.featuredServiceSlugs)
            ? content.featuredServiceSlugs
                .slice(0, 12)
                .map((slug) => String(slug || '').trim())
                .filter(Boolean)
            : [],
        },
        content,
      );
    case 'features':
      return withSectionMedia(
        {
          items: Array.isArray(content.items)
            ? content.items
                .slice(0, 12)
                .map((it) => ({
                  id: String(it?.id || generateStableId('feat_')).slice(0, 80),
                  title: String(it?.title || '').trim().slice(0, 120),
                  description: String(it?.description || '').trim().slice(0, 400),
                }))
                .filter((it) => it.title)
            : [],
          imageIds: Array.isArray(content.imageIds) ? content.imageIds.slice(0, 5).map((id) => String(id).slice(0, 80)) : [],
          backgroundColor: normalizeOptionalHex(content.backgroundColor),
          titleColor: normalizeOptionalHex(content.titleColor),
          textColor: normalizeOptionalHex(content.textColor),
        },
        content,
      );
    case 'process':
      return withSectionMedia(
        {
          steps: Array.isArray(content.steps)
            ? content.steps
                .slice(0, 10)
                .map((s) => ({
                  id: String(s?.id || generateStableId('step_')).slice(0, 80),
                  title: String(s?.title || '').trim().slice(0, 120),
                  description: String(s?.description || '').trim().slice(0, 400),
                }))
                .filter((s) => s.title)
            : [],
          imageIds: Array.isArray(content.imageIds) ? content.imageIds.slice(0, 5).map((id) => String(id).slice(0, 80)) : [],
          backgroundColor: normalizeOptionalHex(content.backgroundColor),
          titleColor: normalizeOptionalHex(content.titleColor),
          textColor: normalizeOptionalHex(content.textColor),
        },
        content,
      );
    case 'faq':
      return withSectionMedia(
        {
          items: Array.isArray(content.items)
            ? content.items
                .slice(0, MAX_ITEMS)
                .map((f) => ({
                  id: String(f?.id || generateStableId('faq_')).slice(0, 80),
                  question: String(f?.question || '').trim().slice(0, 200),
                  answer: String(f?.answer || '').trim().slice(0, 2000),
                }))
                .filter((f) => f.question && f.answer)
            : [],
          imageIds: Array.isArray(content.imageIds) ? content.imageIds.slice(0, 5).map((id) => String(id).slice(0, 80)) : [],
          backgroundColor: normalizeOptionalHex(content.backgroundColor),
          titleColor: normalizeOptionalHex(content.titleColor),
          textColor: normalizeOptionalHex(content.textColor),
        },
        content,
      );
    case 'contact':
      return withSectionMedia(
        {
          showEmail: content.showEmail !== false,
          showPhone: content.showPhone !== false,
          showAddress: content.showAddress !== false,
          imageIds: Array.isArray(content.imageIds) ? content.imageIds.slice(0, 5).map((id) => String(id).slice(0, 80)) : [],
          ctas: normalizeCtas(content.ctas),
          backgroundColor: normalizeOptionalHex(content.backgroundColor),
          textColor: normalizeOptionalHex(content.textColor),
        },
        content,
      );
    case 'header': {
      const navLinks = normalizeNavLinks(content);
      return {
        title: normalizeMultilineText(content.title, 120, { maxLines: 4 }),
        backgroundColor: normalizeOptionalHex(content.backgroundColor),
        textColor: normalizeOptionalHex(content.textColor),
        showNav: content.showNav !== false,
        navLinks,
        showServicesLink: navLinks.some((l) => l.enabled && l.kind === 'section' && l.sectionId === 'servicos'),
        showAreasMenu: navLinks.some((l) => l.enabled && l.kind === 'areas'),
        showContactLink: navLinks.some((l) => l.enabled && l.kind === 'section' && l.sectionId === 'contactos'),
        showLogo: content.showLogo !== false,
        contentAlign: normalizeContentAlign(content.contentAlign),
      };
    }
    case 'footer':
      return {
        backgroundColor: normalizeOptionalHex(content.backgroundColor),
        textColor: normalizeOptionalHex(content.textColor),
        // Contactos próprios do rodapé — independentes de firms.settings.contact.
        // String vazia / ausente = herdar Escritório na renderização pública.
        email: content.email != null ? String(content.email).trim().slice(0, 200) || null : null,
        phone: content.phone != null ? String(content.phone).trim().slice(0, 40) || null : null,
        address: content.address != null ? String(content.address).trim().slice(0, 300) || null : null,
        contentAlign: normalizeContentAlign(content.contentAlign),
      };
    default:
      return {};
  }
}

function normalizeSections(rawSections) {
  const source = Array.isArray(rawSections) && rawSections.length > 0 ? rawSections : defaultSections();
  return source
    .slice(0, MAX_SECTIONS)
    .map((s, index) => {
      const type = SECTION_TYPES.has(s?.type) ? s.type : null;
      if (!type) return null;
      return {
        key: String(s?.key || generateStableId('sec_')).slice(0, 80),
        type,
        enabled: s?.enabled !== false,
        order: Number.isFinite(s?.order) ? s.order : index,
        // Secções criadas pela contabilista — as de modelo (false/ausente) não se apagam.
        custom: s?.custom === true,
        content: normalizeSectionContent(type, s?.content),
      };
    })
    .filter(Boolean);
}

function normalizeSocialLinks(raw) {
  const input = raw && typeof raw === 'object' ? raw : {};
  const out = {};
  for (const key of SOCIAL_LINK_KEYS) {
    const value = input[key];
    if (value == null) {
      out[key] = null;
      continue;
    }
    let trimmed = String(value).trim().slice(0, 300);
    if (!trimmed) {
      out[key] = null;
      continue;
    }
    // WhatsApp: aceita só o número (ex. 351912345678) e normaliza para wa.me.
    if (key === 'whatsapp') {
      const digits = trimmed.replace(/\D/g, '');
      if (/^https?:\/\/wa\.me\//i.test(trimmed)) {
        out[key] = trimmed;
      } else if (digits.length >= 8 && digits.length <= 15) {
        out[key] = `https://wa.me/${digits}`;
      } else if (/^https:\/\//i.test(trimmed)) {
        out[key] = trimmed;
      } else {
        out[key] = null;
      }
      continue;
    }
    // Redes: se veio só o handle, prefixa o URL base.
    if (!/^https?:\/\//i.test(trimmed)) {
      const handle = trimmed.replace(/^@/, '').replace(/^\/+/, '');
      if (!handle) {
        out[key] = null;
        continue;
      }
      if (key === 'instagram') trimmed = `https://instagram.com/${handle}`;
      else if (key === 'facebook') trimmed = `https://facebook.com/${handle}`;
      else if (key === 'linkedin') trimmed = `https://linkedin.com/company/${handle}`;
      else if (key === 'website') trimmed = `https://${handle}`;
    }
    out[key] = trimmed.slice(0, 300) || null;
  }
  return out;
}

/**
 * Esqueleto de secções para um escritório sem nenhuma configuração ainda —
 * mesma ordem/estrutura pedida no brief (Header→Hero→About→Services→
 * BookingServices→Features→Process→FAQ→Contact→Footer). Features/About/
 * Process começam desligadas: a maioria dos escritórios não vai preencher
 * isto no dia 1, e uma secção vazia e "ligada" pareceria um site incompleto.
 */
function defaultSections() {
  return [
    { key: generateStableId('sec_'), type: 'header', enabled: true, order: 0, content: { title: '', backgroundColor: null, textColor: null } },
    { key: generateStableId('sec_'), type: 'hero', enabled: true, order: 1, content: { title: '', tagline: '', bio: '', imageIds: [], ctas: [] } },
    { key: generateStableId('sec_'), type: 'about', enabled: false, order: 2, content: { heading: '', body: '', imageIds: [] } },
    { key: generateStableId('sec_'), type: 'services', enabled: true, order: 3, content: { heading: '', mode: 'auto' } },
    { key: generateStableId('sec_'), type: 'bookingServices', enabled: true, order: 4, content: { heading: '', mode: 'auto' } },
    { key: generateStableId('sec_'), type: 'features', enabled: false, order: 5, content: { items: [] } },
    { key: generateStableId('sec_'), type: 'process', enabled: false, order: 6, content: { steps: [] } },
    { key: generateStableId('sec_'), type: 'faq', enabled: true, order: 7, content: { items: [] } },
    { key: generateStableId('sec_'), type: 'contact', enabled: true, order: 8, content: { showEmail: true, showPhone: true, showAddress: true } },
    { key: generateStableId('sec_'), type: 'footer', enabled: true, order: 9, content: { backgroundColor: null, textColor: null } },
  ];
}

const {
  DEFAULT_COMPLAINTS_BOOK_URL,
  DEFAULT_COMPLAINTS_BOOK_LABEL,
  DEFAULT_TERMS_TEMPLATE,
  DEFAULT_PRIVACY_TEMPLATE,
} = require('./public-site-legal-templates');
const {
  evaluatePublicSiteLegalGaps,
  parseLegalPublishAcknowledgement,
} = require('./public-site-legal-compliance');
const activityService = require('../../services/activity/activity.service');

function defaultSiteConfig() {
  return {
    schemaVersion: 1,
    seo: { title: null, description: null, ogImage: null },
    theme: {
      primaryColor: null,
      secondaryColor: null,
      textColor: null,
      backgroundColor: null,
      surfaceColor: null,
      mutedTextColor: null,
      headerLogoSource: 'firm',
      heroLogoSource: 'firm',
      logoStorageKey: null,
      headerLogoStorageKey: null,
      heroLogoStorageKey: null,
    },
    images: { hero: [], institutional: [], bySection: {} },
    socialLinks: normalizeSocialLinks(null),
    sections: defaultSections(),
    showPrices: true,
    termsText: DEFAULT_TERMS_TEMPLATE,
    privacyText: DEFAULT_PRIVACY_TEMPLATE,
    complaintsBookUrl: DEFAULT_COMPLAINTS_BOOK_URL,
    complaintsBookLabel: DEFAULT_COMPLAINTS_BOOK_LABEL,
    praiseUrl: null,
    praiseLabel: null,
    praiseContact: null,
  };
}

/** Config validado/normalizado — aceita o que o editor envia em "Guardar
 * rascunho" e devolve sempre uma forma segura e completa, nunca confiando
 * cegamente no payload do cliente. */
function normalizeSiteConfig(raw) {
  const input = raw && typeof raw === 'object' ? raw : {};
  return {
    schemaVersion: 1,
    seo: {
      title: input.seo?.title ? String(input.seo.title).trim().slice(0, 70) : null,
      description: input.seo?.description ? String(input.seo.description).trim().slice(0, 200) : null,
      ogImage: input.seo?.ogImage ? normalizeImageRef(input.seo.ogImage) : null,
    },
    theme: {
      primaryColor: normalizeHexOrNull(input.theme?.primaryColor),
      secondaryColor: normalizeHexOrNull(input.theme?.secondaryColor),
      textColor: normalizeHexOrNull(input.theme?.textColor),
      backgroundColor: normalizeHexOrNull(input.theme?.backgroundColor),
      surfaceColor: normalizeHexOrNull(input.theme?.surfaceColor),
      mutedTextColor: normalizeHexOrNull(input.theme?.mutedTextColor),
      ...normalizeThemeLogos(input.theme),
    },
    images: {
      hero: Array.isArray(input.images?.hero)
        ? input.images.hero.slice(0, MAX_IMAGES_PER_SLOT).map(normalizeImageRef).filter(Boolean)
        : [],
      institutional: Array.isArray(input.images?.institutional)
        ? input.images.institutional.slice(0, MAX_IMAGES_PER_SLOT).map(normalizeImageRef).filter(Boolean)
        : [],
      bySection: normalizeBySectionImages(input.images?.bySection, normalizeImageRef),
    },
    socialLinks: normalizeSocialLinks(input.socialLinks),
    sections: normalizeSections(input.sections),
    showPrices: input.showPrices !== false,
    termsText: input.termsText != null ? String(input.termsText).trim().slice(0, 50000) || null : null,
    privacyText: input.privacyText != null ? String(input.privacyText).trim().slice(0, 50000) || null : null,
    complaintsBookUrl: normalizeHttpsUrlOrNull(input.complaintsBookUrl),
    complaintsBookLabel: input.complaintsBookLabel != null
      ? String(input.complaintsBookLabel).trim().slice(0, 120) || null
      : null,
    praiseUrl: normalizeHttpsUrlOrNull(input.praiseUrl),
    praiseLabel: input.praiseLabel != null ? String(input.praiseLabel).trim().slice(0, 120) || null : null,
    praiseContact: input.praiseContact != null ? String(input.praiseContact).trim().slice(0, 300) || null : null,
  };
}

/**
 * Traduz `firm.settings.publicProfile`/`branding` (o formato desta sessão,
 * anterior ao v9) para o novo esquema — usado tanto pelo script de backfill
 * como, mais tarde (Fase 2), como fallback ao vivo para um escritório que
 * ainda não tem nenhuma linha em `firm_public_sites`. Nunca perde conteúdo
 * já configurado por um escritório real.
 */
function buildConfigFromLegacySettings(firm) {
  const settings = firm?.settings || {};
  const publicProfile = settings.publicProfile || {};
  const branding = settings.branding || {};
  const config = defaultSiteConfig();

  const hero = config.sections.find((s) => s.type === 'hero');
  hero.content.tagline = publicProfile.tagline || '';
  hero.content.bio = publicProfile.bio || '';

  const faq = config.sections.find((s) => s.type === 'faq');
  faq.content.items = Array.isArray(publicProfile.faqs)
    ? publicProfile.faqs.map((f) => ({
        id: f?.id || generateStableId('faq_'),
        question: f?.question || '',
        answer: f?.answer || '',
      }))
    : [];

  config.theme.primaryColor = branding.primaryColor || null;
  config.theme.secondaryColor = branding.secondaryColor || null;
  config.theme.textColor = branding.textColor || null;
  config.theme.backgroundColor = branding.backgroundColor || null;
  config.theme.surfaceColor = branding.surfaceColor || null;
  config.theme.mutedTextColor = branding.mutedTextColor || null;
  config.theme.headerLogoSource = 'firm';
  config.theme.heroLogoSource = 'firm';
  config.socialLinks = normalizeSocialLinks(publicProfile.socialLinks);

  return config;
}

async function assertOwner(firmId, actorUserId, message) {
  const actor = await firmUsersRepository.findFirmUserById(actorUserId);
  if (!actor || String(actor.firm_id) !== String(firmId) || actor.role !== 'FIRM_OWNER') {
    throw new AppError(message, 403);
  }
}

/** As imagens só guardam `storageKey` (URLs assinadas expiram, nunca devem
 * ser persistidas) — resolve-se um `url` fresco em cada leitura, mesmo
 * padrão já usado no logótipo (`firm-branding.service.js`). Uma imagem cujo
 * ficheiro tenha sido removido do storage não deve rebentar a leitura do
 * resto da página — cai só essa, com `url: null`. */
function findImageUrlById(config, imageId) {
  if (!imageId || !config?.images) return null;
  const id = String(imageId).trim();
  if (!id) return null;
  const pools = [
    ...(config.images.hero || []),
    ...(config.images.institutional || []),
    ...Object.values(config.images.bySection || {}).flat(),
  ];
  const hit = pools.find((img) => img && img.id === id && img.url);
  return hit?.url || null;
}

/**
 * Imagem para partilha social (WhatsApp, etc.): ogImage explícito → destaque/hero →
 * logótipo do site público → logótipo do escritório. Nunca imagem genérica Teglion.
 */
async function resolvePublicShareImageUrl(config, firm) {
  if (!config) return null;

  const ogRef = config.seo?.ogImage;
  if (ogRef && typeof ogRef === 'object') {
    const fromPool = ogRef.id ? findImageUrlById(config, ogRef.id) : null;
    if (fromPool) return fromPool;
    if (ogRef.storageKey) {
      try {
        return await contabilStorage.createSignedDownloadUrl(String(ogRef.storageKey), PUBLIC_SITE_IMAGE_SIGNED_TTL);
      } catch {
        /* ficheiro removido */
      }
    }
  }

  const heroSection = (config.sections || []).find((s) => s.type === 'hero' && s.enabled !== false);
  if (heroSection?.content && typeof heroSection.content === 'object') {
    const bgId = heroSection.content.backgroundImageId;
    if (bgId) {
      const bgUrl = findImageUrlById(config, bgId);
      if (bgUrl) return bgUrl;
    }
    const imageIds = Array.isArray(heroSection.content.imageIds) ? heroSection.content.imageIds : [];
    for (const iid of imageIds) {
      const u = findImageUrlById(config, iid);
      if (u) return u;
    }
  }

  const heroFirst = (config.images?.hero || []).find((img) => img?.url);
  if (heroFirst?.url) return heroFirst.url;

  try {
    const heroLogo = await resolvePublicSiteZoneLogoUrl('hero', config, firm);
    if (heroLogo) return heroLogo;
    const headerLogo = await resolvePublicSiteZoneLogoUrl('header', config, firm);
    if (headerLogo) return headerLogo;
  } catch {
    /* sem logótipo */
  }

  return null;
}

async function resolvePublicShareMeta(config, firm, { firmSlug, publicOrigin }) {
  const firmName = firm?.name || firm?.settings?.publicProfile?.displayName || 'Escritório';
  const title = (config.seo?.title && String(config.seo.title).trim()) || firmName;
  const hero = (config.sections || []).find((s) => s.type === 'hero');
  const bio =
    (config.seo?.description && String(config.seo.description).trim()) ||
    (hero?.content?.bio && String(hero.content.bio).trim().slice(0, 200)) ||
    null;
  const slug = String(firmSlug || '').trim();
  const origin = String(publicOrigin || '').replace(/\/$/, '');
  const path = slug ? `/${encodeURIComponent(slug)}` : '/';
  const pageUrl = origin ? `${origin}${path}` : path;
  const rawImageUrl = await resolvePublicShareImageUrl(config, firm);
  /** URL estável no domínio Teglion — crawlers (WhatsApp) não dependem de links Supabase longos/expirados. */
  const imageUrl =
    rawImageUrl && origin && slug
      ? `${origin}/api/public/firms/${encodeURIComponent(slug)}/share-og-image`
      : rawImageUrl;
  return { title, description: bio, imageUrl, url: pageUrl };
}

async function resolveConfigImages(config) {
  if (!config) return config;
  const resolveList = async (list) =>
    Promise.all(
      (list || []).map(async (img) => {
        try {
          const url = await contabilStorage.createSignedDownloadUrl(img.storageKey, PUBLIC_SITE_IMAGE_SIGNED_TTL);
          return { ...img, url };
        } catch {
          return { ...img, url: null };
        }
      }),
    );
  const bySectionRaw = config.images?.bySection && typeof config.images.bySection === 'object' ? config.images.bySection : {};
  const bySection = {};
  for (const [sectionKey, list] of Object.entries(bySectionRaw)) {
    bySection[sectionKey] = await resolveList(list);
  }
  const logoPreviews = await resolveThemeLogoPreviewUrls(config.theme);
  return {
    ...config,
    theme: {
      ...config.theme,
      ...normalizeThemeLogos(config.theme),
      ...logoPreviews,
    },
    images: {
      hero: await resolveList(config.images?.hero),
      institutional: await resolveList(config.images?.institutional),
      bySection,
    },
  };
}

async function getSite(firmId) {
  const existing = await firmPublicSitesRepository.findByFirmId(firmId);
  if (existing) {
    return {
      ...existing,
      draft: await resolveConfigImages(existing.draft),
      published: existing.published ? await resolveConfigImages(existing.published) : null,
    };
  }
  const firm = await firmsRepository.findFirmById(firmId);
  if (!firm) throw new AppError('Escritório não encontrado', 404);
  return {
    firmId,
    templateKey: 'default',
    schemaVersion: 1,
    draft: buildConfigFromLegacySettings(firm),
    published: null,
    publishedAt: null,
    previewToken: null,
    previewTokenExpiresAt: null,
    draftUpdatedAt: null,
  };
}

async function uploadImage(firmId, actorUserId, { slot, file, sectionKey }) {
  await assertOwner(firmId, actorUserId, 'Apenas o dono do escritório pode adicionar imagens.');
  if (slot === 'section') {
    const key = String(sectionKey || '').trim().slice(0, 80);
    if (!key) throw new AppError('Secção inválida.', 400);
    const uploaded = await contabilStorage.uploadPublicSiteSectionImage({ firmId, sectionKey: key, file });
    const url = await contabilStorage.createSignedDownloadUrl(uploaded.path, PUBLIC_SITE_IMAGE_SIGNED_TTL);
    return { id: generateStableId('img_'), storageKey: uploaded.path, alt: '', url, sectionKey: key };
  }
  const safeSlot = slot === 'institutional' ? 'institutional' : 'hero';
  const uploaded = await contabilStorage.uploadPublicSiteImage({ firmId, slot: safeSlot, file });
  const url = await contabilStorage.createSignedDownloadUrl(uploaded.path, PUBLIC_SITE_IMAGE_SIGNED_TTL);
  return { id: generateStableId('img_'), storageKey: uploaded.path, alt: '', url };
}

async function loadDraftConfigForFirm(firmId) {
  const existing = await firmPublicSitesRepository.findByFirmId(firmId);
  if (existing?.draft) return existing.draft;
  const firm = await firmsRepository.findFirmById(firmId);
  if (!firm) throw new AppError('Escritório não encontrado', 404);
  return buildConfigFromLegacySettings(firm);
}

function normalizeLogoZone(zone) {
  if (zone === 'header' || zone === 'hero') return zone;
  return 'shared';
}

async function uploadPublicLogo(firmId, actorUserId, file, zone = 'shared') {
  await assertOwner(firmId, actorUserId, 'Apenas o dono do escritório pode alterar o logótipo da página pública.');
  const safeZone = normalizeLogoZone(zone);
  const uploaded = await contabilStorage.uploadPublicSiteLogo({ firmId, file, zone: safeZone });
  const logoUrl = await contabilStorage.createSignedDownloadUrl(uploaded.path, PUBLIC_SITE_IMAGE_SIGNED_TTL);
  const base = await loadDraftConfigForFirm(firmId);
  const themePatch =
    safeZone === 'header'
      ? { headerLogoSource: 'custom', headerLogoStorageKey: uploaded.path }
      : safeZone === 'hero'
        ? { heroLogoSource: 'custom', heroLogoStorageKey: uploaded.path }
        : { logoStorageKey: uploaded.path, headerLogoSource: 'custom', heroLogoSource: 'custom' };
  const normalized = normalizeSiteConfig({
    ...base,
    theme: { ...base.theme, ...themePatch },
  });
  const services = await accountingServicesRepository.listByFirm(firmId);
  const config = sanitizeSiteCtasForFirm(normalized, services);
  const saved = await firmPublicSitesRepository.upsertDraft(firmId, config, actorUserId);
  const draft = await resolveConfigImages(saved.draft);
  return { logoStorageKey: uploaded.path, logoUrl, zone: safeZone, draft, draftUpdatedAt: saved.draftUpdatedAt };
}

async function removePublicLogo(firmId, actorUserId, zone = 'shared') {
  await assertOwner(firmId, actorUserId, 'Apenas o dono do escritório pode alterar o logótipo da página pública.');
  const base = await loadDraftConfigForFirm(firmId);
  const safeZone = normalizeLogoZone(zone);
  const themePatch =
    safeZone === 'header'
      ? { headerLogoSource: 'firm', headerLogoStorageKey: null }
      : safeZone === 'hero'
        ? { heroLogoSource: 'firm', heroLogoStorageKey: null }
        : { logoStorageKey: null, headerLogoSource: 'firm', heroLogoSource: 'firm', headerLogoStorageKey: null, heroLogoStorageKey: null };
  const normalized = normalizeSiteConfig({
    ...base,
    theme: { ...base.theme, ...themePatch },
  });
  const services = await accountingServicesRepository.listByFirm(firmId);
  const config = sanitizeSiteCtasForFirm(normalized, services);
  const saved = await firmPublicSitesRepository.upsertDraft(firmId, config, actorUserId);
  const draft = await resolveConfigImages(saved.draft);
  return { draft, draftUpdatedAt: saved.draftUpdatedAt, zone: safeZone };
}

function resolveFirmServiceSlug(ref, services) {
  const value = String(ref || '').trim();
  if (!value) return null;
  const bySlug = services.find((s) => s.slug === value);
  if (bySlug?.slug) return bySlug.slug;
  const byId = services.find((s) => String(s.id) === value);
  return byId?.slug || null;
}

function bindCtaToFirmServices(cta, services) {
  const type = cta?.target?.type;
  if (type !== 'service-detail' && !(type === 'booking' && cta.target?.serviceId)) return cta;
  if (type === 'booking' && !cta.target?.serviceId) return cta;
  const slug = resolveFirmServiceSlug(cta.target.serviceId, services);
  if (!slug) return null;
  return { ...cta, target: { ...cta.target, serviceId: slug } };
}

/** Descarta botões que apontam para serviços de outro escritório; reescreve UUID para slug. */
function sanitizeSiteCtasForFirm(config, services) {
  const list = Array.isArray(services) ? services : [];
  return {
    ...config,
    sections: (config.sections || []).map((section) => {
      if (!Array.isArray(section.content?.ctas)) return section;
      return {
        ...section,
        content: {
          ...section.content,
          ctas: section.content.ctas.map((cta) => bindCtaToFirmServices(cta, list)).filter(Boolean),
        },
      };
    }),
  };
}

function isPublicCtaAllowed(cta, publicSlugs) {
  const type = cta?.target?.type;
  if (type === 'service-detail') {
    return Boolean(cta.target.serviceId) && publicSlugs.has(cta.target.serviceId);
  }
  if (type === 'booking' && cta.target?.serviceId) {
    return publicSlugs.has(cta.target.serviceId);
  }
  return true;
}

/** Remove da resposta pública botões para serviços despublicados / inexistentes. */
function filterPublicCtas(sections, publicSlugs) {
  const allowed = publicSlugs instanceof Set ? publicSlugs : new Set(publicSlugs || []);
  return (sections || []).map((section) => {
    if (!Array.isArray(section.content?.ctas)) return section;
    return {
      ...section,
      content: {
        ...section.content,
        ctas: section.content.ctas.filter((cta) => isPublicCtaAllowed(cta, allowed)),
      },
    };
  });
}

async function saveDraft(firmId, actorUserId, rawConfig) {
  await assertOwner(firmId, actorUserId, 'Apenas o dono do escritório pode editar a página pública.');
  const before = await firmPublicSitesRepository.findByFirmId(firmId);
  const premerged = mergeRawConfigImages(rawConfig, before?.draft);
  const normalized = normalizeSiteConfig(premerged);
  const reconciled = reconcilePublicSiteImages(normalized, before?.draft);
  const services = await accountingServicesRepository.listByFirm(firmId);
  const config = sanitizeSiteCtasForFirm(reconciled, services);
  const updated = await firmPublicSitesRepository.upsertDraft(firmId, config, actorUserId);
  return {
    draft: await resolveConfigImages(updated.draft),
    draftUpdatedAt: updated.draftUpdatedAt,
  };
}

async function publishSite(firmId, actorUserId, { actor, legalPublishAcknowledgement, ipAddress } = {}) {
  await assertOwner(firmId, actorUserId, 'Apenas o dono do escritório pode publicar a página pública.');
  const before = await firmPublicSitesRepository.findByFirmId(firmId);
  if (!before?.draft) throw new AppError('Guarde um rascunho antes de publicar.', 400);

  const legalGaps = evaluatePublicSiteLegalGaps(before.draft);
  const ack = legalPublishAcknowledgement;
  if (legalGaps.length > 0) {
    if (!ack?.accepted) {
      throw new AppError(
        'Confirme a responsabilidade legal do escritório antes de publicar sem Livro de Reclamações ou políticas revistas.',
        400,
        { code: 'LEGAL_ACK_REQUIRED', missingItems: legalGaps },
      );
    }
    const ackSet = new Set(ack.missingItems || []);
    const gapSet = new Set(legalGaps);
    for (const id of legalGaps) {
      if (!ackSet.has(id)) {
        throw new AppError('Confirmação legal incompleta. Tente publicar novamente.', 400, {
          code: 'LEGAL_ACK_MISMATCH',
        });
      }
    }
    for (const id of ackSet) {
      if (!gapSet.has(id)) {
        throw new AppError('Confirmação legal desactualizada. Tente publicar novamente.', 400, {
          code: 'LEGAL_ACK_MISMATCH',
        });
      }
    }
  }

  const updated = await firmPublicSitesRepository.publish(firmId, actorUserId);
  if (!updated) throw new AppError('Guarde um rascunho antes de publicar.', 400);

  // Publicar espelha a identidade visual do rascunho para firm.settings.branding
  // — a mesma chave já lida hoje pelo login do cliente/chrome do portal, para
  // não precisar de um segundo consumidor: passa a actualizar-se atomicamente
  // com a publicação do site, em vez de ficar sempre instantânea como antes.
  // Publicar espelha só a identidade (acentos) para firm.settings.branding —
  // fundo/cartões ficam exclusivos da página pública para não recolorir a app.
  const theme = updated.published?.theme || {};
  if (theme.primaryColor !== undefined || theme.secondaryColor !== undefined || theme.textColor !== undefined) {
    await firmsRepository.updateFirmBranding(firmId, {
      primaryColor: theme.primaryColor ?? null,
      secondaryColor: theme.secondaryColor ?? null,
      textColor: theme.textColor ?? null,
    });
  }

  if (legalGaps.length > 0 && ack?.accepted) {
    void activityService.recordActivity({
      firmId,
      clientId: null,
      actorRole: actor?.role || 'FIRM',
      actorId: actorUserId,
      actorName: actor?.fullName || actor?.name || 'Escritório',
      eventType: 'PUBLIC_SITE_PUBLISH_LEGAL_ACK',
      entityType: 'FIRM_PUBLIC_SITE',
      entityId: firmId,
      title: 'Publicação com aviso legal aceite',
      description:
        'O responsável do escritório aceitou publicar sem completar todos os documentos legais recomendados e assumiu a responsabilidade pelo conteúdo legal da página.',
      metadata: {
        missingItems: legalGaps,
        ipAddress: ipAddress || null,
        productDisclaimer:
          'A Teglion é um produto da AfDigital — Soluções Tecnológicas; não presta aconselhamento jurídico nem responde por omissões legais do escritório.',
      },
      ipAddress: ipAddress || null,
    });
  }

  return {
    published: updated.published ? await resolveConfigImages(updated.published) : null,
    publishedAt: updated.publishedAt,
  };
}

async function regeneratePreviewToken(firmId, actorUserId) {
  await assertOwner(firmId, actorUserId, 'Apenas o dono do escritório pode gerar um link de pré-visualização.');
  const token = crypto.randomBytes(24).toString('hex');
  const expiresAt = new Date(Date.now() + PREVIEW_TOKEN_TTL_HOURS * 60 * 60 * 1000).toISOString();
  const updated = await firmPublicSitesRepository.setPreviewToken(firmId, token, expiresAt);
  return { previewToken: updated.previewToken, previewTokenExpiresAt: updated.previewTokenExpiresAt };
}

/**
 * Um `?preview=<token>` só é válido quando bate exactamente no token gravado
 * E ainda não expirou — qualquer outro caso (sem token, token errado, token
 * expirado) deve cair para `published`, nunca servir `draft` por engano.
 * Extraído do controller público para ficar testável ao nível do serviço,
 * mesma disciplina de todo o resto deste ficheiro (controllers finos, lógica
 * de negócio testada aqui).
 */
function isPreviewTokenValid(site, token) {
  if (!token || !site?.previewToken || !site?.previewTokenExpiresAt) return false;
  const provided = Buffer.from(String(token));
  const expected = Buffer.from(String(site.previewToken));
  if (provided.length !== expected.length || !crypto.timingSafeEqual(provided, expected)) return false;
  return new Date(site.previewTokenExpiresAt) > new Date();
}

/**
 * Apaga a página pública e limpa o perfil legado — o escritório recomeça do zero
 * com um rascunho default (ainda não publicado).
 */
async function resetPublicSite(firmId, actorUserId) {
  const firm = await firmsRepository.findFirmById(firmId);
  if (!firm) throw new AppError('Escritório não encontrado', 404);

  await firmPublicSitesRepository.deleteByFirmId(firmId);

  // Limpa legado que alimentava a página antes do builder
  await firmsRepository.updateFirm(firmId, {
    settingsMerge: {
      publicProfile: {
        tagline: null,
        bio: null,
        socialLinks: {},
        faqs: [],
      },
    },
  });

  const fresh = defaultSiteConfig();
  const saved = await firmPublicSitesRepository.upsertDraft(firmId, fresh, actorUserId);
  return {
    draft: saved.draft,
    published: null,
    publishedAt: null,
    draftUpdatedAt: saved.draftUpdatedAt,
    reset: true,
  };
}

module.exports = {
  getSite,
  saveDraft,
  publishSite,
  regeneratePreviewToken,
  uploadImage,
  uploadPublicLogo,
  removePublicLogo,
  resetPublicSite,
  normalizeSiteConfig,
  defaultSiteConfig,
  buildConfigFromLegacySettings,
  isPreviewTokenValid,
  resolveConfigImages,
  resolvePublicSiteLogoUrl,
  resolvePublicSiteZoneLogoUrl,
  resolvePublicShareImageUrl,
  resolvePublicShareMeta,
  sanitizeSiteCtasForFirm,
  filterPublicCtas,
  repairHeroImageReferences,
  reconcilePublicSiteImages,
};
