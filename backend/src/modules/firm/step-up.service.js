/**
 * Step-up para acções sigilosas (ex.: revelar acessos oficiais).
 * Hoje: reintroduzir a palavra-passe local do staff.
 * Quando existir MFA (TOTP) em firm_users, exigir o código NESTE ponto —
 * não só no login. Não forçar enrolamento aqui (risco de lock-out nas piloto).
 */
const { AppError } = require('../../middlewares/error.middleware');
const passwordCrypto = require('../../utils/password-crypto');
const firmUsersRepository = require('../../db/supabase/repositories/firm-users.repository');

async function verifyStaffPassword({ firmId, userId, currentPassword }) {
  const actor = await firmUsersRepository.findFirmUserById(userId, firmId);
  if (!actor || String(actor.firm_id) !== String(firmId) || actor.is_active === false) {
    throw new AppError('Utilizador não encontrado', 404, { code: 'USER_NOT_FOUND' });
  }

  if (!actor.password_hash) {
    throw new AppError(
      'A sua conta não tem palavra-passe no Teglion. Defina uma em Definições antes de consultar ou gravar acessos oficiais.',
      400,
      { code: 'NO_LOCAL_PASSWORD' },
    );
  }

  const ok = await passwordCrypto.verifyPassword(String(currentPassword || ''), actor.password_hash);
  if (!ok) {
    throw new AppError('Palavra-passe incorrecta. Confirme a sua palavra-passe do Teglion.', 403, {
      code: 'INVALID_CURRENT_PASSWORD',
    });
  }

  return actor;
}

async function actorHasLocalPassword({ firmId, userId }) {
  const actor = await firmUsersRepository.findFirmUserById(userId, firmId);
  if (!actor || String(actor.firm_id) !== String(firmId)) return false;
  return Boolean(actor.password_hash);
}

module.exports = {
  verifyStaffPassword,
  actorHasLocalPassword,
};
