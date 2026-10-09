/**
 * Imagens enviadas no wizard (já no storage) — referências seguras para merge no rascunho.
 */
const { CATALOG_KEY_SET } = require('./proposal.schema');

const IMG_ID_RE = /^img_[a-zA-Z0-9_-]{8,64}$/;
const STORAGE_KEY_RE = /^[a-zA-Z0-9/_.-]{8,300}$/;
const SERVICE_STORAGE_RE = /^firm\/[a-zA-Z0-9_-]+\/services\/images\/[a-zA-Z0-9._-]+$/;

function parseMediaAssetRef(raw) {
  if (!raw || typeof raw !== 'object') return null;
  const id = String(raw.id || '').trim();
  const storageKey = String(raw.storageKey || '').trim();
  if (!IMG_ID_RE.test(id) || !STORAGE_KEY_RE.test(storageKey)) return null;
  const alt = String(raw.alt || '').trim().slice(0, 200);
  return { id, storageKey, alt };
}

function parseServiceImageStorageKey(raw) {
  if (raw == null) return null;
  if (typeof raw === 'string') {
    const key = raw.trim();
    return SERVICE_STORAGE_RE.test(key) ? key : null;
  }
  if (typeof raw === 'object') {
    const key = String(raw.storageKey || '').trim();
    if (SERVICE_STORAGE_RE.test(key)) return key;
    const ref = parseMediaAssetRef(raw);
    if (ref && SERVICE_STORAGE_RE.test(ref.storageKey)) return ref.storageKey;
  }
  return null;
}

const CUSTOM_SERVICE_KEY_RE = /^custom:[0-9]+$/;

function parseServiceImages(raw) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return {};
  const out = {};
  for (const [serviceKey, val] of Object.entries(raw)) {
    const allowed = CATALOG_KEY_SET.has(serviceKey) || CUSTOM_SERVICE_KEY_RE.test(String(serviceKey));
    if (!allowed) continue;
    const storageKey = parseServiceImageStorageKey(val);
    if (storageKey) out[serviceKey] = storageKey;
    if (Object.keys(out).length >= 12) break;
  }
  return out;
}

function parseMediaAssets(raw) {
  if (!raw || typeof raw !== 'object') return null;
  const heroImage = parseMediaAssetRef(raw.heroImage);
  const aboutImage = parseMediaAssetRef(raw.aboutImage);
  const logoUploaded = raw.logoUploaded === true;
  const prepareServicesForPublicPage = raw.prepareServicesForPublicPage === true;
  const serviceImages = parseServiceImages(raw.serviceImages);
  const includeDemoClients = raw.includeDemoClients === true;
  if (
    !heroImage &&
    !aboutImage &&
    !logoUploaded &&
    !prepareServicesForPublicPage &&
    !includeDemoClients &&
    !Object.keys(serviceImages).length
  ) {
    return null;
  }
  return {
    ...(logoUploaded ? { logoUploaded: true } : {}),
    ...(heroImage ? { heroImage } : {}),
    ...(aboutImage ? { aboutImage } : {}),
    ...(prepareServicesForPublicPage ? { prepareServicesForPublicPage: true } : {}),
    ...(includeDemoClients ? { includeDemoClients: true } : {}),
    ...(Object.keys(serviceImages).length ? { serviceImages } : {}),
  };
}

function mergeMediaAssetsIntoDraft(draft, mediaAssets) {
  if (!draft || typeof draft !== 'object' || !mediaAssets) return draft;
  const base = JSON.parse(JSON.stringify(draft));
  if (!base.images || typeof base.images !== 'object') {
    base.images = { hero: [], institutional: [], bySection: {} };
  }
  if (!Array.isArray(base.images.hero)) base.images.hero = [];
  if (!Array.isArray(base.images.institutional)) base.images.institutional = [];

  const upsertImage = (list, ref) => {
    if (!ref) return;
    const idx = list.findIndex((i) => i.id === ref.id);
    const row = { id: ref.id, storageKey: ref.storageKey, alt: ref.alt || '' };
    if (idx >= 0) list[idx] = row;
    else list.push(row);
  };

  upsertImage(base.images.hero, mediaAssets.heroImage);
  upsertImage(base.images.institutional, mediaAssets.aboutImage);

  if (Array.isArray(base.sections)) {
    base.sections = base.sections.map((sec) => {
      if (sec.type === 'hero' && mediaAssets.heroImage && sec.content && typeof sec.content === 'object') {
        return {
          ...sec,
          enabled: sec.enabled !== false,
          content: {
            ...sec.content,
            imageIds: [mediaAssets.heroImage.id],
            showImage: true,
          },
        };
      }
      if (sec.type === 'about' && mediaAssets.aboutImage && sec.content && typeof sec.content === 'object') {
        return {
          ...sec,
          content: {
            ...sec.content,
            imageIds: [mediaAssets.aboutImage.id],
            showImage: true,
          },
        };
      }
      return sec;
    });
  }

  return base;
}

module.exports = {
  parseMediaAssets,
  mergeMediaAssetsIntoDraft,
  parseMediaAssetRef,
  parseServiceImages,
};
