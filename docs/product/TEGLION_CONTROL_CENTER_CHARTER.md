# Teglion Control Center (AfDigital Ops)

**Estado:** onda 3 Defesa (denylist IP) em curso → `feature/fase-ops-center-wave3-denylist`; ondas 1–2 em `main` / produção (gated por env)  
**Operador:** AfDigital — Soluções Tecnológicas (não inventar entidade jurídica «Teglion»)  
**Ambiente de trabalho:** staging = ensaio de produção (mesmas regras de authz e audit).

## Objectivo

Painel interno onde o operador AfDigital (blue + red team):

- vê **todos os gabinetes** (incl. novos 24h/7d) e actividade recente;
- **gere** estado: suspender / reactivar / **estender trial** / **cancelar** (sem hard-delete fiscal);
- lê **audit logs**, tentativas de login (**IP + país** quando lookup ok);
- acompanha **alertas de abuso** e **Sentry** (link-out ± API);
- gere **denylist IP** (bloqueio na API Render);
- exporta CSV;
- **não** usa um segundo stack de auth — reutiliza sessão firm + MFA + allowlist.

## Modelo de segurança (não negociável)

1. **Gate de ambiente:** `PLATFORM_OPS_ENABLED=true` (só com literal `true`).
2. **Allowlist de um único email:** `PLATFORM_OPS_EMAIL_ALLOWLIST` (exactamente 1). 0 ou >1 → 503.
3. **Sessão existente:** cookie HttpOnly da app firm (sem Bearer em prod). A conta ops é um `firm_user` anfitrião **só para auth** — não é um gabinete comercial.
4. **MFA TOTP obrigatória** na conta do operador.
5. **Isolamento de UI:** contas `platformOps` aterraram em `/app/ops` e **não** usam `/app/firm/*` (excepto Definições/MFA).
6. **Clientes do portal** nunca acedem.
7. **Todas as leituras/ações** do Center geram `audit_logs` com `firm_id` null e `actor_role=PLATFORM_OPS`.
8. **Sem** service role no browser; geo-IP só no backend (`ip_geo_cache`).
9. **Denylist IP:** tabela `ip_denylist` + middleware Express (Render). Cloudflare WAF sync = endurecimento futuro (mesma fonte de verdade Postgres).
10. Gabinete anfitrião (`internal_ops` / slug `afdigital-ops`) **não** pode ser suspenso/cancelado/trial pelo Center.
11. **Dados no Center:** metadados apenas. **Excluir:** NIF, emails de clientes, documentos, conteúdo fiscal, hashes, recovery codes.

## Registo de gabinetes — modo 1A

- **Não** bloquear `/auth/firm/register`.
- **Não** existe `pending_review` nesta onda.
- Overview + lista: badge «Novo» 24h/7d; resposta = suspender ou cancelar.

## Rotas

| UI | API |
|----|-----|
| `/auth/ops/login` | login firm + UI dedicada |
| `/auth/ops/mfa` | desafio / enrollment MFA |
| `/app/ops` | overview (alertas + novos + denylist count) |
| `/app/ops/firms` · `/:id` | lista/detalhe + suspend/reactivate/extend-trial/cancel |
| `/app/ops/audit` | audit-logs |
| `/app/ops/logins` | login-attempts · clear-lockout |
| `/app/ops/denylist` | `GET/POST /ip-denylist` · `POST .../revoke` |
| `/app/ops/sentry` | sentry/issues |
| — | `GET /export/:kind` |

### Denylist IP (onda 3)

| Regra | Detalhe |
|-------|---------|
| Fonte | `ip_denylist` (activo se `revoked_at` null) |
| Bloqueio | Middleware API → `403 IP_DENIED` (cache ~30s) |
| Isentos | `/health`, `/api/health`, webhooks Stripe |
| Rejeitados na UI/API | IPs privados/loopback/link-local |
| Audit | `platform_ops.ip_denylist.add` / `.revoke` |
| Emergência | Se bloqueares o teu IP: outro rede ou `UPDATE ... SET revoked_at=now()` via service role |
| Cloudflare | Documentado; sync WAF **não** nesta entrega (evita dependência de token CF) |

## Alertas de abuso (overview)

Inclui `LOCKOUTS`, `LOGIN_FAIL_SPIKE`, `FIRM_REGISTER_BURST`, `AUTHZ_SPIKE`, `AUDIT_SPIKE`, `IP_DENYLIST`, trials/suspended.

## Geo-IP

- `ip_geo_cache`; lookup server-side (ipapi.co); UI Logins: IP + país.

## Sentry

- `SENTRY_DSN` + opcional `SENTRY_AUTH_TOKEN` / org / project.

## Ondas

| Onda | Conteúdo |
|------|----------|
| **0–1** | Authz, listas, gestão básica |
| **2** | 1A novos · trial/cancel · geo · abuso · Sentry · red-team |
| **3 (esta)** | Denylist IP (Postgres + middleware Render) + UI/audit |
| **3b** | Espelhar denylist no Cloudflare WAF (quando houver token/conta) |
| **4+** | Crescimento (NPS, campanhas, usabilidade) |

## Configuração staging (Render)

```bash
PLATFORM_OPS_ENABLED=true
PLATFORM_OPS_EMAIL_ALLOWLIST=afdigitalweb.st@gmail.com
SENTRY_DSN=...
SENTRY_AUTH_TOKEN=
SENTRY_ORG_SLUG=
SENTRY_PROJECT_SLUG=
```

Migrations: `ip_geo_cache`, `ip_denylist` (aplicar em staging antes do UAT denylist).

## Checklist red-team

Ver `docs/product/CONTROL_CENTER_REDTEAM_STAGING.md`.

## Soft launch comercial (29/10) e escala

Ver `docs/operations/GTM_READINESS_29OCT.md`.

| Fase | Volume | Regra |
|------|--------|--------|
| Semana 1 | ≤50 firms | Soft launch; Sentry; Center gated em prod |
| Semana 2–4 | 50–150 | 2.ª instância API **só** com Redis partilhado OK |
| Mês 2+ | 150+ | pooling / edge denylist (3b) conforme carga |

**Regra de ouro:** não fazer scale-out horizontal sem Redis — rate limits e lockouts partem-se entre instâncias.

Load drill staging: `backend/scripts/load-drill-staging.js` (resultado 27 Out: `PASS_WITH_COLD_START`).

## Fora de âmbito (onda 3)

- Gate `pending_review`, impersonation, NPS/campanhas massivas no dia D
- Sync automático Cloudflare (3b)
- Hard-delete fiscal
- Merge experimental para `main` no dia da divulgação
