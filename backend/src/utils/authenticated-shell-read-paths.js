/**
 * Rotas de leitura do shell autenticado (badges / bootstrap).
 * Excluídas do limiter GLOBAL autenticado — NÃO do auth/MFA/vault limiters.
 *
 * Critério para entrar nesta lista:
 * - GET read-only
 * - Autenticado + permissões de domínio
 * - Usado pelo chrome da app (nav / live / billing status)
 * - Não é write, auth, MFA, vault nem operação sensível
 *
 * NÃO incluir: /auth/*, /mfa/*, official-accesses, team permissions, close firm, etc.
 */

const EXACT_SHELL_READ_PATHS = Object.freeze([
  '/api/auth/me',
  '/api/contabil/firm',
  '/api/contabil/dashboard',
  '/api/contabil/billing/status',
  '/api/contabil/live/events',
  '/api/contabil/messages/unread-summary',
  /** Agregado de badges do nav — substitui 5 polls paralelos (Gate 1 / 429). */
  '/api/contabil/nav-badges',
  '/api/client-portal/me/contabil/live/events',
]);

const PREFIX_SHELL_READ_PATHS = Object.freeze(['/api/contabil/notifications']);

/**
 * Justificativas (documentação / auditoria) — endpoints de badge LEGADOS
 * que ainda podem ser chamados por páginas individuais. Continuam rate-limited
 * no balde global excepto se forem shell exact acima.
 *
 * Propositadamente NÃO skipped:
 * - /client-tasks/metrics (página de tarefas pode ser pesada)
 * - /documents (listagens reais)
 * - /obligations/operational-dashboard (hub pesado)
 * - /inbox (só quando o módulo está montado)
 */
const LEGACY_BADGE_PATHS_STILL_RATE_LIMITED = Object.freeze([
  '/api/contabil/service-inquiries/unseen-count',
  '/api/contabil/consultations/attention-count',
  '/api/contabil/client-tasks/metrics',
  '/api/contabil/documents',
  '/api/contabil/obligations/operational-dashboard',
  '/api/contabil/inbox',
]);

function isAuthenticatedShellReadPath(url) {
  const pathOnly = String(url || '').split('?')[0];
  if (EXACT_SHELL_READ_PATHS.includes(pathOnly)) return true;
  return PREFIX_SHELL_READ_PATHS.some((prefix) => pathOnly.startsWith(prefix));
}

module.exports = {
  EXACT_SHELL_READ_PATHS,
  PREFIX_SHELL_READ_PATHS,
  LEGACY_BADGE_PATHS_STILL_RATE_LIMITED,
  isAuthenticatedShellReadPath,
};
