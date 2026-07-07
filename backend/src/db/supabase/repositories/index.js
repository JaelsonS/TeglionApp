const { contabilRepository } = require('./contabil.repository');
const firmsRepository = require('./firms.repository');
const clientsRepository = require('./clients.repository');
const firmUsersRepository = require('./firm-users.repository');
const invitesRepository = require('./invites.repository');
const departmentsRepository = require('./departments.repository');
const firmMemberInvitesRepository = require('./firm-member-invites.repository');
const emailConfirmationRepository = require('./email-confirmation.repository');

function getRepository() {
  return contabilRepository;
}

module.exports = {
  getRepository,
  contabilRepository,
  firmsRepository,
  clientsRepository,
  firmUsersRepository,
  invitesRepository,
  departmentsRepository,
  firmMemberInvitesRepository,
  emailConfirmationRepository,
};
