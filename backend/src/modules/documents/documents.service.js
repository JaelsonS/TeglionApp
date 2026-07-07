/**
 * Download de documentos TegLion — Supabase Storage.
 */
const { AppError } = require('../../middlewares/error.middleware');
const { getRepository } = require('../../db/supabase/repositories');
const contabilStorage = require('../../services/storage/contabil-storage.service');
const clientsRepository = require('../../db/supabase/repositories/clients.repository');

async function findDocumentForActor(actor, documentId) {
  const repo = getRepository();
  const firmId = String(actor.firmId || '');
  if (!firmId) throw new AppError('Escritório não identificado', 403);

  const sb = require('../../db/supabase/client').getSupabaseAdmin();
  const { data, error } = await sb
    .from('documents')
    .select('*')
    .eq('id', documentId)
    .eq('firm_id', firmId)
    .eq('is_active', true)
    .maybeSingle();
  if (error) throw error;
  if (!data) throw new AppError('Documento não encontrado', 404);

  if (actor.role === 'CLIENT') {
    const clientId = String(actor.clientId || actor.id);
    if (data.client_id !== clientId) {
      throw new AppError('Sem permissão para este documento', 403);
    }
    const client = await clientsRepository.findClientById(firmId, clientId);
    if (!client || client.linkStatus !== 'APPROVED') {
      throw new AppError('Acesso restrito', 403);
    }
  }

  return data;
}

async function resolveDownload({ actor, documentId, req }) {
  const doc = await findDocumentForActor(actor, documentId);
  const viewTracking = require('../../services/tracking/view-tracking.service');
  const isClient = actor.role === 'CLIENT';
  void viewTracking
    .recordView({
      firmId: String(doc.firm_id),
      clientId: doc.client_id,
      entityType: 'DOCUMENT',
      entityId: documentId,
      viewerRole: isClient ? 'CLIENT' : 'FIRM',
      viewerId: actor.id,
      viewerName: actor.name || actor.fullName || (isClient ? 'Cliente' : 'Escritório'),
      ipAddress: req?.headers?.['x-forwarded-for']?.split(',')[0]?.trim() || req?.socket?.remoteAddress,
      userAgent: req?.headers?.['user-agent'],
    })
    .catch(() => {});

  const storageKey = doc.storage_key;
  if (!storageKey || String(doc.storage_provider || 'supabase').toLowerCase() !== 'supabase') {
    throw new AppError('Ficheiro indisponível para download', 404, { code: 'DOCUMENT_FILE_MISSING' });
  }

  return { mode: 'stream', mimeType: doc.mime_type, title: doc.title, storageKey };
}

async function streamDownload({ actor, documentId, req }) {
  const resolved = await resolveDownload({ actor, documentId, req });
  const buffer = await contabilStorage.downloadToBuffer(resolved.storageKey);
  return {
    buffer,
    mimeType: resolved.mimeType || 'application/octet-stream',
    title: resolved.title || 'documento',
  };
}

async function resolvePreview({ actor, documentId, req }) {
  const streamed = await streamDownload({ actor, documentId, req });
  return {
    mode: 'stream',
    mimeType: streamed.mimeType,
    title: streamed.title,
  };
}

module.exports = {
  resolveDownload,
  resolvePreview,
  streamDownload,
};
