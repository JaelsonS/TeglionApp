const { getSupabaseAdmin } = require('../client');

function map(row) {
  if (!row) return null;
  return {
    firmId: row.firm_id,
    templateKey: row.template_key,
    schemaVersion: row.schema_version,
    draft: row.draft || {},
    published: row.published || null,
    publishedAt: row.published_at || null,
    publishedBy: row.published_by || null,
    previewToken: row.preview_token || null,
    previewTokenExpiresAt: row.preview_token_expires_at || null,
    draftUpdatedAt: row.draft_updated_at,
    draftUpdatedBy: row.draft_updated_by || null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

async function findByFirmId(firmId) {
  const sb = getSupabaseAdmin();
  const { data, error } = await sb
    .from('firm_public_sites')
    .select('*')
    .eq('firm_id', firmId)
    .maybeSingle();
  if (error) throw error;
  return map(data);
}

/** Substitui o `draft` inteiro (o editor gere a configuração completa no
 * cliente e grava-a de uma vez em "Guardar rascunho" — não é um merge
 * parcial por chave, ao contrário de firm.settings). Cria a linha se ainda
 * não existir para este escritório. */
async function upsertDraft(firmId, draft, actorUserId) {
  const sb = getSupabaseAdmin();
  const { data, error } = await sb
    .from('firm_public_sites')
    .upsert(
      {
        firm_id: firmId,
        draft,
        draft_updated_at: new Date().toISOString(),
        draft_updated_by: actorUserId || null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'firm_id' },
    )
    .select()
    .single();
  if (error) throw error;
  return map(data);
}

async function publish(firmId, actorUserId) {
  const current = await findByFirmId(firmId);
  if (!current) return null;
  const sb = getSupabaseAdmin();
  const { data, error } = await sb
    .from('firm_public_sites')
    .update({
      published: current.draft,
      published_at: new Date().toISOString(),
      published_by: actorUserId || null,
      updated_at: new Date().toISOString(),
    })
    .eq('firm_id', firmId)
    .select()
    .single();
  if (error) throw error;
  return map(data);
}

async function setPreviewToken(firmId, token, expiresAt) {
  const sb = getSupabaseAdmin();
  const { data, error } = await sb
    .from('firm_public_sites')
    .upsert(
      {
        firm_id: firmId,
        preview_token: token,
        preview_token_expires_at: expiresAt,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'firm_id' },
    )
    .select()
    .single();
  if (error) throw error;
  return map(data);
}

async function findByPreviewToken(token) {
  const sb = getSupabaseAdmin();
  const { data, error } = await sb
    .from('firm_public_sites')
    .select('*')
    .eq('preview_token', token)
    .maybeSingle();
  if (error) throw error;
  return map(data);
}

/** Apaga rascunho + publicado — escritório pode recomeçar do zero. */
async function deleteByFirmId(firmId) {
  const sb = getSupabaseAdmin();
  const { error } = await sb.from('firm_public_sites').delete().eq('firm_id', firmId);
  if (error) throw error;
}

module.exports = {
  findByFirmId,
  upsertDraft,
  publish,
  setPreviewToken,
  findByPreviewToken,
  deleteByFirmId,
};
