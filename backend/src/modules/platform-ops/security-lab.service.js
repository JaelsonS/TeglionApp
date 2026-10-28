/**
 * Laboratório de defesa — só staging.
 * Regista sinais seguros (audit) para o overview mostrar alertas sem atacar produção.
 */
const { AppError } = require('../../middlewares/error.middleware');
const { env } = require('../../config/env');
const { isStagingFrontendUrl } = require('../../utils/cors-critical-origins');
const auditRepository = require('../../db/supabase/repositories/contabil/audit.repository');
const { getSupabaseAdmin, isSupabaseConfigured } = require('../../db/supabase/client');

const ALLOWED_SIGNALS = new Set([
  'DRILL_START',
  'SIMULATE_LOCKOUT_ALERT',
  'SIMULATE_REGISTER_BURST',
  'SIMULATE_AUTHZ_SPIKE',
  'DRILL_NOTE',
]);

function assertStagingLab() {
  if (!isStagingFrontendUrl(env.FRONTEND_URL)) {
    throw new AppError('Laboratório de defesa só em staging', 403, {
      code: 'SECURITY_LAB_STAGING_ONLY',
    });
  }
}

async function emitSignal({ code, note, actorId, ip } = {}) {
  assertStagingLab();
  const signal = String(code || '').trim().toUpperCase();
  if (!ALLOWED_SIGNALS.has(signal)) {
    throw new AppError('Sinal inválido', 400, { code: 'VALIDATION_ERROR' });
  }
  const text = String(note || '').trim().slice(0, 280) || null;

  await auditRepository.writeAuditLog({
    firmId: null,
    actorRole: 'PLATFORM_OPS',
    actorId: actorId || null,
    action: 'platform_ops.security_lab.signal',
    entityType: 'security_lab',
    entityId: null,
    metadata: { signal, note: text },
    ipAddress: ip || null,
  });

  return { ok: true, signal, environment: 'staging' };
}

async function listRecentSignals({ hours = 24 } = {}) {
  if (!isSupabaseConfigured()) return [];
  const since = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();
  const sb = getSupabaseAdmin();
  const { data, error } = await sb
    .from('audit_logs')
    .select('id, metadata, created_at, ip_address')
    .eq('action', 'platform_ops.security_lab.signal')
    .gte('created_at', since)
    .order('created_at', { ascending: false })
    .limit(30);
  if (error) return [];
  return (data || []).map((row) => ({
    id: row.id,
    signal: row.metadata?.signal || null,
    note: row.metadata?.note || null,
    createdAt: row.created_at,
    ipAddress: row.ip_address || null,
  }));
}

/** Anomalias derivadas de sinais do lab (staging). */
async function labAnomalies() {
  if (!isStagingFrontendUrl(env.FRONTEND_URL)) return [];
  const signals = await listRecentSignals({ hours: 6 });
  const anomalies = [];
  const has = (code) => signals.some((s) => s.signal === code);

  if (has('SIMULATE_LOCKOUT_ALERT')) {
    anomalies.push({
      code: 'LAB_LOCKOUT',
      severity: 'high',
      message: '[Lab] Simulação: alerta de lockout (teste red-team)',
      href: '/app/ops/security-lab',
    });
  }
  if (has('SIMULATE_REGISTER_BURST')) {
    anomalies.push({
      code: 'LAB_REGISTER_BURST',
      severity: 'high',
      message: '[Lab] Simulação: burst de registos (teste red-team)',
      href: '/app/ops/security-lab',
    });
  }
  if (has('SIMULATE_AUTHZ_SPIKE')) {
    anomalies.push({
      code: 'LAB_AUTHZ',
      severity: 'medium',
      message: '[Lab] Simulação: spike de authz (teste red-team)',
      href: '/app/ops/security-lab',
    });
  }
  if (has('DRILL_START') && anomalies.length === 0) {
    anomalies.push({
      code: 'LAB_DRILL',
      severity: 'low',
      message: '[Lab] Drill red-team em curso — use os botões do laboratório',
      href: '/app/ops/security-lab',
    });
  }
  return anomalies;
}

module.exports = {
  assertStagingLab,
  emitSignal,
  listRecentSignals,
  labAnomalies,
  ALLOWED_SIGNALS,
};
