#!/usr/bin/env node
/**
 * Valida Supabase Storage (bucket contabil-documents).
 */
const { getSupabaseAdmin, isSupabaseConfigured } = require('../src/db/supabase/client');
const { env } = require('../src/config/env');

async function main() {
  if (!isSupabaseConfigured()) {
    console.error('❌ Supabase não configurado (SUPABASE_URL + SERVICE_ROLE_KEY).');
    process.exit(1);
  }

  const bucket = env.SUPABASE_STORAGE_BUCKET || 'contabil-documents';
  const sb = getSupabaseAdmin();
  if (!sb) {
    console.error('❌ Cliente Supabase indisponível.');
    process.exit(1);
  }

  const { data, error } = await sb.storage.listBuckets();
  if (error) {
    console.error('❌ Falha ao listar buckets:', error.message);
    process.exit(1);
  }

  const found = (data || []).some((b) => b.name === bucket);
  if (!found) {
    console.error(`❌ Bucket "${bucket}" não encontrado. Aplique supabase/migrations/20260703000000_storage_contabil_documents.sql`);
    process.exit(1);
  }

  console.log(`✅ Supabase Storage OK — bucket "${bucket}"`);
}

main().catch((err) => {
  console.error('❌', err.message || err);
  process.exit(1);
});
