const { AppError } = require('../../middlewares/error.middleware');
const clientsRepository = require('../../db/supabase/repositories/clients.repository');
const accessesRepository = require('../../db/supabase/repositories/client-official-accesses.repository');
const firmUsersRepository = require('../../db/supabase/repositories/firm-users.repository');
const securityAudit = require('../../services/audit/security-audit.service');
const stepUp = require('./step-up.service');
const {
  CATALOG_PORTAL_KEYS,
  isPortalKey,
  isCatalogPortalKey,
  portalMeta,
} = require('./official-accesses.catalog');

const REVEAL_TTL_SECONDS = 30;
const MAX_PASSWORD_LENGTH = 256;
const MAX_USERNAME_LENGTH = 200;
const MAX_LABEL_LENGTH = 80;
const MAX_CUSTOM_PER_CLIENT = 12;

function trimOrNull(value, max) {
  if (value == null) return null;
  const s = String(value).trim();
  if (!s) return null;
  return s.slice(0, max);
}

async function requireClient(firmId, clientId) {
  const client = await clientsRepository.findClientById(firmId, clientId);
  if (!client) {
    throw new AppError('Cliente não encontrado', 404, { code: 'CLIENT_NOT_FOUND' });
  }
  return client;
}

function toPublicItem(summary, extras = {}) {
  const meta = portalMeta(summary.portalKey);
  const customName = summary.label ? String(summary.label).trim() : '';
  return {
    id: summary.id,
    portalKey: summary.portalKey,
    title: customName || meta.title,
    shortTitle: customName || meta.shortTitle,
    description: meta.description,
    url: meta.url,
    usernameLabel: meta.usernameLabel,
    label: customName || null,
    username: summary.username,
    hasPassword: Boolean(summary.hasPassword),
    updatedAt: summary.updatedAt || null,
    ...extras,
  };
}

function mergeCatalog(rows) {
  const byKey = new Map();
  const custom = [];
  for (const row of rows) {
    if (row.portalKey === 'CUSTOM') custom.push(toPublicItem(row));
    else byKey.set(row.portalKey, toPublicItem(row));
  }

  const items = CATALOG_PORTAL_KEYS.map((key) => {
    const existing = byKey.get(key);
    if (existing) return existing;
    const meta = portalMeta(key);
    return {
      id: null,
      portalKey: key,
      title: meta.title,
      shortTitle: meta.shortTitle,
      description: meta.description,
      url: meta.url,
      usernameLabel: meta.usernameLabel,
      label: null,
      username: null,
      hasPassword: false,
      updatedAt: null,
    };
  });

  return [...items, ...custom];
}

async function listOfficialAccesses({ firmId, clientId, actorId }) {
  await requireClient(firmId, clientId);
  const [rows, unlock, actor] = await Promise.all([
    accessesRepository.listByClient(firmId, clientId),
    stepUp.getUnlockState({ firmId, userId: actorId }),
    firmUsersRepository.findFirmUserById(actorId, firmId).catch(() => null),
  ]);

  const mfaEnabled = actor?.mfa_enabled === true;
  return {
    items: mergeCatalog(rows),
    security: {
      hasLocalPassword: unlock.hasLocalPassword,
      hasVaultPassword: unlock.hasVaultPassword,
      canUnlock: mfaEnabled ? true : unlock.canUnlock,
      stepUpMethods: mfaEnabled ? ['totp'] : ['vault-password'],
      mfaRequired: mfaEnabled,
      revealTtlSeconds: REVEAL_TTL_SECONDS,
    },
  };
}

function withStepUp(payload, unlock) {
  if (!unlock?.stepUpToken) return payload;
  return {
    ...payload,
    stepUpToken: unlock.stepUpToken,
    stepUpExpiresAt: unlock.stepUpExpiresAt || null,
  };
}

async function unlockActor({
  firmId,
  actorId,
  currentPassword,
  stepUpToken,
  rememberSession,
  totpCode,
  purpose,
}) {
  const sensitive = require('../security/sensitive-action.service');
  return sensitive.assertVaultSensitiveUnlock({
    firmId,
    userId: actorId,
    purpose: purpose || sensitive.SENSITIVE_PURPOSES.VAULT_REVEAL,
    totpCode: totpCode || null,
    currentPassword,
    stepUpToken,
    rememberSession: Boolean(rememberSession),
  });
}

