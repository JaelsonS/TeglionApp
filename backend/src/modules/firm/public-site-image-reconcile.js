/**
 * Garante que imageIds referenciados nas secções existem em images.hero / institutional / bySection.
 * Evita destaque sem foto quando o pool hero é truncado (MAX) mas imageIds aponta para a imagem mais recente.
 */

const MAX_IMAGES_PER_SLOT = 10;

function collectReferencedImageIds(config) {
  const ordered = [];
  const seen = new Set();
  const push = (id) => {
    const s = String(id || '').trim();
    if (!s || seen.has(s)) return;
    seen.add(s);
    ordered.push(s);
  };

  for (const section of config?.sections || []) {
    const content = section?.content;
    if (!content || typeof content !== 'object') continue;
    if (Array.isArray(content.imageIds)) {
      for (const id of content.imageIds) push(id);
    }
    push(content.backgroundImageId);
  }
  if (config?.seo?.ogImage?.id) push(config.seo.ogImage.id);
  return ordered;
}

function imageMapFromLists(...lists) {
  const map = new Map();
  for (const list of lists) {
    for (const img of list || []) {
      if (!img || typeof img !== 'object') continue;
      const id = String(img.id || '').trim();
      const storageKey = String(img.storageKey || '').trim();
      if (!id || !storageKey) continue;
      map.set(id, { id, storageKey, alt: img.alt ? String(img.alt).trim().slice(0, 200) : '' });
    }
  }
  return map;
}

function prioritizeImageList(incomingList, previousList, referencedIds, max) {
  const byId = imageMapFromLists(previousList, incomingList);
  const ordered = [];
  const seen = new Set();

  for (const id of referencedIds) {
    if (byId.has(id) && !seen.has(id)) {
      ordered.push(byId.get(id));
      seen.add(id);
    }
  }
  for (const img of incomingList || []) {
    const id = String(img?.id || '').trim();
    if (id && byId.has(id) && !seen.has(id)) {
      ordered.push(byId.get(id));
      seen.add(id);
    }
  }
  for (const img of previousList || []) {
    const id = String(img?.id || '').trim();
    if (id && byId.has(id) && !seen.has(id)) {
      ordered.push(byId.get(id));
      seen.add(id);
    }
  }
  return ordered.slice(0, max);
}

function findInPools(images, imageId) {
  const id = String(imageId || '').trim();
  if (!id || !images) return null;
  const pools = [
    ...(images.hero || []),
    ...(images.institutional || []),
    ...Object.values(images.bySection || {}).flat(),
  ];
  return pools.find((img) => img && img.id === id) || null;
}

function repairHeroImageReferences(config) {
  const hero = (config.sections || []).find((s) => s.type === 'hero');
  if (!hero?.content || typeof hero.content !== 'object') return config;
  const ids = Array.isArray(hero.content.imageIds) ? hero.content.imageIds.map(String) : [];
  const primary = ids[0]?.trim();
  if (!primary) return config;

  if (findInPools(config.images, primary)) return config;

  const heroPool = config.images?.hero || [];
  const fallback = heroPool.length ? heroPool[heroPool.length - 1] : null;
  if (fallback?.id) {
    hero.content.imageIds = [
      fallback.id,
      ...ids.slice(1).filter((id) => findInPools(config.images, id)),
    ];
  } else {
    hero.content.imageIds = ids.slice(1).filter((id) => findInPools(config.images, id));
  }
  return config;
}

/**
 * @param {object} incoming — config já normalizado (sem urls persistidas)
 * @param {object|null} previous — draft ou published anterior na BD
 */
function reconcilePublicSiteImages(incoming, previous) {
  if (!incoming?.images) return incoming;
  const referenced = collectReferencedImageIds(incoming);
  const prevImages = previous?.images || {};

  const bySection = { ...(incoming.images.bySection || {}) };
  const prevBySection = prevImages.bySection || {};
  for (const key of new Set([...Object.keys(bySection), ...Object.keys(prevBySection)])) {
    const sectionRefs = referenced.filter((id) => {
      const inIncoming = (bySection[key] || []).some((img) => img?.id === id);
      const inPrev = (prevBySection[key] || []).some((img) => img?.id === id);
      return inIncoming || inPrev;
    });
    bySection[key] = prioritizeImageList(
      bySection[key],
      prevBySection[key],
      sectionRefs.length ? sectionRefs : referenced,
      MAX_IMAGES_PER_SLOT,
    );
  }

  const next = {
    ...incoming,
    images: {
      hero: prioritizeImageList(
        incoming.images.hero,
        prevImages.hero,
        referenced,
        MAX_IMAGES_PER_SLOT,
      ),
      institutional: prioritizeImageList(
        incoming.images.institutional,
        prevImages.institutional,
        referenced,
        MAX_IMAGES_PER_SLOT,
      ),
      bySection,
    },
  };
  return repairHeroImageReferences(next);
}

/** Mescla imagens do payload bruto com as da BD (storageKey) antes de normalizar. */
function mergeRawConfigImages(raw, previous) {
  if (!raw || typeof raw !== 'object' || !previous?.images) return raw;
  const referenced = collectReferencedImageIds(raw);

  const mergeList = (incoming, prev) =>
    prioritizeImageList(incoming, prev, referenced, MAX_IMAGES_PER_SLOT);

  const bySection = { ...(raw.images?.bySection || {}) };
  const prevBy = previous.images.bySection || {};
  for (const key of new Set([...Object.keys(bySection), ...Object.keys(prevBy)])) {
    bySection[key] = mergeList(bySection[key], prevBy[key]);
  }

  return {
    ...raw,
    images: {
      hero: mergeList(raw.images?.hero, previous.images.hero),
      institutional: mergeList(raw.images?.institutional, previous.images.institutional),
      bySection,
    },
  };
}

module.exports = {
  collectReferencedImageIds,
  reconcilePublicSiteImages,
  mergeRawConfigImages,
  repairHeroImageReferences,
  findInPools,
};
