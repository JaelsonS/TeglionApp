#!/usr/bin/env node
/**
 * Backfill genérico (v9 — Website + Booking Builder, Fase 1): para cada
 * escritório que ainda não tem uma linha em `firm_public_sites`, traduz
 * `firm.settings.publicProfile`/`branding` (o esquema desta sessão, anterior
 * ao v9) para o novo esquema de secções e grava-a como `draft` E `published`
 * — para que a página pública de qualquer escritório já configurado (ex.:
 * jaelson/MayaVida) continue a funcionar sem qualquer regressão visível
 * assim que a Fase 4 cortar a rota pública para ler `firm_public_sites`.
 *
 * Nenhum código específico de nenhum escritório — a mesma tradução corre
 * para todos.
 *
 * Uso:
 *   node backend/scripts/backfill-firm-public-sites.js --dry-run
 *   node backend/scripts/backfill-firm-public-sites.js
 */
const { getSupabaseAdmin, isSupabaseConfigured } = require('../src/db/supabase/client');
const firmsRepository = require('../src/db/supabase/repositories/firms.repository');
const firmPublicSitesRepository = require('../src/db/supabase/repositories/firm-public-sites.repository');
const { buildConfigFromLegacySettings } = require('../src/modules/firm/firm-public-site.service');

async function main() {
  const dryRun = process.argv.includes('--dry-run');

  if (!isSupabaseConfigured()) {
    console.error('❌ Supabase não configurado (SUPABASE_URL + SERVICE_ROLE_KEY).');
    process.exit(1);
  }

  const sb = getSupabaseAdmin();
  const { data: firmRows, error } = await sb.from('firms').select('id, name, slug');
  if (error) {
    console.error('❌ Falha ao listar escritórios:', error.message);
    process.exit(1);
  }

  console.log(`${firmRows.length} escritório(s) encontrado(s).${dryRun ? ' (dry-run — nada será gravado)' : ''}`);

  let skipped = 0;
  let migrated = 0;
  for (const row of firmRows) {
    const existing = await firmPublicSitesRepository.findByFirmId(row.id);
    if (existing) {
      skipped++;
      continue;
    }

    const firm = await firmsRepository.findFirmById(row.id);
    const config = buildConfigFromLegacySettings(firm);

    console.log(`→ ${row.slug || row.id} (${row.name}): ${config.sections.filter((s) => s.enabled).length} secções activas, tagline="${config.sections.find((s) => s.type === 'hero')?.content.tagline || ''}"`);

    if (!dryRun) {
      await firmPublicSitesRepository.upsertDraft(row.id, config, null);
      await firmPublicSitesRepository.publish(row.id, null);
    }
    migrated++;
  }

  console.log(`\n${dryRun ? 'Simulação concluída' : 'Backfill concluído'}: ${migrated} migrado(s), ${skipped} já tinham linha própria (ignorados).`);
}

main().catch((err) => {
  console.error('❌ Erro inesperado:', err);
  process.exit(1);
});
