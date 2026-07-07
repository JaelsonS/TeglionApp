const { AppError } = require('../../middlewares/error.middleware');
const accountingServicesRepository = require('../../db/supabase/repositories/accounting-services.repository');
const { CONSULTING_SERVICES_CATALOG } = require('../../data/consulting-services-catalog');

function parsePriceEuros(payload) {
  if (payload?.priceEuros != null) {
    const priceEuros = Number(payload.priceEuros);
    if (!Number.isFinite(priceEuros) || priceEuros < 0) throw new AppError('Preço inválido', 400);
    return Math.round(priceEuros * 100);
  }
  if (payload?.priceCents != null) {
    const priceCents = Number(payload.priceCents);
    if (!Number.isFinite(priceCents) || priceCents < 0) throw new AppError('Preço inválido', 400);
    return Math.round(priceCents);
  }
  return undefined;
}

async function list({ firmId, activeOnly }) {
  const items = await accountingServicesRepository.listByFirm(firmId, { activeOnly: Boolean(activeOnly) });
  return { items };
}

async function create({ firmId, payload }) {
  const name = String(payload?.name || '').trim();
  if (!name) throw new AppError('Nome do serviço é obrigatório', 400);
  const duration = Number(payload?.durationMinutes);
  if (!Number.isFinite(duration) || duration < 15 || duration > 480) {
    throw new AppError('Duração deve estar entre 15 e 480 minutos', 400);
  }
  const priceCents = parsePriceEuros(payload) ?? 0;
  const item = await accountingServicesRepository.createRow({
    firmId,
    name,
    description: payload?.description,
    durationMinutes: duration,
    priceCents,
    currency: String(payload?.currency || 'EUR').toUpperCase().slice(0, 3),
    sortOrder: payload?.sortOrder != null ? Number(payload.sortOrder) : 0,
    catalogKey: payload?.catalogKey || null,
    isActive: payload?.isActive !== false,
  });
  return { item };
}

async function update({ firmId, id, payload }) {
  const existing = await accountingServicesRepository.findByIdForFirm(id, firmId);
  if (!existing) throw new AppError('Serviço não encontrado', 404);

  const patch = {};
  if (payload?.name !== undefined) {
    const name = String(payload.name).trim();
    if (!name) throw new AppError('Nome do serviço é obrigatório', 400);
    patch.name = name;
  }
  if (payload?.description !== undefined) patch.description = payload.description;
  if (payload?.durationMinutes !== undefined) {
    const duration = Number(payload.durationMinutes);
    if (!Number.isFinite(duration) || duration < 15 || duration > 480) {
      throw new AppError('Duração deve estar entre 15 e 480 minutos', 400);
    }
    patch.durationMinutes = duration;
  }
  const priceCents = parsePriceEuros(payload);
  if (priceCents !== undefined) patch.priceCents = priceCents;
  if (payload?.isActive !== undefined) patch.isActive = Boolean(payload.isActive);

  const item = await accountingServicesRepository.updateRow(id, firmId, patch);
  return { item };
}

async function bulkPatch({ firmId, ids, patch }) {
  const list = Array.isArray(ids) ? ids.filter(Boolean) : [];
  if (!list.length) throw new AppError('Seleccione pelo menos um serviço', 400);

  const repoPatch = {};
  if (patch?.isActive !== undefined) repoPatch.isActive = Boolean(patch.isActive);
  if (patch?.durationMinutes !== undefined) {
    const duration = Number(patch.durationMinutes);
    if (!Number.isFinite(duration) || duration < 15 || duration > 480) {
      throw new AppError('Duração inválida', 400);
    }
    repoPatch.durationMinutes = duration;
  }
  const priceCents = parsePriceEuros(patch);
  if (priceCents !== undefined) repoPatch.priceCents = priceCents;

  if (!Object.keys(repoPatch).length) throw new AppError('Nada para actualizar', 400);

  const items = await accountingServicesRepository.bulkUpdate(list, firmId, repoPatch);
  return { items, updated: items.length };
}

async function seedCatalog({ firmId }) {
  const existingKeys = await accountingServicesRepository.listCatalogKeys(firmId);
  let created = 0;
  let order = 0;

  for (const entry of CONSULTING_SERVICES_CATALOG) {
    if (existingKeys.has(entry.catalogKey)) continue;
    await accountingServicesRepository.createRow({
      firmId,
      catalogKey: entry.catalogKey,
      name: entry.name,
      description: entry.description || null,
      durationMinutes: entry.durationMinutes,
      priceCents: entry.priceCents,
      sortOrder: order++,
      isActive: false,
    });
    created += 1;
  }

  const items = await accountingServicesRepository.listByFirm(firmId, { activeOnly: false });
  return { created, items };
}

async function activateFromCatalog({ firmId, catalogKeys }) {
  const keys = Array.isArray(catalogKeys) ? catalogKeys.filter(Boolean) : [];
  if (!keys.length) throw new AppError('Seleccione serviços do catálogo', 400);

  await seedCatalog({ firmId });

  const all = await accountingServicesRepository.listByFirm(firmId, { activeOnly: false });
  const toActivate = all.filter((s) => s.catalogKey && keys.includes(s.catalogKey));
  const ids = toActivate.map((s) => s.id);
  if (!ids.length) return { items: [], activated: 0 };

  const items = await accountingServicesRepository.bulkUpdate(ids, firmId, { isActive: true });
  return { items, activated: items.length };
}

module.exports = {
  list,
  create,
  update,
  bulkPatch,
  seedCatalog,
  activateFromCatalog,
  getCatalogTemplate: () => CONSULTING_SERVICES_CATALOG,
};
