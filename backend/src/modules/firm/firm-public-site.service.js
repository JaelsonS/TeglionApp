const crypto = require('crypto');
const { AppError } = require('../../middlewares/error.middleware');
const firmsRepository = require('../../db/supabase/repositories/firms.repository');
const firmUsersRepository = require('../../db/supabase/repositories/firm-users.repository');
const firmPublicSitesRepository = require('../../db/supabase/repositories/firm-public-sites.repository');
const accountingServicesRepository = require('../../db/supabase/repositories/accounting-services.repository');
const contabilStorage = require('../../services/storage/contabil-storage.service');

const SECTION_TYPES = new Set([
  'header', 'hero', 'about', 'services', 'bookingServices', 'features', 'process', 'faq', 'contact', 'footer',
]);
const CTA_TYPES = new Set(['booking', 'whatsapp', 'service-detail', 'contact-form', 'external-url', 'phone']);
const SOCIAL_LINK_KEYS = ['instagram', 'facebook', 'linkedin', 'whatsapp', 'website'];
const MAX_SECTIONS = 20;
const MAX_ITEMS = 30;
const MAX_IMAGES_PER_SLOT = 10;
const HEX_RE = /^#[0-9a-f]{6}$/i;
const PREVIEW_TOKEN_TTL_HOURS = 24;
const PUBLIC_SITE_IMAGE_SIGNED_TTL = 86400; // 24h, mesmo padrão do logótipo/capa de notícia
const IMAGE_SLOTS = new Set(['hero', 'institutional']);

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

