/**
 * Guards de acesso do portal cliente.
 */
const { AppError } = require('../../../middlewares/error.middleware');
const clientsRepository = require('../../../db/supabase/repositories/clients.repository');

async function requireLinkedClient(actor) {
  if (!actor || actor.role !== 'CLIENT' || !actor.firmId) {
    throw new AppError('Acesso restrito ao cliente vinculado ao escritório.', 403);
  }
  const client = await clientsRepository.findClientById(actor.firmId, actor.clientId || actor.id);
  if (!client) throw new AppError('Cliente não encontrado ou inativo.', 404);
  if (client.linkStatus && client.linkStatus !== 'APPROVED') {
    throw new AppError('Vínculo com o escritório não aprovado.', 403);
  }
  return client;
}

module.exports = {
  requireLinkedClient,
};
