const test = require('node:test');
const assert = require('node:assert/strict');
const { mock } = require('node:test');

const firmUsersRepository = require('../../db/supabase/repositories/firm-users.repository');
const authRefreshSessionsRepository = require('../../db/supabase/repositories/auth-refresh-sessions.repository');
const firmInquiryTagsRepository = require('../../db/supabase/repositories/firm-inquiry-tags.repository');
const securityAudit = require('../../services/audit/security-audit.service');
const teamService = require('./team.service');

const FIRM_ID = 'firm-x';
const OWNER = { id: 'owner-1', role: 'FIRM_OWNER' };
const STAFF = { id: 'staff-1', role: 'FIRM_STAFF' };

function resetMocks() {
  mock.restoreAll();
}

/** Etiquetas firm-wide: stubs para não bater na Supabase nos testes de equipa. */
function mockTags() {
  mock.method(firmInquiryTagsRepository, 'listLinksForFirmUsers', async () => []);
  mock.method(firmInquiryTagsRepository, 'mapLinkRowsToTagsByKey', () => new Map());
  mock.method(firmInquiryTagsRepository, 'resolveAllowedTagIds', async () => []);
  mock.method(firmInquiryTagsRepository, 'replaceLinksForFirmUser', async () => {});
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
  mockTags();
  const member = baseMember();
  mock.method(firmUsersRepository, 'findFirmUserByIdForFirm', async () => member);
  mock.method(firmUsersRepository, 'listFirmUsers', async () => [member]);
  mock.method(firmUsersRepository, 'setFirmMemberActive', async () => ({ ...member, isActive: false }));

  let revokedCall = null;
  mock.method(authRefreshSessionsRepository, 'deleteAllForActor', async (actorType, actorId) => {
    revokedCall = { actorType, actorId };
  });
  mock.method(securityAudit, 'recordTeamMutation', async () => {});

  await teamService.deactivateMember({ firmId: FIRM_ID, memberId: member.id, actor: OWNER, req: {} });

  assert.deepEqual(revokedCall, { actorType: 'firm_user', actorId: member.id });
});

test('deactivateMember: sinaliza sessionsRevoked no registo de auditoria', async () => {
  resetMocks();
  mockTags();
  const member = baseMember();
  mock.method(firmUsersRepository, 'findFirmUserByIdForFirm', async () => member);
  mock.method(firmUsersRepository, 'listFirmUsers', async () => [member]);
  mock.method(firmUsersRepository, 'setFirmMemberActive', async () => ({ ...member, isActive: false }));
  mock.method(authRefreshSessionsRepository, 'deleteAllForActor', async () => {});

  let auditMetadata = null;
  mock.method(securityAudit, 'recordTeamMutation', async ({ metadata }) => {
    auditMetadata = metadata;
  });

  await teamService.deactivateMember({ firmId: FIRM_ID, memberId: member.id, actor: OWNER, req: {} });

  assert.equal(auditMetadata.sessionsRevoked, true);
});

test('deactivateMember: não revoga sessão se o próprio utilizador tentar desativar-se', async () => {
  resetMocks();
  const member = baseMember({ id: OWNER.id });
  mock.method(firmUsersRepository, 'findFirmUserByIdForFirm', async () => member);

  let called = false;
  mock.method(authRefreshSessionsRepository, 'deleteAllForActor', async () => {
    called = true;
  });

  await assert.rejects(
    () => teamService.deactivateMember({ firmId: FIRM_ID, memberId: member.id, actor: OWNER, req: {} }),
    /próprio/,
  );
  assert.equal(called, false);
});

test('SEC-H1: staff NÃO pode promover-se a FIRM_OWNER', async () => {
  resetMocks();
  const self = baseMember({ id: STAFF.id, role: 'FIRM_STAFF' });
  mock.method(firmUsersRepository, 'findFirmUserByIdForFirm', async () => self);

  await assert.rejects(
    () =>
      teamService.updateMember({
        firmId: FIRM_ID,
        memberId: self.id,
        actor: STAFF,
        payload: { role: 'FIRM_OWNER' },
        req: {},
      }),
    (err) => err?.statusCode === 403 && err?.details?.code === 'OWNER_ROLE_FORBIDDEN',
  );
});

