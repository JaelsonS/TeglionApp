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

/** Campos de media opcionais partilhados por secções da página pública. */
function normalizeSectionMediaFields(content) {
  const raw = content && typeof content === 'object' ? content : {};
  return {
    showImage: raw.showImage !== false,
    imagePlacement: normalizeImagePlacement(raw.imagePlacement),
    imageSize: normalizeImageSize(raw.imageSize),
    imageFit: normalizeImageFit(raw.imageFit),
    backgroundImageId: raw.backgroundImageId ? String(raw.backgroundImageId).trim().slice(0, 80) : null,
    showBackgroundImage: raw.showBackgroundImage === true,
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
  collectImagePools,
  resolveImageUrlById,
};
