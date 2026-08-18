const { AppError } = require('../../middlewares/error.middleware');
const clientsRepository = require('../../db/supabase/repositories/clients.repository');
const accessesRepository = require('../../db/supabase/repositories/client-official-accesses.repository');
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
  const title =
    summary.portalKey === 'CUSTOM'
      ? summary.label || meta.title
      : meta.title;
  return {
    id: summary.id,
    portalKey: summary.portalKey,
    title,
    shortTitle: meta.shortTitle,
    description: meta.description,
    url: meta.url,
    usernameLabel: meta.usernameLabel,
    label: summary.label,
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
  const [rows, hasLocalPassword] = await Promise.all([
    accessesRepository.listByClient(firmId, clientId),
    stepUp.actorHasLocalPassword({ firmId, userId: actorId }),
  ]);

  return {
    items: mergeCatalog(rows),
    security: {
      hasLocalPassword,
      stepUpMethods: ['password'],
      mfaRequired: false,
      revealTtlSeconds: REVEAL_TTL_SECONDS,
    },
  };
}

async function upsertOfficialAccess({
  firmId,
  clientId,
  actorId,
  actorRole,
  currentPassword,
  portalKey,
  accessId,
  label,
  username,
  password,
  req,
}) {
  await requireClient(firmId, clientId);
  const actor = await stepUp.verifyStaffPassword({ firmId, userId: actorId, currentPassword });

  if (!isPortalKey(portalKey)) {
    throw new AppError('Portal inválido.', 400, { code: 'INVALID_PORTAL' });
  }

  const nextUsername = username !== undefined ? trimOrNull(username, MAX_USERNAME_LENGTH) : undefined;
  const nextLabel =
    portalKey === 'CUSTOM' ? trimOrNull(label, MAX_LABEL_LENGTH) : null;
  if (portalKey === 'CUSTOM' && !nextLabel && !accessId) {
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

  if (!existing && nextPassword === undefined) {
    throw new AppError('Indique a palavra-passe deste portal para gravar o acesso.', 400, {
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
  if (portalKey === 'CUSTOM' && nextLabel !== undefined) patch.label = nextLabel;
  if (nextPassword !== undefined) patch.password = nextPassword;

  let saved;
  if (existing) {
    saved = await accessesRepository.updateRow(firmId, clientId, existing.id, patch);
  } else {
    saved = await accessesRepository.insertRow({
      firmId,
      clientId,
      portalKey,
      label: nextLabel,
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

  return { item: toPublicItem(saved) };
}

async function revealOfficialAccess({
  firmId,
  clientId,
  accessId,
  actorId,
  actorRole,
  currentPassword,
  req,
}) {
  await requireClient(firmId, clientId);
  const actor = await stepUp.verifyStaffPassword({ firmId, userId: actorId, currentPassword });
  const row = await accessesRepository.findById(firmId, clientId, accessId);
  if (!row) throw new AppError('Acesso não encontrado.', 404, { code: 'ACCESS_NOT_FOUND' });
  if (!row.secret_enc) {
    throw new AppError('Este portal ainda não tem palavra-passe guardada.', 400, { code: 'NO_SECRET' });
  }

  const revealedValue = accessesRepository.decryptSecret(row);

  await securityAudit.recordClientMutation({
    action: 'client.official_access.reveal',
    actor: { id: actorId, role: actorRole || actor.role },
    firmId,
    clientId,
    metadata: { portalKey: row.portal_key, accessId: row.id },
    req,
  });

  return {
    accessId: row.id,
    portalKey: row.portal_key,
    username: row.username || null,
    revealedValue,
    revealTtlSeconds: REVEAL_TTL_SECONDS,
  };
}

async function removeOfficialAccess({
  firmId,
  clientId,
  accessId,
  actorId,
  actorRole,
  currentPassword,
  req,
}) {
  await requireClient(firmId, clientId);
  const actor = await stepUp.verifyStaffPassword({ firmId, userId: actorId, currentPassword });
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

  return { removed: true, accessId };
}

module.exports = {
  listOfficialAccesses,
  upsertOfficialAccess,
  revealOfficialAccess,
  removeOfficialAccess,
  mergeCatalog,
  REVEAL_TTL_SECONDS,
};
