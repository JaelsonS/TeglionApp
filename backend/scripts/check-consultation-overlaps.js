/**
 * Diagnóstico somente-leitura: procura consultations ativas (PENDING_PAYMENT
 * ou SCHEDULED) que já se sobrepõem no tempo, para o mesmo firm_id + staff_id
 * (staff_id nulo tratado como um único "balde" — mesmo critério da migration
 * 20260927010000_consultations_no_overlap.sql). Rodar antes de aplicar essa
 * migration: se houver alguma sobreposição hoje, a constraint EXCLUDE falha
 * ao ser criada até os dados serem corrigidos manualmente.
 *
 * Não faz nenhuma escrita. Uso:
 *   node backend/scripts/check-consultation-overlaps.js
 */
require('dotenv').config();
require('dotenv').config({ path: require('path').join(__dirname, '../.env.local'), override: true });

const { getSupabaseAdmin, isSupabaseConfigured } = require('../src/db/supabase/client');

async function main() {
  if (!isSupabaseConfigured()) {
    console.log('Supabase não configurado neste ambiente — nada para checar.');
    process.exit(0);
  }
  const sb = getSupabaseAdmin();
  const { data, error } = await sb
    .from('consultations')
    .select('id, firm_id, staff_id, scheduled_at, duration_minutes, status')
    .in('status', ['PENDING_PAYMENT', 'SCHEDULED'])
    .order('firm_id', { ascending: true })
    .order('scheduled_at', { ascending: true });

  if (error) {
    console.error('Falha ao ler consultations:', error.message);
    process.exit(1);
  }

  const rows = data || [];
  console.log(`${rows.length} consultation(s) ativa(s) (PENDING_PAYMENT/SCHEDULED) encontradas.`);

  const bucketKey = (r) => `${r.firm_id}::${r.staff_id || 'null'}`;
  const buckets = new Map();
  for (const r of rows) {
    const key = bucketKey(r);
    if (!buckets.has(key)) buckets.set(key, []);
    buckets.get(key).push(r);
  }

  let overlapCount = 0;
  for (const [key, list] of buckets) {
    list.sort((a, b) => new Date(a.scheduled_at) - new Date(b.scheduled_at));
    for (let i = 0; i < list.length - 1; i += 1) {
      const a = list[i];
      const aEnd = new Date(a.scheduled_at).getTime() + (a.duration_minutes || 60) * 60 * 1000;
      const b = list[i + 1];
      const bStart = new Date(b.scheduled_at).getTime();
      if (bStart < aEnd) {
        overlapCount += 1;
        console.log(
          `SOBREPOSIÇÃO — bucket ${key}: consultation ${a.id} (${a.scheduled_at}, ${a.duration_minutes}min) colide com ${b.id} (${b.scheduled_at}, ${b.duration_minutes}min)`,
        );
      }
    }
  }

  if (overlapCount === 0) {
    console.log('Nenhuma sobreposição encontrada — seguro aplicar a constraint EXCLUDE como está.');
  } else {
    console.log(
      `\n${overlapCount} sobreposição(ões) encontrada(s). A migration vai FALHAR ao criar a constraint até isso ser resolvido manualmente (reagendar ou cancelar uma das consultations em conflito).`,
    );
  }
  process.exit(overlapCount === 0 ? 0 : 2);
}

main().catch((err) => {
  console.error('Erro inesperado:', err.message);
  process.exit(1);
});