async function upsertOfficialAccess({
  firmId,
  clientId,
  actorId,
  actorRole,
  currentPassword,
  stepUpToken,
  rememberSession,
  totpCode,
  portalKey,
  accessId,
  label,
  username,
  password,
  req,
}) {
  await requireClient(firmId, clientId);
  const unlock = await unlockActor({
    firmId,
    actorId,
    currentPassword,
    stepUpToken,
    rememberSession,
    totpCode,
    purpose: require('../security/sensitive-action.service').SENSITIVE_PURPOSES.VAULT_MUTATE,
  });
  const actor = unlock.actor;

  if (!isPortalKey(portalKey)) {
    throw new AppError('Portal inválido.', 400, { code: 'INVALID_PORTAL' });
  }

  const nextUsername = username !== undefined ? trimOrNull(username, MAX_USERNAME_LENGTH) : undefined;
  const nextLabel = label !== undefined ? trimOrNull(label, MAX_LABEL_LENGTH) : undefined;
  if (portalKey === 'CUSTOM' && !nextLabel && (!accessId || label !== undefined)) {
    throw new AppError('Indique o nome deste portal.', 400, { code: 'LABEL_REQUIRED' });
  }

  const nextPassword = password === undefined || password === null || password === ''
    ? undefined
    : String(password);
  if (nextPassword !== undefined && nextPassword.length > MAX_PASSWORD_LENGTH) {
    throw new AppError('A palavra-passe do portal é demasiado longa.', 400, { code: 'PASSWORD_TOO_LONG' });
  }

  let existing = null;
  if (accessId) {
    existing = await accessesRepository.findById(firmId, clientId, accessId);
    if (!existing) throw new AppError('Acesso não encontrado.', 404, { code: 'ACCESS_NOT_FOUND' });
    if (existing.portal_key !== portalKey) {
      throw new AppError('Portal inválido para este registo.', 400, { code: 'PORTAL_MISMATCH' });
    }
  } else if (isCatalogPortalKey(portalKey)) {
    existing = await accessesRepository.findByPortalKey(firmId, clientId, portalKey);
  }

  if (!existing && nextPassword === undefined && !nextUsername && !nextLabel) {
    throw new AppError('Indique o nome, o utilizador ou a palavra-passe deste portal.', 400, {
      code: 'PASSWORD_REQUIRED',
    });
  }

  if (!existing && portalKey === 'CUSTOM') {
    const all = await accessesRepository.listByClient(firmId, clientId);
    const customCount = all.filter((row) => row.portalKey === 'CUSTOM').length;
    if (customCount >= MAX_CUSTOM_PER_CLIENT) {
      throw new AppError('Limite de portais extra atingido neste cliente.', 400, { code: 'CUSTOM_LIMIT' });
    }
  }

  const patch = {
    updatedBy: actorId,
  };
  if (nextUsername !== undefined) patch.username = nextUsername;
  if (nextLabel !== undefined) patch.label = nextLabel;
  if (nextPassword !== undefined) patch.password = nextPassword;

  let saved;
  if (existing) {
    saved = await accessesRepository.updateRow(firmId, clientId, existing.id, patch);
  } else {
    saved = await accessesRepository.insertRow({
      firmId,
      clientId,
      portalKey,
      label: nextLabel || null,
      username: nextUsername || null,
      password: nextPassword,
      updatedBy: actorId,
    });
  }

  await securityAudit.recordClientMutation({
    action: existing ? 'client.official_access.update' : 'client.official_access.create',
    actor: { id: actorId, role: actorRole || actor.role },
    firmId,
    clientId,
    metadata: {
      portalKey,
      accessId: saved.id,
      passwordChanged: nextPassword !== undefined,
    },
    req,
  });

  return withStepUp({ item: toPublicItem(saved) }, unlock);
}

async function revealOfficialAccess({
  firmId,
  clientId,
  accessId,
  actorId,
  actorRole,
  currentPassword,
  stepUpToken,
  rememberSession,
  totpCode,
  req,
}) {
  await requireClient(firmId, clientId);
  const unlock = await unlockActor({
    firmId,
    actorId,
    currentPassword,
    stepUpToken,
    rememberSession,
    totpCode,
    purpose: require('../security/sensitive-action.service').SENSITIVE_PURPOSES.VAULT_REVEAL,
  });
  const actor = unlock.actor;
  const row = await accessesRepository.findById(firmId, clientId, accessId);
  if (!row) throw new AppError('Acesso não encontrado.', 404, { code: 'ACCESS_NOT_FOUND' });

  const revealedValue = accessesRepository.decryptSecret(row);

  await securityAudit.recordClientMutation({
    action: 'client.official_access.reveal',
    actor: { id: actorId, role: actorRole || actor.role },
    firmId,
    clientId,
    metadata: { portalKey: row.portal_key, accessId: row.id },
    req,
  });

  return withStepUp(
    {
      accessId: row.id,
      portalKey: row.portal_key,
      username: row.username || null,
      revealedValue,
      revealTtlSeconds: REVEAL_TTL_SECONDS,
    },
    unlock,
  );
}

async function removeOfficialAccess({
  firmId,
  clientId,
  accessId,
  actorId,
  actorRole,
  currentPassword,
  stepUpToken,
  rememberSession,
  totpCode,
  req,
}) {
  await requireClient(firmId, clientId);
  const unlock = await unlockActor({
    firmId,
    actorId,
    currentPassword,
    stepUpToken,
    rememberSession,
    totpCode,
    purpose: require('../security/sensitive-action.service').SENSITIVE_PURPOSES.VAULT_MUTATE,
  });
  const actor = unlock.actor;
  const row = await accessesRepository.findById(firmId, clientId, accessId);
  if (!row) throw new AppError('Acesso não encontrado.', 404, { code: 'ACCESS_NOT_FOUND' });

  await accessesRepository.deleteRow(firmId, clientId, accessId);

  await securityAudit.recordClientMutation({
    action: 'client.official_access.delete',
    actor: { id: actorId, role: actorRole || actor.role },
    firmId,
    clientId,
    metadata: { portalKey: row.portal_key, accessId },
    req,
  });

  return withStepUp({ removed: true, accessId }, unlock);
}

module.exports = {
  listOfficialAccesses,
  upsertOfficialAccess,
  revealOfficialAccess,
  removeOfficialAccess,
  mergeCatalog,
  REVEAL_TTL_SECONDS,
};
