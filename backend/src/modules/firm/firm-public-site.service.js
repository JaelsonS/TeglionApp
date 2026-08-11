const crypto = require('crypto');
const { AppError } = require('../../middlewares/error.middleware');
const firmsRepository = require('../../db/supabase/repositories/firms.repository');
const firmUsersRepository = require('../../db/supabase/repositories/firm-users.repository');
const firmPublicSitesRepository = require('../../db/supabase/repositories/firm-public-sites.repository');

const SECTION_TYPES = new Set([
  'header', 'hero', 'about', 'services', 'bookingServices', 'features', 'process', 'faq', 'contact', 'footer',
]);
const CTA_TYPES = new Set(['booking', 'whatsapp', 'service-detail', 'contact-form', 'external-url']);
const SOCIAL_LINK_KEYS = ['instagram', 'facebook', 'linkedin', 'whatsapp', 'website'];
const MAX_SECTIONS = 20;
const MAX_ITEMS = 30;
const MAX_IMAGES_PER_SLOT = 10;
const HEX_RE = /^#[0-9a-f]{6}$/i;
const PREVIEW_TOKEN_TTL_HOURS = 24;

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

function normalizeCta(raw) {
  if (!raw || typeof raw !== 'object') return null;
  const type = String(raw?.target?.type || raw?.type || '');
  if (!CTA_TYPES.has(type)) return null;
  const label = raw.label ? String(raw.label).trim().slice(0, 80) : '';
  if (!label) return null;
  const target = { type };
  if (raw.target?.serviceId) target.serviceId = String(raw.target.serviceId).trim().slice(0, 100);
  if (type === 'external-url') {
    const url = raw.target?.url ? String(raw.target.url).trim() : '';
    if (/^https:\/\//i.test(url)) target.url = url.slice(0, 500);
  }
  return {
    id: String(raw.id || generateStableId('cta_')).slice(0, 80),
    label,
    style: raw.style === 'secondary' ? 'secondary' : 'primary',
    target,
  };
}

function normalizeSectionContent(type, raw) {
  const content = raw && typeof raw === 'object' ? raw : {};
  switch (type) {
    case 'hero':
      return {
        tagline: content.tagline ? String(content.tagline).trim().slice(0, 160) : '',
        bio: content.bio ? String(content.bio).trim().slice(0, 2000) : '',
        imageIds: Array.isArray(content.imageIds) ? content.imageIds.slice(0, 5).map((id) => String(id).slice(0, 80)) : [],
        ctas: Array.isArray(content.ctas) ? content.ctas.slice(0, 3).map(normalizeCta).filter(Boolean) : [],
      };
    case 'about':
      return {
        heading: content.heading ? String(content.heading).trim().slice(0, 160) : '',
        body: content.body ? String(content.body).trim().slice(0, 4000) : '',
        imageIds: Array.isArray(content.imageIds) ? content.imageIds.slice(0, 5).map((id) => String(id).slice(0, 80)) : [],
      };
    case 'services':
    case 'bookingServices':
      return {
        heading: content.heading ? String(content.heading).trim().slice(0, 160) : '',
        mode: 'auto',
      };
    case 'features':
      return {
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
      };
    case 'process':
      return {
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
      };
    case 'faq':
      return {
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
      };
    case 'contact':
      return {
        showEmail: content.showEmail !== false,
        showPhone: content.showPhone !== false,
        showAddress: content.showAddress !== false,
      };
    case 'header':
    case 'footer':
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
    out[key] = value == null ? null : String(value).trim().slice(0, 300) || null;
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
    { key: generateStableId('sec_'), type: 'header', enabled: true, order: 0, content: {} },
    { key: generateStableId('sec_'), type: 'hero', enabled: true, order: 1, content: { tagline: '', bio: '', imageIds: [], ctas: [] } },
    { key: generateStableId('sec_'), type: 'about', enabled: false, order: 2, content: { heading: '', body: '', imageIds: [] } },
    { key: generateStableId('sec_'), type: 'services', enabled: true, order: 3, content: { heading: 'Consultorias com agendamento', mode: 'auto' } },
    { key: generateStableId('sec_'), type: 'bookingServices', enabled: true, order: 4, content: { heading: 'Outros serviços', mode: 'auto' } },
    { key: generateStableId('sec_'), type: 'features', enabled: false, order: 5, content: { items: [] } },
    { key: generateStableId('sec_'), type: 'process', enabled: false, order: 6, content: { steps: [] } },
    { key: generateStableId('sec_'), type: 'faq', enabled: true, order: 7, content: { items: [] } },
    { key: generateStableId('sec_'), type: 'contact', enabled: true, order: 8, content: { showEmail: true, showPhone: true, showAddress: true } },
    { key: generateStableId('sec_'), type: 'footer', enabled: true, order: 9, content: {} },
  ];
}

function defaultSiteConfig() {
  return {
    schemaVersion: 1,
    seo: { title: null, description: null, ogImage: null },
    theme: { primaryColor: null, secondaryColor: null, logoStorageKey: null },
    images: { hero: [], institutional: [] },
    socialLinks: normalizeSocialLinks(null),
    sections: defaultSections(),
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
      logoStorageKey: input.theme?.logoStorageKey ? String(input.theme.logoStorageKey).trim().slice(0, 300) : null,
    },
    images: {
      hero: Array.isArray(input.images?.hero)
        ? input.images.hero.slice(0, MAX_IMAGES_PER_SLOT).map(normalizeImageRef).filter(Boolean)
        : [],
      institutional: Array.isArray(input.images?.institutional)
        ? input.images.institutional.slice(0, MAX_IMAGES_PER_SLOT).map(normalizeImageRef).filter(Boolean)
        : [],
    },
    socialLinks: normalizeSocialLinks(input.socialLinks),
    sections: normalizeSections(input.sections),
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
  config.theme.logoStorageKey = branding.logoStorageKey || null;
  config.socialLinks = normalizeSocialLinks(publicProfile.socialLinks);

  return config;
}

async function assertOwner(firmId, actorUserId, message) {
  const actor = await firmUsersRepository.findFirmUserById(actorUserId);
  if (!actor || String(actor.firm_id) !== String(firmId) || actor.role !== 'FIRM_OWNER') {
    throw new AppError(message, 403);
  }
}

async function getSite(firmId) {
  const existing = await firmPublicSitesRepository.findByFirmId(firmId);
  if (existing) return existing;
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

async function saveDraft(firmId, actorUserId, rawConfig) {
  await assertOwner(firmId, actorUserId, 'Apenas o dono do escritório pode editar a página pública.');
  const config = normalizeSiteConfig(rawConfig);
  const updated = await firmPublicSitesRepository.upsertDraft(firmId, config, actorUserId);
  return { draft: updated.draft, draftUpdatedAt: updated.draftUpdatedAt };
}

async function publishSite(firmId, actorUserId) {
  await assertOwner(firmId, actorUserId, 'Apenas o dono do escritório pode publicar a página pública.');
  const updated = await firmPublicSitesRepository.publish(firmId, actorUserId);
  if (!updated) throw new AppError('Guarde um rascunho antes de publicar.', 400);

  // Publicar espelha a identidade visual do rascunho para firm.settings.branding
  // — a mesma chave já lida hoje pelo login do cliente/chrome do portal, para
  // não precisar de um segundo consumidor: passa a actualizar-se atomicamente
  // com a publicação do site, em vez de ficar sempre instantânea como antes.
  const theme = updated.published?.theme || {};
  if (theme.primaryColor !== undefined || theme.secondaryColor !== undefined) {
    await firmsRepository.updateFirmBranding(firmId, {
      primaryColor: theme.primaryColor ?? null,
      secondaryColor: theme.secondaryColor ?? null,
    });
  }

  return { published: updated.published, publishedAt: updated.publishedAt };
}

async function regeneratePreviewToken(firmId, actorUserId) {
  await assertOwner(firmId, actorUserId, 'Apenas o dono do escritório pode gerar um link de pré-visualização.');
  const token = crypto.randomBytes(24).toString('hex');
  const expiresAt = new Date(Date.now() + PREVIEW_TOKEN_TTL_HOURS * 60 * 60 * 1000).toISOString();
  const updated = await firmPublicSitesRepository.setPreviewToken(firmId, token, expiresAt);
  return { previewToken: updated.previewToken, previewTokenExpiresAt: updated.previewTokenExpiresAt };
}

module.exports = {
  getSite,
  saveDraft,
  publishSite,
  regeneratePreviewToken,
  normalizeSiteConfig,
  defaultSiteConfig,
  buildConfigFromLegacySettings,
};
