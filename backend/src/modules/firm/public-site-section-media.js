const IMAGE_PLACEMENTS = new Set(['above', 'left', 'right']);
const IMAGE_SIZES = new Set(['sm', 'md', 'lg', 'full']);

function normalizeImagePlacement(value) {
  return IMAGE_PLACEMENTS.has(value) ? value : 'above';
}

function normalizeImageSize(value) {
  return IMAGE_SIZES.has(value) ? value : 'full';
}

function normalizeImageFit(value) {
  return value === 'contain' ? 'contain' : 'cover';
}

function normalizeFocusPercent(value) {
  if (value == null || value === '') return null;
  const n = Number(value);
  if (!Number.isFinite(n)) return null;
  return Math.min(100, Math.max(0, Math.round(n)));
}

function normalizeImageZoom(value) {
  if (value == null || value === '') return null;
  const n = Number(value);
  if (!Number.isFinite(n)) return null;
  return Math.min(3, Math.max(1, Math.round(n * 100) / 100));
}

function normalizeContentAlign(value) {
  if (value === 'left' || value === 'center' || value === 'right') return value;
  return null;
}

/** Campos de media opcionais partilhados por secções da página pública. */
function normalizeSectionMediaFields(content) {
  const raw = content && typeof content === 'object' ? content : {};
  return {
    showImage: raw.showImage !== false,
    imagePlacement: normalizeImagePlacement(raw.imagePlacement),
    imageSize: normalizeImageSize(raw.imageSize),
    imageFit: normalizeImageFit(raw.imageFit),
    imageFocusX: normalizeFocusPercent(raw.imageFocusX),
    imageFocusY: normalizeFocusPercent(raw.imageFocusY),
    imageZoom: normalizeImageZoom(raw.imageZoom),
    backgroundImageId: raw.backgroundImageId ? String(raw.backgroundImageId).trim().slice(0, 80) : null,
    showBackgroundImage: raw.showBackgroundImage === true,
    backgroundImageFocusX: normalizeFocusPercent(raw.backgroundImageFocusX),
    backgroundImageFocusY: normalizeFocusPercent(raw.backgroundImageFocusY),
    backgroundImageZoom: normalizeImageZoom(raw.backgroundImageZoom),
    contentAlign: normalizeContentAlign(raw.contentAlign),
  };
}

function normalizeBySectionImages(raw, normalizeImageRef) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return {};
  const normalize = typeof normalizeImageRef === 'function' ? normalizeImageRef : () => null;
  const out = {};
  for (const [key, list] of Object.entries(raw)) {
    const safeKey = String(key).slice(0, 80);
    if (!safeKey) continue;
    out[safeKey] = Array.isArray(list)
      ? list.slice(0, 10).map((img) => normalize(img)).filter(Boolean)
      : [];
  }
  return out;
}

function collectImagePools(images, sectionKey) {
  const pools = [...(images?.hero || []), ...(images?.institutional || [])];
  if (sectionKey && images?.bySection?.[sectionKey]) {
    pools.push(...images.bySection[sectionKey]);
  }
  return pools;
}

function resolveImageUrlById(imageId, images, sectionKey) {
  const id = String(imageId || '').trim();
  if (!id) return null;
  const found = collectImagePools(images, sectionKey).find((img) => img.id === id);
  return found?.url || null;
}

module.exports = {
  normalizeSectionMediaFields,
  normalizeBySectionImages,
  normalizeImagePlacement,
  normalizeImageSize,
  normalizeImageFit,
  normalizeFocusPercent,
  normalizeImageZoom,
  collectImagePools,
  resolveImageUrlById,
};
