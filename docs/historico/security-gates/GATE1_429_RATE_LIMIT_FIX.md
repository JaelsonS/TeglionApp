# Gate 1 — Rate limit / 429 (shell badges)

**Data:** 21/08/2026  
**Branch:** `fix/gate-1-429-polling`

## Causa raiz

Limiter **global autenticado** (`user:{id}`, default 1200/15m) — **não** `createAuthLimiter` (IP, login/MFA).

O chrome montava 3 navs com `useFirmNavBadgeCounts` → 5 queries com poll 60–90s **fora** da skip-list (`unread-summary` / `live/events` já estavam skipped). Inbox era invalidado a cada 120s pelo scheduler global.

## Correção

1. `GET /api/contabil/nav-badges` — 1 request agregado (perms por campo).  
2. FE: poll **180s** + live invalidation; pausa em 429 / tab hidden.  
3. Skip-list: **só** `/api/contabil/nav-badges` (mesma classe que `unread-summary`).  
4. **Não** skipped: metrics, documents list, operational-dashboard, inbox, MFA, vault.  
5. Scheduler: **deixou** de invalidar `firm-inbox` em background.  
6. **Não** aumentámos `RATE_LIMIT_AUTH_MAX`.

## Justificação skip `nav-badges`

| Critério | OK? |
|----------|-----|
| GET read-only | Sim |
| Auth + permissions | Sim (`requireAnyPermission` + checks no service) |
| Chrome / shell | Sim |
| Write/auth/MFA/vault | Não incluídos |

## Requests badges / 15 min (estimativa)

| | Antes | Depois |
|--|-------|--------|
| Endpoints de badge | 5 | 1 |
| Intervalo | 60–90s | 180s |
| Floor aproximado | ≥65 | ≤5 (+ live events ocasionais) |
