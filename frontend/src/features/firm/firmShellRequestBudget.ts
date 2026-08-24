/**
 * Orçamento de pedidos do chrome do escritório (Gate 1 / anti-429).
 * Mantém a regressão visível: badges = 1 endpoint; poll ≥ 3 min.
 */
export const FIRM_SHELL_BADGE_POLL_MS = 180_000

/** Pedidos de badge esperados por janela de 15 min (só interval, sem live events). */
export function expectedBadgeRequestsPerWindow(windowMs = 15 * 60_000, pollMs = FIRM_SHELL_BADGE_POLL_MS) {
  return Math.ceil(windowMs / pollMs)
}

/** Antes do Gate 1: ~5 endpoints × (60–90s) ≈ 65+/15 min só de badges. */
export const LEGACY_BADGE_REQUESTS_PER_15MIN_FLOOR = 65
