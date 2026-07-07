const { AppError } = require('../../middlewares/error.middleware');
const clientsRepository = require('../../db/supabase/repositories/clients.repository');
const { getSupabaseAdmin } = require('../../db/supabase/client');
const activityService = require('../../services/activity/activity.service');
const clientHubService = require('./client-hub.service');
const {
  mergeMetadata,
  diffMetadata,
  resolveFiscalProfile,
  normalizeMetadataPatch,
} = require('../../utils/client-metadata');
const { isValidNIF, digitsOnly } = require('../../utils/documents');

function normalizeLegalFormKey(value) {
  return String(value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

function inferCompanyType(displayName, fiscalProfile = {}) {
  const legalForm = normalizeLegalFormKey(fiscalProfile.legalForm);
  if (legalForm) {
    if (/anonima|\bsa\b/.test(legalForm)) return 'SA';
    if (/empresario|nome individual|\beni\b|eirl|estabelecimento individual/.test(legalForm)) return 'ENI';
    if (/quotas|unipessoal|limitada|\blda\b|sociedade por quotas/.test(legalForm)) return 'Lda';
    if (/cooperativa|outra/.test(legalForm)) return 'Outro';
  }

  const s = `${displayName || ''} ${fiscalProfile.irsFramework || ''}`.toUpperCase();
  if (/\bS\.?\s*A\.?\b/.test(s) && !/\bLDA\b/.test(s)) return 'SA';
  if (/\bENI\b/.test(s)) return 'ENI';
  if (/\b(UNIPESSOAL|LDA)\b/.test(s)) return 'Lda';
  return 'Outro';
}

function operationalStatus(clientObligations, now) {
  const active = clientObligations.filter((o) => !['DELIVERED', 'CANCELLED'].includes(o.status));
  if (!active.length) return 'ativo';
  if (active.some((o) => new Date(o.dueDate) < now || o.status === 'OVERDUE')) return 'critico';
  const ms5d = 5 * 24 * 60 * 60 * 1000;
  if (active.some((o) => new Date(o.dueDate).getTime() - now.getTime() <= ms5d)) return 'atencao';
  return 'ativo';
}

function groupByClientId(rows, key = 'client_id') {
  const map = new Map();
  for (const row of rows || []) {
    const id = row[key];
    if (!id) continue;
    if (!map.has(id)) map.set(id, []);
    map.get(id).push(row);
  }
  return map;
}

async function fetchListEnrichment(firmId, clientIds) {
  if (!clientIds.length) {
    return { obligationsByClient: new Map(), taskCountByClient: new Map(), pendingDocsByClient: new Map() };
  }

  const sb = getSupabaseAdmin();
  const [obligationsRes, tasksRes, docsRes] = await Promise.all([
    sb
      .from('obligations')
      .select('id, client_id, due_date, status, title')
      .eq('firm_id', firmId)
      .in('client_id', clientIds),
    sb
      .from('client_tasks')
      .select('client_id')
      .eq('firm_id', firmId)
      .in('client_id', clientIds)
      .in('status', ['OPEN', 'IN_PROGRESS', 'SUBMITTED']),
    sb
      .from('documents')
      .select('client_id')
      .eq('firm_id', firmId)
      .in('client_id', clientIds)
      .eq('validation_status', 'PENDING'),
  ]);

  if (obligationsRes.error) throw obligationsRes.error;
  if (tasksRes.error) throw tasksRes.error;
  if (docsRes.error) throw docsRes.error;

  const obligationsByClient = groupByClientId(
    (obligationsRes.data || []).filter((o) => !['DELIVERED', 'CANCELLED'].includes(o.status))
  );

  const taskCountByClient = new Map();
  for (const row of tasksRes.data || []) {
    taskCountByClient.set(row.client_id, (taskCountByClient.get(row.client_id) || 0) + 1);
  }

  const pendingDocsByClient = new Map();
  for (const row of docsRes.data || []) {
    pendingDocsByClient.set(row.client_id, (pendingDocsByClient.get(row.client_id) || 0) + 1);
  }

  return { obligationsByClient, taskCountByClient, pendingDocsByClient };
}

async function listClients({ firmId, page = 1, limit = 50, includeInactive = false }) {
  const offset = (Math.max(1, page) - 1) * limit;
  const [items, total] = await Promise.all([
    clientsRepository.listClients(firmId, { limit, offset, includeInactive }),
    clientsRepository.countClients(firmId, { includeInactive }),
  ]);

  if (!items.length) {
    return { items: [], page, limit, total };
  }

  const now = new Date();
  const clientIds = items.map((c) => c.id);
  const { obligationsByClient, taskCountByClient, pendingDocsByClient } = await fetchListEnrichment(
    firmId,
    clientIds
  );

  const enriched = items.map((c) => {
    const rawObs = obligationsByClient.get(c.id) || [];
    const obs = rawObs.map((o) => ({
      id: o.id,
      title: o.title,
      dueDate: o.due_date,
      status: o.status,
    }));
    const sorted = [...obs].sort(
      (a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
    );
    const lastObligation = sorted[0];
    const fiscalProfile = resolveFiscalProfile(c.metadata);

    return {
      ...c,
      operationalStatus: operationalStatus(obs, now),
      pendingDocuments: pendingDocsByClient.get(c.id) || 0,
      openTasks: taskCountByClient.get(c.id) || 0,
      pendingObligationsCount: obs.length,
      fiscalProfile,
      vatRegime: fiscalProfile.vatRegime || null,
      companyType: inferCompanyType(c.displayName || c.name, fiscalProfile),
      nextObligation: lastObligation
        ? {
            id: lastObligation.id,
            title: lastObligation.title,
            dueDate: lastObligation.dueDate,
            status: lastObligation.status,
          }
        : null,
    };
  });

  return { items: enriched, page, limit, total };
}

function normalizeTaxId(taxId) {
  const d = digitsOnly(taxId);
  return d.length === 9 ? d : null;
}

async function validateClientNif({ firmId, taxId, excludeClientId }) {
  const normalized = normalizeTaxId(taxId);
  if (!normalized) {
    return { valid: false, normalized: null, reason: 'INVALID_FORMAT', message: 'NIF deve ter 9 dígitos.' };
  }
  if (!isValidNIF(normalized)) {
    return { valid: false, normalized, reason: 'INVALID_CHECKSUM', message: 'NIF inválido (dígito de controlo incorrecto).' };
  }
  const existing = await clientsRepository.findClientByTaxId(firmId, normalized);
  if (existing && existing.id !== excludeClientId) {
    return {
      valid: false,
      normalized,
      reason: 'DUPLICATE',
      message: 'Já existe uma empresa com este NIF na carteira.',
      existingClientId: existing.id,
      existingClientName: existing.displayName,
    };
  }
  return { valid: true, normalized, message: 'NIF válido.' };
}

async function createClient({ firmId, displayName, email, phone, taxId, metadata, assignedStaffId, actor }) {
  const name = String(displayName || '').trim();
  if (!name) throw new AppError('Nome do cliente é obrigatório', 400);

  let normalizedTaxId = null;
  if (taxId) {
    const check = await validateClientNif({ firmId, taxId });
    if (!check.valid) throw new AppError(check.message, 400, { reason: check.reason });
    normalizedTaxId = check.normalized;
  }

  const metadataPatch = metadata ? normalizeMetadataPatch(metadata) : null;
  const client = await clientsRepository.createClient({
    firmId,
    displayName: name,
    email: email ? String(email).trim().toLowerCase() : null,
    phone: phone || null,
    taxId: normalizedTaxId,
    assignedStaffId: assignedStaffId || null,
    metadata:
      metadataPatch && Object.keys(metadataPatch).length ? metadataPatch : undefined,
  });

  void activityService.recordActivity({
    firmId,
    clientId: client.id,
    actorRole: actor?.role || 'FIRM',
    actorId: actor?.id || null,
    actorName: actor?.fullName || actor?.name || 'Escritório',
    eventType: 'CLIENT_CREATED',
    entityType: 'CLIENT',
    entityId: client.id,
    title: `Empresa criada: ${name}`,
    metadata: { email: client.email, taxId: client.taxId },
  });

  return { client };
}

async function getClient({ firmId, clientId }) {
  const client = await clientsRepository.findClientById(firmId, clientId);
  if (!client) throw new AppError('Cliente não encontrado', 404);
  return {
    client: {
      ...client,
      fiscalProfile: resolveFiscalProfile(client.metadata),
    },
  };
}

async function getClientHub({ firmId, clientId }) {
  return clientHubService.getClientHub({ firmId, clientId });
}

async function updateClient({ firmId, clientId, patch, actor }) {
  const existing = await clientsRepository.findClientById(firmId, clientId);
  if (!existing) throw new AppError('Cliente não encontrado', 404);

  const repoPatch = {};
  const metadataPatch = patch.metadata ? normalizeMetadataPatch(patch.metadata) : null;

  if (patch.displayName !== undefined) repoPatch.displayName = String(patch.displayName).trim();
  if (patch.email !== undefined) repoPatch.email = patch.email;
  if (patch.phone !== undefined) repoPatch.phone = patch.phone;
  if (patch.taxId !== undefined) repoPatch.taxId = patch.taxId;
  if (patch.assignedStaffId !== undefined) repoPatch.assignedStaffId = patch.assignedStaffId;
  if (metadataPatch && Object.keys(metadataPatch).length) {
    repoPatch.metadata = mergeMetadata(existing.metadata, metadataPatch);
  }

  if (repoPatch.displayName !== undefined && !repoPatch.displayName) {
    throw new AppError('Nome da empresa é obrigatório', 400);
  }

  const client = await clientsRepository.updateClient(clientId, firmId, repoPatch);

  const metaChanges = metadataPatch
    ? diffMetadata(existing.metadata, client.metadata)
    : [];
  const scalarChanges = [];
  if (patch.displayName !== undefined && patch.displayName !== existing.displayName) {
    scalarChanges.push({ field: 'displayName', label: 'Nome', from: existing.displayName, to: client.displayName });
  }
  if (patch.taxId !== undefined && patch.taxId !== existing.taxId) {
    scalarChanges.push({ field: 'taxId', label: 'NIF', from: existing.taxId, to: client.taxId });
  }
  if (patch.email !== undefined && patch.email !== existing.email) {
    scalarChanges.push({ field: 'email', label: 'E-mail', from: existing.email, to: client.email });
  }
  if (patch.phone !== undefined && patch.phone !== existing.phone) {
    scalarChanges.push({ field: 'phone', label: 'Telefone', from: existing.phone, to: client.phone });
  }

  const allChanges = [...scalarChanges, ...metaChanges];
  if (allChanges.length) {
    void activityService.recordActivity({
      firmId,
      clientId,
      actorRole: actor?.role || 'FIRM',
      actorId: actor?.id || null,
      actorName: actor?.fullName || actor?.name || 'Escritório',
      eventType: 'CLIENT_UPDATED',
      entityType: 'CLIENT',
      entityId: clientId,
      title: 'Perfil da empresa atualizado',
      description: allChanges.map((c) => c.label).join(', '),
      metadata: { changes: allChanges },
    });
  }

  return {
    client: {
      ...client,
      fiscalProfile: resolveFiscalProfile(client.metadata),
    },
    changes: allChanges,
  };
}

async function archiveClient({ firmId, clientId, actor }) {
  const existing = await clientsRepository.findClientById(firmId, clientId);
  if (!existing) throw new AppError('Cliente não encontrado', 404);
  if (existing.status === 'INACTIVE') {
    return { client: existing };
  }

  const client = await clientsRepository.updateClient(clientId, firmId, { status: 'INACTIVE' });

  void activityService.recordActivity({
    firmId,
    clientId,
    actorRole: actor?.role || 'FIRM',
    actorId: actor?.id || null,
    actorName: actor?.fullName || actor?.name || 'Escritório',
    eventType: 'CLIENT_ARCHIVED',
    entityType: 'CLIENT',
    entityId: clientId,
    title: `Empresa removida da carteira: ${client.displayName}`,
  });

  return { client };
}

module.exports = {
  listClients,
  createClient,
  getClient,
  getClientHub,
  updateClient,
  archiveClient,
  validateClientNif,
};
