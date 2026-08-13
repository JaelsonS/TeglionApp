const test = require('node:test');
const assert = require('node:assert/strict');
const { mock } = require('node:test');

const firmUsersRepository = require('../../db/supabase/repositories/firm-users.repository');
const authRefreshSessionsRepository = require('../../db/supabase/repositories/auth-refresh-sessions.repository');
const securityAudit = require('../../services/audit/security-audit.service');
const teamService = require('./team.service');

const FIRM_ID = 'firm-x';
const ACTOR = { id: 'actor-1', role: 'FIRM_OWNER' };

function resetMocks() {
  mock.restoreAll();
}

function baseMember(overrides = {}) {
  return {
    id: 'member-1',
    firmId: FIRM_ID,
    isActive: true,
    role: 'FIRM_STAFF',
    departmentId: null,
    ...overrides,
  };
}

test('deactivateMember: revoga todas as sessões de refresh do membro desativado', async () => {
  resetMocks();
  const member = baseMember();
  mock.method(firmUsersRepository, 'findFirmUserByIdForFirm', async () => member);
  mock.method(firmUsersRepository, 'listFirmUsers', async () => [member]);
  mock.method(firmUsersRepository, 'setFirmMemberActive', async () => ({ ...member, isActive: false }));

  let revokedCall = null;
  mock.method(authRefreshSessionsRepository, 'deleteAllForActor', async (actorType, actorId) => {
    revokedCall = { actorType, actorId };
  });
  mock.method(securityAudit, 'recordTeamMutation', async () => {});

  await teamService.deactivateMember({ firmId: FIRM_ID, memberId: member.id, actor: ACTOR, req: {} });

  assert.deepEqual(revokedCall, { actorType: 'firm_user', actorId: member.id });
});

test('deactivateMember: sinaliza sessionsRevoked no registo de auditoria', async () => {
  resetMocks();
  const member = baseMember();
  mock.method(firmUsersRepository, 'findFirmUserByIdForFirm', async () => member);
  mock.method(firmUsersRepository, 'listFirmUsers', async () => [member]);
  mock.method(firmUsersRepository, 'setFirmMemberActive', async () => ({ ...member, isActive: false }));
  mock.method(authRefreshSessionsRepository, 'deleteAllForActor', async () => {});

  let auditMetadata = null;
  mock.method(securityAudit, 'recordTeamMutation', async ({ metadata }) => {
    auditMetadata = metadata;
  });

  await teamService.deactivateMember({ firmId: FIRM_ID, memberId: member.id, actor: ACTOR, req: {} });

  assert.equal(auditMetadata.sessionsRevoked, true);
});

test('deactivateMember: não revoga sessão se o próprio utilizador tentar desativar-se', async () => {
  resetMocks();
  const member = baseMember({ id: ACTOR.id });
  mock.method(firmUsersRepository, 'findFirmUserByIdForFirm', async () => member);

  let called = false;
  mock.method(authRefreshSessionsRepository, 'deleteAllForActor', async () => {
    called = true;
  });

  await assert.rejects(
    () => teamService.deactivateMember({ firmId: FIRM_ID, memberId: member.id, actor: ACTOR, req: {} }),
    /próprio/,
  );
  assert.equal(called, false);
});