test('SEC-H1: staff NÃO pode promover outro membro a FIRM_OWNER', async () => {
  resetMocks();
  const other = baseMember({ id: 'member-2', role: 'FIRM_STAFF' });
  mock.method(firmUsersRepository, 'findFirmUserByIdForFirm', async () => other);

  await assert.rejects(
    () =>
      teamService.updateMember({
        firmId: FIRM_ID,
        memberId: other.id,
        actor: STAFF,
        payload: { role: 'FIRM_OWNER' },
        req: {},
      }),
    (err) => err?.statusCode === 403 && err?.details?.code === 'OWNER_ROLE_FORBIDDEN',
  );
});

test('SEC-H1: staff NÃO pode criar membro como FIRM_OWNER', async () => {
  resetMocks();

  await assert.rejects(
    () =>
      teamService.createMember({
        firmId: FIRM_ID,
        actor: STAFF,
        payload: {
          email: 'new@example.com',
          fullName: 'Novo Owner',
          role: 'FIRM_OWNER',
          password: 'Str0ngPass1!',
          creationMode: 'DIRECT',
        },
        req: {},
      }),
    (err) => err?.statusCode === 403 && err?.details?.code === 'OWNER_ROLE_FORBIDDEN',
  );
});

test('SEC-H1: staff NÃO pode alterar role STAFF→CONSULTANT sem FIRM_MEMBER_ROLE_MANAGE', async () => {
  resetMocks();
  const other = baseMember({ id: 'member-2', role: 'FIRM_STAFF' });
  mock.method(firmUsersRepository, 'findFirmUserByIdForFirm', async () => other);

  await assert.rejects(
    () =>
      teamService.updateMember({
        firmId: FIRM_ID,
        memberId: other.id,
        actor: STAFF,
        payload: { role: 'FIRM_CONSULTANT' },
        req: {},
      }),
    (err) => err?.statusCode === 403 && err?.details?.code === 'ROLE_CHANGE_FORBIDDEN',
  );
});

test('SEC-H1: owner PODE promover staff a FIRM_OWNER', async () => {
  resetMocks();
  mockTags();
  let current = baseMember({ id: 'member-2', role: 'FIRM_STAFF' });
  mock.method(firmUsersRepository, 'findFirmUserByIdForFirm', async () => current);
  mock.method(firmUsersRepository, 'updateFirmMember', async (_firmId, _id, patch) => {
    current = { ...current, ...patch };
    return current;
  });
  mock.method(securityAudit, 'recordTeamMutation', async () => {});

  const updated = await teamService.updateMember({
    firmId: FIRM_ID,
    memberId: current.id,
    actor: OWNER,
    payload: { role: 'FIRM_OWNER' },
    req: {},
  });

  assert.equal(updated.role, 'FIRM_OWNER');
});

test('SEC-H1: staff NÃO pode desativar um FIRM_OWNER', async () => {
  resetMocks();
  const ownerMember = baseMember({ id: 'owner-2', role: 'FIRM_OWNER' });
  mock.method(firmUsersRepository, 'findFirmUserByIdForFirm', async () => ownerMember);

  await assert.rejects(
    () =>
      teamService.deactivateMember({
        firmId: FIRM_ID,
        memberId: ownerMember.id,
        actor: STAFF,
        req: {},
      }),
    (err) => err?.statusCode === 403 && err?.details?.code === 'OWNER_ROLE_FORBIDDEN',
  );
});

test('assertActorCanAssignRole: owner pode atribuir FIRM_OWNER', () => {
  assert.equal(teamService.assertActorCanAssignRole(OWNER, 'FIRM_OWNER'), 'FIRM_OWNER');
});

test('assertActorCanAssignRole: staff não pode atribuir FIRM_OWNER', () => {
  assert.throws(
    () => teamService.assertActorCanAssignRole(STAFF, 'FIRM_OWNER'),
    (err) => err?.details?.code === 'OWNER_ROLE_FORBIDDEN',
  );
});
