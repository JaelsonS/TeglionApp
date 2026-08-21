# FINAL MAIN RELEASE GATE — 21/08/2026

**Branch de trabalho:** `fix/main-release-blockers` → PR para `staging`  
**Baseline staging anterior:** `e0f85da`  
**Decisão:** ver §0

---

## 0. Decisão

============================================================
**READY WITH FOLLOW-UP FOR MAIN**
============================================================

Interpretação operacional: **staging pode promover-se a main** após:

1. Merge deste PR em `staging` + deploy staging  
2. Smoke MFA/vault/team/tasks (5–10 min)  
3. Confirmação visual AFDigital demo (conteúdo) — **não bloqueia segurança**

Não há P0/P1 de segurança conhecidos por corrigir após este PR.  
**Não** fazer merge automático. Operador abre `staging → main`.

Alternativa literal do pedido: se exigires checklist 100% (demo rica + smoke 429 30 min documentados pelo operador), o estado seria **BLOCKED** só por processo — não por falha de código. Classificação técnica: **READY WITH FOLLOW-UP**.

---

## 1. Tabela obrigatória

| AREA | STATUS | EVIDÊNCIA | BLOCKER? |
|------|--------|-----------|----------|
| MFA | READY | UAT manual utilizador + código challenge/refresh/recovery; middleware rejeita challenge JWT | Não |
| 429 | READY WITH FOLLOW-UP | Gate 1 código + unit poll≥180s; smoke 15–30 min **operador** (não reexecutado nesta sessão) | Não (código) |
| Vault | READY | TTL **10m** purpose-bound; list sem plaintext; unlock em reveal/mutate/import; FE sessionStorage por purpose | Não |
| Sensitive Actions | READY | Matriz Gate 2 + invites + email membro + create-member FE | Não |
| Tasks M2M | READY | `createClientTask` escreve links; `updateTask` valida `clientIds`; metrics `topClients` via M2M | Não |
| Services | READY | groups + option_links; admin UI | Não |
| Public Page | READY WITH FOLLOW-UP | Accordion por grupo (colapsado); merge não-adjacente; path `/{slug}` | Não |
| Agenda | READY | Código Fase 3 em staging; UAT visual prévio | Não |
| Tenant Isolation | READY WITH FOLLOW-UP | firmId em services; UAT A/B autenticado **operador** | Não (código) |
| CSRF | READY | Staging writes sem CSRF → 403 | Não |
| Rate Limit | READY | Auth limiter activo; MFA/vault **não** na skip-list | Não |
| Audit Logs | READY | REDACT_KEYS (totp, recovery, password, tokens, revealedValue) | Não |
| Frontend | READY | tsc + 181 tests + build:spa | Não |
| Backend | READY | **565/565** tests | Não |
| Build | READY | `npm run build:spa` OK | Não |
| Migrations | READY WITH FOLLOW-UP | Objectos F1/F2/MFA existem em **stg e prod**; ledger `schema_migrations` desalinhado | Não (repair pós-main) |
| Schema Drift | WARNING / DOCUMENTATION | Ver §2 — **não** reaplicar migrations cegas | Não para merge |
| Demo AFDigital | READY WITH FOLLOW-UP | Tenant existe; conteúdo rico **não** seedado nesta sessão | Não segurança |
| Google Calendar | NOT IN SCOPE | Connected ≠ synchronized | Não |
| SMS | NOT IN SCOPE | Billing futuro documentado | Não |
| Pricing | NOT IN SCOPE | €45/€479 futuro; sem alteração | Não |
| DNS / wildcard | NOT IN SCOPE | Código path OK; subdomain só docs | Não |

---

## 2. Schema drift (stg / prod)

| Ambiente | Objectos F1/F2/MFA (task_links, groups, option_links, image_focus, mfa_enabled) | Ledger `schema_migrations` |
|----------|----------------------------------------------------------------------------------|----------------------------|
| Staging | **Existem** | Sem versões `202610*` (só até `20260821…`) |
| Production | **Existem** | ~24 rows; desalinhado face ao repo |

**Classificação:** DOCUMENTATION / WARNING — **não BLOCKER** para main porque o código encontra as colunas/tabelas.  
**Não** executar repair em produção nesta etapa.  
Plano separado: reconciliar ledger com `INSERT` idempotente das versões já aplicadas (pós-main, autorização explícita).

---

## 3. Bloqueadores corrigidos neste PR

| Problema | Risco | Correção |
|----------|-------|----------|
| Vault JWT 8h sem purpose | Reveal → mutate/import 8h | TTL 10m + claim purpose |
| PATCH team email sem step-up | ATO via recovery | `team_member_email_change` + revoke sessions |
| POST /team/invites sem step-up | Bypass create-member | `team_member_create` |
| createClientTask sem M2M | Tarefas obrigação invisíveis | Insert em `client_task_client_links` |
| updateTask clientIds sem validação | Cross-tenant link via admin | `findClientById` por firm |
| Create-member FE sem TOTP | UX inconsistente | SensitiveActionConfirmFields |
| Public groups adjacência | Accordions partidos | Merge por heading + colapsado |

---

## 4. Main vs staging

- `origin/staging` ~**24 commits** à frente de `origin/main` (MFA, Gate1/2, F0–F3, security).  
- `origin/main` tem só merge commits extra (não código divergente relevante).  
- Diff ~320 ficheiros / +17k linhas — **esperado** (Fases 0–4 + hardening).  
- Nenhum commit experimental óbvio a remover; fixtures debug não encontradas no diff de segurança.

---

## 5. Fora de âmbito (depois)

- Google Calendar sync completo  
- SMS créditos / billing  
- Pricing €45/€479 + add-ons  
- Wildcard `{slug}.teglion.com` DNS/Cloudflare/Vercel prod  
- Demo AFDigital conteúdo editorial completo  
- Repair ledger `schema_migrations` em produção  

---

## 6. Testes (números reais — esta sessão)

```
Backend:  565 pass / 0 fail
Frontend: 181 pass / 42 files
tsc:      pass
build:spa: pass
```

---

## 7. Instruções staging → main (manual)

1. Merge PR `fix/main-release-blockers` → `staging`; aguardar deploy Render/Vercel staging.  
2. Smoke: login MFA owner; vault reveal≠mutate; criar/convidar membro com TOTP; tarefa multi-cliente; página pública grupos.  
3. Abrir PR `staging` → `main` no GitHub.  
4. Revisar diff + CI.  
5. Backup DB produção (snapshot Supabase).  
6. Merge (humano).  
7. Deploy produção (Vercel/Render já ligados a `main`).  
8. Smoke prod: health, login, MFA challenge, nav-badges, 1 vault reveal.  
9. Monitorizar Sentry / 429 / erros 5xx 30–60 min.  
10. Rollback: revert merge + redeploy commit anterior `main` se P0.

---

## 8. Rollback

- App: redeploy commit anterior em `main`.  
- DB: **não** DROP MFA/M2M; apenas não usar features se rollback de código.  
- Sem migration destrutiva neste release.