function normalizeHttpsUrlOrNull(value) {
  if (value == null) return null;
  const trimmed = String(value).trim();
  if (!trimmed) return null;
  if (!/^https:\/\//i.test(trimmed)) return null;
  return trimmed.slice(0, 500);
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
    const url = raw.target?.url ? String(raw.target.url).trim() : '';
    if (/^https:\/\//i.test(url)) target.url = url.slice(0, 500);
  }
  if (type === 'phone') {
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

function normalizeHeroImageFit(value) {
  return value === 'contain' ? 'contain' : 'cover';
}

function normalizeHeroImagePosition(value) {
  return value === 'top' || value === 'bottom' || value === 'center' ? value : 'center';
}

function normalizeSectionContent(type, raw) {
  const content = raw && typeof raw === 'object' ? raw : {};
  switch (type) {
    case 'hero':
      return {
        title: content.title ? String(content.title).trim().slice(0, 120) : '',
        tagline: content.tagline ? String(content.tagline).trim().slice(0, 160) : '',
        bio: content.bio ? String(content.bio).trim().slice(0, 2000) : '',
        imageIds: Array.isArray(content.imageIds) ? content.imageIds.slice(0, 5).map((id) => String(id).slice(0, 80)) : [],
        ctas: normalizeCtas(content.ctas),
        backgroundColor: normalizeOptionalHex(content.backgroundColor),
        titleColor: normalizeOptionalHex(content.titleColor),
        taglineColor: normalizeOptionalHex(content.taglineColor),
        bioColor: normalizeOptionalHex(content.bioColor),
        imageFit: normalizeHeroImageFit(content.imageFit),
        imagePosition: normalizeHeroImagePosition(content.imagePosition),
      };
    case 'about':
      return {
        heading: content.heading ? String(content.heading).trim().slice(0, 160) : '',
        body: content.body ? String(content.body).trim().slice(0, 4000) : '',
        imageIds: Array.isArray(content.imageIds) ? content.imageIds.slice(0, 5).map((id) => String(id).slice(0, 80)) : [],
        ctas: normalizeCtas(content.ctas),
        backgroundColor: normalizeOptionalHex(content.backgroundColor),
        headingColor: normalizeOptionalHex(content.headingColor),
        bodyColor: normalizeOptionalHex(content.bodyColor),
      };
    case 'services':
    case 'bookingServices':
      return {
        heading: content.heading ? String(content.heading).trim().slice(0, 160) : '',
        mode: 'auto',
        ctas: normalizeCtas(content.ctas),
        backgroundColor: normalizeOptionalHex(content.backgroundColor),
        headingColor: normalizeOptionalHex(content.headingColor),
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
        backgroundColor: normalizeOptionalHex(content.backgroundColor),
        titleColor: normalizeOptionalHex(content.titleColor),
        textColor: normalizeOptionalHex(content.textColor),
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
        backgroundColor: normalizeOptionalHex(content.backgroundColor),
        titleColor: normalizeOptionalHex(content.titleColor),
        textColor: normalizeOptionalHex(content.textColor),
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
        backgroundColor: normalizeOptionalHex(content.backgroundColor),
        titleColor: normalizeOptionalHex(content.titleColor),
        textColor: normalizeOptionalHex(content.textColor),
      };
    case 'contact':
      return {
        showEmail: content.showEmail !== false,
        showPhone: content.showPhone !== false,
        showAddress: content.showAddress !== false,
        ctas: normalizeCtas(content.ctas),
        backgroundColor: normalizeOptionalHex(content.backgroundColor),
        textColor: normalizeOptionalHex(content.textColor),
      };
    case 'header':
      return {
        title: content.title ? String(content.title).trim().slice(0, 120) : '',
        backgroundColor: normalizeOptionalHex(content.backgroundColor),
        textColor: normalizeOptionalHex(content.textColor),
        showNav: content.showNav !== false,
        showServicesLink: content.showServicesLink !== false,
        showAreasMenu: content.showAreasMenu !== false,
        showContactLink: content.showContactLink !== false,
      };
    case 'footer':
      return {
        backgroundColor: normalizeOptionalHex(content.backgroundColor),
        textColor: normalizeOptionalHex(content.textColor),
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
    { key: generateStableId('sec_'), type: 'services', enabled: true, order: 3, content: { heading: 'Consultorias com agendamento', mode: 'auto' } },
    { key: generateStableId('sec_'), type: 'bookingServices', enabled: true, order: 4, content: { heading: 'Outros serviços', mode: 'auto' } },
    { key: generateStableId('sec_'), type: 'features', enabled: false, order: 5, content: { items: [] } },
    { key: generateStableId('sec_'), type: 'process', enabled: false, order: 6, content: { steps: [] } },
    { key: generateStableId('sec_'), type: 'faq', enabled: true, order: 7, content: { items: [] } },
    { key: generateStableId('sec_'), type: 'contact', enabled: true, order: 8, content: { showEmail: true, showPhone: true, showAddress: true } },
    { key: generateStableId('sec_'), type: 'footer', enabled: true, order: 9, content: { backgroundColor: null, textColor: null } },
  ];
}

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
      logoStorageKey: null,
    },
    images: { hero: [], institutional: [] },
    socialLinks: normalizeSocialLinks(null),
    sections: defaultSections(),
    showPrices: true,
    termsText: null,
    privacyText: null,
    complaintsBookUrl: null,
    complaintsBookLabel: null,
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

/** As imagens só guardam `storageKey` (URLs assinadas expiram, nunca devem
 * ser persistidas) — resolve-se um `url` fresco em cada leitura, mesmo
 * padrão já usado no logótipo (`firm-branding.service.js`). Uma imagem cujo
 * ficheiro tenha sido removido do storage não deve rebentar a leitura do
 * resto da página — cai só essa, com `url: null`. */
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
  return {
    ...config,
    images: {
      hero: await resolveList(config.images?.hero),
      institutional: await resolveList(config.images?.institutional),
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

async function uploadImage(firmId, actorUserId, { slot, file }) {
  await assertOwner(firmId, actorUserId, 'Apenas o dono do escritório pode adicionar imagens.');
  const safeSlot = IMAGE_SLOTS.has(slot) ? slot : 'hero';
  const uploaded = await contabilStorage.uploadPublicSiteImage({ firmId, slot: safeSlot, file });
  const url = await contabilStorage.createSignedDownloadUrl(uploaded.path, PUBLIC_SITE_IMAGE_SIGNED_TTL);
  return { id: generateStableId('img_'), storageKey: uploaded.path, alt: '', url };
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
  const normalized = normalizeSiteConfig(rawConfig);
  const services = await accountingServicesRepository.listByFirm(firmId);
  const config = sanitizeSiteCtasForFirm(normalized, services);
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

  return { published: updated.published, publishedAt: updated.publishedAt };
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
  if (token !== site.previewToken) return false;
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
  resetPublicSite,
  normalizeSiteConfig,
  defaultSiteConfig,
  buildConfigFromLegacySettings,
  isPreviewTokenValid,
  resolveConfigImages,
  sanitizeSiteCtasForFirm,
  filterPublicCtas,
};
