# Teglion Control Center (AfDigital Ops)

**Estado:** onda 2 Defesa em `staging` (`feature/fase-ops-center-wave2-defense`)  
**Operador:** AfDigital — Soluções Tecnológicas (não inventar entidade jurídica «Teglion»)  
**Ambiente de trabalho:** staging = ensaio de produção (mesmas regras de authz e audit).

## Objectivo

Painel interno onde o operador AfDigital (blue + red team):

- vê **todos os gabinetes** (incl. novos 24h/7d) e actividade recente;
- **gere** estado: suspender / reactivar / **estender trial** / **cancelar** (sem hard-delete fiscal);
- lê **audit logs**, tentativas de login (**IP + país** quando lookup ok);
- acompanha **alertas de abuso** e **Sentry** (link-out ± API);
- exporta CSV;
- **não** usa um segundo stack de auth — reutiliza sessão firm + MFA + allowlist.

## Modelo de segurança (não negociável)

1. **Gate de ambiente:** `PLATFORM_OPS_ENABLED=true` (só com literal `true`).
2. **Allowlist de um único email:** `PLATFORM_OPS_EMAIL_ALLOWLIST` (exactamente 1). 0 ou >1 → 503.
3. **Sessão existente:** cookie HttpOnly da app firm (sem Bearer em prod). A conta ops é um `firm_user` anfitrião **só para auth** — não é um gabinete comercial.
4. **MFA TOTP obrigatória** na conta do operador:
   - após criar/definir a password → `MFA_ENROLLMENT_REQUIRED` no próximo login;
   - com MFA activo → `MFA_CHALLENGE_REQUIRED` em **cada** login;
   - não pode desactivar MFA enquanto o email estiver na allowlist.
5. **Isolamento de UI:** contas `platformOps` aterraram em `/app/ops` e **não** usam `/app/firm/*` (excepto Definições/MFA).
6. **Clientes do portal** nunca acedem.
7. **Todas as leituras/ações** do Center geram `audit_logs` com `firm_id` null e `actor_role=PLATFORM_OPS`.
8. **Sem** service role no browser; geo-IP só no backend (`ip_geo_cache`).
9. Bloqueio de IP global na edge: desenho onda 3 — nesta onda só **sinais** + checklist.
10. Gabinete anfitrião (`internal_ops` / slug `afdigital-ops`) **não** pode ser suspenso/cancelado/trial pelo Center.
11. **Dados no Center:** metadados (status, trial, contagens, país do firm, flags públicas). **Excluir:** NIF, emails de clientes, documentos, conteúdo fiscal, hashes, recovery codes.

## Registo de gabinetes — modo 1A

- **Não** bloquear `/auth/firm/register`.
- **Não** existe `pending_review` nesta onda.
- Overview + lista mostram gabinetes criados nas últimas **24h / 7d** (badge «Novo»).
- Resposta operacional: **suspender** ou **cancelar** (acesso) após o facto.

## Rotas

| UI | API |
|----|-----|
| `/auth/ops/login` | login firm (mesmo endpoint) + UI dedicada Control Center |
| `/auth/ops/mfa` | desafio / enrollment MFA do operador |
| `/app/ops` | `GET /api/platform-ops/me` + overview (alertas + novos) |
| `/app/ops/firms` | `GET /api/platform-ops/firms` |
| `/app/ops/firms/:id` | `GET /api/platform-ops/firms/:id` |
| — | `POST .../firms/:id/suspend` · `reactivate` · `extend-trial` · `cancel` |
| `/app/ops/audit` | `GET /api/platform-ops/audit-logs` |
| `/app/ops/logins` | `GET /api/platform-ops/login-attempts` · `POST .../clear-lockout` |
| `/app/ops/sentry` | `GET /api/platform-ops/sentry/issues` |
| — | `GET /api/platform-ops/export/:kind` (`firms`\|`audit`\|`logins`) |

**Entrada:** `/app/ops` sem sessão → `/auth/ops/login`.  
Label de ambiente: derivado de `FRONTEND_URL` (staging vs production).

### Acções de gabinete (onda 2)

| Acção | Comportamento | Audit |
|-------|---------------|-------|
| Estender trial | `{ days }` ou `{ trialEndsAt }` → `trial_ends_at`; status `TRIAL` se ACTIVE/TRIAL | `platform_ops.firm.extend_trial` |
| Cancelar | Confirmação = nome exacto → `CANCELLED` + desactivar `firm_users` + revogar refresh sessions. **Sem** hard-delete fiscal. | `platform_ops.firm.cancel` |

## Alertas de abuso (overview)

Regras determinísticas (sem ML):

| Código | Severidade | Gatilho |
|--------|------------|---------|
| `LOCKOUTS` | high | Contas com `locked_until` activo |
| `LOGIN_FAIL_SPIKE` | high | ≥5 falhas na última hora (contas) |
| `FIRM_REGISTER_BURST` | high | ≥5 gabinetes novos em 24h |
| `FIRMS_NEW_24H` | low | 1–4 novos em 24h |
| `AUTHZ_SPIKE` | medium | Muitos eventos authz/login falhado no audit (24h) |
| `AUDIT_SPIKE` | medium | ≥200 eventos audit / 24h |
| `TRIALS_EXPIRING` / `SUSPENDED_FIRMS` | low/medium | Operacional |

## Geo-IP

- Tabela `ip_geo_cache` (ip → country_code, updated_at).
- Lookup server-side (ipapi.co, rate-limited); falha aberta → país null.
- UI Logins: colunas IP + país.

## Sentry

- Pré-requisito UAT: `SENTRY_DSN` no Render staging.
- Opcional para lista no painel: `SENTRY_AUTH_TOKEN`, `SENTRY_ORG_SLUG`, `SENTRY_PROJECT_SLUG`.
- Sem token → página com hint + links se org/project existirem.
- Scrub alinhado a `docs/infrastructure/OBSERVABILITY.md`.

## Ondas

| Onda | Conteúdo |
|------|----------|
| **0** | Authz + overview + listas + UI shell |
| **1** | Filtros, detalhe, suspend/reactivate, clear lockout, CSV, anomalias base |
| **2 (esta)** | Modo 1A novos gabinetes · trial/cancel · geo-IP · abuso · Sentry link-out · red-team staging |
| **3** | Denylist IP na edge (Cloudflare/Render) + endurecimento |
| **4+** | Crescimento (NPS outbound, campanhas, usabilidade) — **fora** desta onda |

## Configuração staging (Render)

```bash
PLATFORM_OPS_ENABLED=true
PLATFORM_OPS_EMAIL_ALLOWLIST=afdigitalweb.st@gmail.com
SENTRY_DSN=...
# opcional para issues no painel:
SENTRY_AUTH_TOKEN=
SENTRY_ORG_SLUG=
SENTRY_PROJECT_SLUG=
```

Migration: `20261026220000_ip_geo_cache.sql` (aplicar em staging antes do UAT geo).

## Checklist red-team (só staging)

Ver `docs/product/CONTROL_CENTER_REDTEAM_STAGING.md`.

## Fora de âmbito (onda 2)

- Gate duro `pending_review`
- Impersonation
- NPS outbound / campanhas / heatmaps de usabilidade
- Denylist IP na edge (só doc + sinais)
- Hard-delete de dados fiscais
- Substituir Sentry
