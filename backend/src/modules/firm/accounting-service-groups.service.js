const { AppError } = require('../../middlewares/error.middleware');
const { mapDbError } = require('../../utils/db-error');
const groupsRepository = require('../../db/supabase/repositories/accounting-service-groups.repository');

function normalizeSortOrder(value) {
  if (value === undefined) return undefined;
  const n = Number(value);
  if (!Number.isFinite(n) || n < 0 || n > 9999) throw new AppError('Ordem inválida', 400);
  return Math.round(n);
}

async function list({ firmId }) {
  const items = await groupsRepository.listByFirm(firmId);
  return { items };
}

async function create({ firmId, payload }) {
  const name = String(payload?.name || '').trim();
  if (!name) throw new AppError('Nome do grupo é obrigatório', 400);
  if (name.length > 80) throw new AppError('Nome do grupo muito longo (máx. 80 caracteres)', 400);

  let item;
  try {
    item = await groupsRepository.createRow({
      firmId,
      name,
      sortOrder: payload?.sortOrder != null ? normalizeSortOrder(payload.sortOrder) : 0,
      isActive: payload?.isActive !== false,
      isPubliclyListed: payload?.isPubliclyListed !== false,
    });
  } catch (err) {
    throw mapDbError(err, 'Já existe um grupo com esse nome.');
  }
  return { item };
}

async function update({ firmId, id, payload }) {
  const existing = await groupsRepository.findByIdForFirm(id, firmId);
  if (!existing) throw new AppError('Grupo não encontrado', 404);

  const patch = {};
  if (payload?.name !== undefined) {
    const name = String(payload.name).trim();
    if (!name) throw new AppError('Nome do grupo é obrigatório', 400);
    if (name.length > 80) throw new AppError('Nome do grupo muito longo (máx. 80 caracteres)', 400);
    patch.name = name;
  }
  if (payload?.sortOrder !== undefined) patch.sortOrder = normalizeSortOrder(payload.sortOrder);
  if (payload?.isActive !== undefined) patch.isActive = Boolean(payload.isActive);
  if (payload?.isPubliclyListed !== undefined) patch.isPubliclyListed = Boolean(payload.isPubliclyListed);

  let item;
  try {
    item = await groupsRepository.updateRow(id, firmId, patch);
  } catch (err) {
    throw mapDbError(err, 'Já existe um grupo com esse nome.');
  }
  return { item };
}

/**
 * Apagar um grupo não apaga os serviços dele — a FK é ON DELETE SET NULL
 * (accounting_services.group_id), então os serviços só voltam a ficar "sem grupo",
 * do mesmo jeito que já acontece hoje quando public_group é limpo.
 */
async function remove({ firmId, id }) {
  const existing = await groupsRepository.findByIdForFirm(id, firmId);
  if (!existing) throw new AppError('Grupo não encontrado', 404);
  await groupsRepository.deleteRow(id, firmId);
  return { ok: true };
}

module.exports = { list, create, update, remove };
