const { test } = require('node:test');
const assert = require('node:assert/strict');

// Regressão do achado P1 (auditoria de segurança 19-20/08/2026): um ator não-owner com
// FIRM_MEMBER_PERMISSION_MANAGE delegado conseguia (a) auto-conceder-se qualquer
// permissão, (b) reduzir as permissões do dono do escritório, e (c) conceder a
// terceiros permissões que ele próprio não possui — tudo via PATCH /team/:id/permissions,
// sem nunca tocar em `role` (o que já era corretamente bloqueado noutro serviço).

function stubModule(relativePath, exports) {
  const resolved = require.resolve(relativePath, { paths: [__dirname] });
  require.cache[resolved] = { id: resolved, filename: resolved, loaded: true, exports };
  return resolved;
}

function loadServiceWithMember(member, { updateCalls } = {}) {
  stubModule('../../db/supabase/repositories/firm-users.repository', {
    findFirmUserByIdForFirm: async (_firmId, memberId) => (memberId === member.id ? member : null),
    updateFirmMember: async (firmId, userId, patch) => {
      if (updateCalls) updateCalls.push({ firmId, userId, patch });
      return { ...member, permissionsOverride: patch.permissionsOverride };
    },
  });
  stubModule('../../services/audit/security-audit.service', {
    recordTeamMutation: async () => {},
  });
  stubModule('../security/sensitive-action.service', {
    SENSITIVE_PURPOSES: {
      TEAM_PERMISSIONS_PATCH: 'team_permissions_patch',
    },
    confirmSensitiveAction: async () => ({ method: 'test', purpose: 'team_permissions_patch' }),
  });
  delete require.cache[require.resolve('./team-permissions.service')];
  return require('./team-permissions.service');
}

const STAFF_MEMBER = { id: 'staff-1', role: 'FIRM_STAFF', permissionsOverride: null };
const OWNER_MEMBER = { id: 'owner-1', role: 'FIRM_OWNER', permissionsOverride: null };

test('não-owner NÃO pode alterar as próprias permissões (auto-concessão)', async () => {
  const { patchTeamPermissions } = loadServiceWithMember(STAFF_MEMBER);
  const actor = { id: 'staff-1', role: 'FIRM_STAFF', permissions: ['FIRM_MEMBER_PERMISSION_MANAGE', 'FIRM_READ'] };

  await assert.rejects(
    () =>
      patchTeamPermissions({
        firmId: 'firm-1',
        memberId: 'staff-1',
        actor,
        payload: { mode: 'OVERRIDE', permissions: ['FIRM_BILLING_MANAGE', 'USERS_CREATE_ADMIN'] },
        req: {},
      }),
    (err) => err.statusCode === 403 && err.details?.code === 'SELF_PERMISSIONS_FORBIDDEN',
  );
});

test('não-owner NÃO pode alterar permissões de um FIRM_OWNER', async () => {
  const { patchTeamPermissions } = loadServiceWithMember(OWNER_MEMBER);
  const actor = { id: 'staff-1', role: 'FIRM_STAFF', permissions: ['FIRM_MEMBER_PERMISSION_MANAGE', 'FIRM_READ'] };

  await assert.rejects(
    () =>
      patchTeamPermissions({
        firmId: 'firm-1',
        memberId: 'owner-1',
        actor,
        payload: { mode: 'OVERRIDE', permissions: ['FIRM_READ'] },
        req: {},
      }),
    (err) => err.statusCode === 403 && err.details?.code === 'OWNER_PERMISSIONS_FORBIDDEN',
  );
});

test('não-owner NÃO pode conceder a terceiro permissão que ele próprio não possui (teto)', async () => {
  const otherStaff = { id: 'staff-2', role: 'FIRM_STAFF', permissionsOverride: null };
  const { patchTeamPermissions } = loadServiceWithMember(otherStaff);
  const actor = { id: 'staff-1', role: 'FIRM_STAFF', permissions: ['FIRM_MEMBER_PERMISSION_MANAGE', 'FIRM_READ'] };

  await assert.rejects(
    () =>
      patchTeamPermissions({
        firmId: 'firm-1',
        memberId: 'staff-2',
        actor,
        // FIRM_BILLING_MANAGE não está na lista de permissões do actor
        payload: { mode: 'OVERRIDE', permissions: ['FIRM_READ', 'FIRM_BILLING_MANAGE'] },
        req: {},
      }),
    (err) => err.statusCode === 403 && err.details?.code === 'PERMISSIONS_CEILING_EXCEEDED',
  );
});

test('não-owner PODE conceder a terceiro um subconjunto das próprias permissões (delegação legítima preservada)', async () => {
  const otherStaff = { id: 'staff-2', role: 'FIRM_STAFF', permissionsOverride: null };
  const updateCalls = [];
  const { patchTeamPermissions } = loadServiceWithMember(otherStaff, { updateCalls });
  const actor = { id: 'staff-1', role: 'FIRM_STAFF', permissions: ['FIRM_MEMBER_PERMISSION_MANAGE', 'FIRM_READ'] };

  const result = await patchTeamPermissions({
    firmId: 'firm-1',
    memberId: 'staff-2',
    actor,
    payload: { mode: 'OVERRIDE', permissions: ['FIRM_READ'] },
    req: {},
  });

  assert.equal(updateCalls.length, 1);
  assert.deepEqual(result.overridePermissions, ['FIRM_READ']);
});

test('FIRM_OWNER continua podendo gerir permissões de qualquer membro, incluindo outro owner (sem regressão)', async () => {
  const otherOwner = { id: 'owner-2', role: 'FIRM_OWNER', permissionsOverride: null };
  const updateCalls = [];
  const { patchTeamPermissions } = loadServiceWithMember(otherOwner, { updateCalls });
  const actor = { id: 'owner-1', role: 'FIRM_OWNER', permissions: [] };

  const result = await patchTeamPermissions({
    firmId: 'firm-1',
    memberId: 'owner-2',
    actor,
    payload: { mode: 'OVERRIDE', permissions: ['FIRM_BILLING_MANAGE', 'USERS_CREATE_ADMIN'] },
    req: {},
  });

  assert.equal(updateCalls.length, 1);
  assert.deepEqual(result.overridePermissions.sort(), ['FIRM_BILLING_MANAGE', 'USERS_CREATE_ADMIN'].sort());
});
