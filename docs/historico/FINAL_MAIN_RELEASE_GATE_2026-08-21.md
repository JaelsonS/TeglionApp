# FINAL MAIN RELEASE GATE — 21/08/2026 (auditoria independente)

**Código auditado:** `origin/staging` @ `eeaadf3` (= merge de `5916b2b` `fix/main-release-blockers`)  
**Working tree do agente:** `fix/main-release-blockers` @ `5916b2b` + 4 docs untracked de rascunho  
**Produção / DNS / migrations remotas:** **intocados**  

> **Addendum 24/08/2026** — sessão de hardening final corrigiu o P1 da §2 (`ServiceFullEditorSheet.tsx` agora
> preserva `dateOverrides` ao guardar, com teste de regressão) e os achados F-01 a F-05/F-08/F-10 da
> `Final Production Readiness Audit`, incluindo um achado novo (replay do challenge JWT de MFA) encontrado
> durante essa correcção. Decisão actualizada: ver `docs/production/PRODUCTION_READINESS_CHECKLIST.md`.
> Este ficheiro fica como registo histórico do estado em 21/08 — não editei o resto do corpo abaixo.

---

## 0. Decisão (histórica — ver addendum acima para o estado actual)

============================================================
**NOT READY FOR MAIN** *(em 21/08 — corrigido em 24/08, ver addendum)*
============================================================

Há **0 P0 de segurança** no código desta ponta (vault 10m purpose-bound, Gate 2, MFA, tenant isolation live aprovado).

Há **1 P1 de perda de dados** confirmado no fluxo Agenda ↔ editor de serviço — critério §20: P1 de corrupção/perda de dados **bloqueia** main.

Relatórios anteriores que diziam READY / READY WITH FOLLOW-UP **não** são a decisão desta auditoria.

---

## 1. Git

| Item | Valor |
|------|--------|
| Branch agente | `fix/main-release-blockers` |
| HEAD | `5916b2b` |
| `origin/staging` | `eeaadf3` (PR #82 merged) |
| `origin/main` | `b277736` |
| Commits `main..staging` | **26** |
| Working tree | 4 untracked docs de auditoria/draft |

---

## 2. Blocker P1 (obrigatório antes do merge) — CORRIGIDO 24/08/2026

| ID | Área | Evidência | Correcção |
|----|------|-----------|-----------|
| P1-AGENDA-DATEOVERRIDES | Agenda / serviços | `ServiceFullEditorSheet.tsx` chama `bookingOverridesPayload(true, schedule)` **sem** `dateOverrides` e envia sempre `bookingOverrides` no PATCH → apaga excepções por dia do serviço. `AgendaServiceHoursPanel` já passa `dateOverrides` correctamente. | ✅ Extraído `computeServiceBookingOverridesPatch` (`serviceBookingAvailability.ts`), que preserva `dateOverrides` já guardado; 4 testes de regressão em `serviceBookingAvailability.test.ts` |

---

## 3. Segurança (código)

| Área | Estado | Nota |
|------|--------|------|
| MFA | PASS (código) | Owner obrigatório; staff opcional; refresh/SSO gate; copy autenticador |
| Vault | PASS | TTL **10m**; purposes `vault_reveal` / `vault_mutate` / `vault_import`; list sem plaintext |
| Sensitive actions | PASS | `confirmSensitiveAction` no backend (email, password, close, team, …) |
| Tenant isolation | PASS (live) | Script: **24 pass / 0 fail** (HTTP API_BASE skip = aviso) |
| CSRF | PASS | Double-submit |
| Rate limit Gate 1 | PASS | `nav-badges` 180s; tab hidden; MFA/vault fora da skip-list |

### Residuais não bloqueadores de merge (após P1)

| Sev | Item |
|-----|------|
| P1 residual | Challenge JWT `jti` não consumido (reuso ≤5m + rate limit) |
| P2 | Billing checkout/portal sem Gate 2 |
| P2 | `setMyVaultPassword` sem MFA mesmo com MFA on |
| P2 | Copy MFA challenge menciona e-mail, não SMS |
| P2 | Contagem `openTasks` na lista de clientes usa só `client_id` legado |

---

## 4. Produto

| Área | Estado |
|------|--------|
| Tasks M2M | PASS* (todos os creates escrevem links; gap P2 na lista clientes) |
| Services / groups | PASS |
| Images focus/zoom (público) | PASS |
| Agenda | **FAIL** até P1-AGENDA |
| Public page accordion | PASS (path `/{slug}`) |
| Subdomain `{slug}.teglion.com` | N/A — só arquitectura; **não** blocker |
| Demo AFDigital staging | FOLLOW-UP conteúdo (2 serviços, 0 grupos) — não segurança |

---

## 5. Schema

| Ambiente | Objectos F1/F2/MFA/focus | Ledger `202610*` |
|----------|--------------------------|------------------|
| Staging | Presentes | **0** rows (68 total) |
| Production | Presentes | **0** rows (24 total) |

**Classificação:** WARNING / DOCUMENTATION — **não** reaplicar DDL; repair de ledger só com plano escrito pós-main.

---

## 6. Testes (números desta sessão)

| Suite | Resultado |
|-------|-----------|
| Backend `src/**/*.test.js` | **565 pass / 0 fail** |
| Frontend vitest | **181 pass / 0 fail** (42 files) |
| `tsc --noEmit` | **PASS** |
| `npx vite build` | **PASS** |
| `npm run build:spa` (seo:generate via tsx) | **FAIL ambiente** (EPERM IPC tsx) — build SPA via vite OK |
| `test:security-static` | **PASS** (0 falhas) |
| `test:tenant-isolation` | **24 pass / 0 critical** |
| MFA/vault UAT manual staging | **NOT EXECUTED** nesta sessão |
| Smoke 429 15–30 min | **NOT EXECUTED** nesta sessão |

---

## 7. Critérios §20 vs estado

| Critério | Cumpre? |
|----------|---------|
| P0 = 0 | Sim |
| MFA sem bypass óbvio | Sim (residual jti) |
| Vault curto + purpose | Sim |
| Sensitive no backend | Sim |
| Tenant isolation | Sim (script) |
| Tasks M2M | Sim* |
| Services/groups/public | Sim |
| Agenda a funcionar | **Não** (P1 wipe) |
| Sem regressão crítica conhecida | **Não** (P1) |

---

## 8. Próximo passo (sem merge)

1. Corrigir P1-AGENDA-DATEOVERRIDES numa branch `fix/…` → PR → staging.  
2. UAT agenda: excepções por dia no serviço → editar serviço no sheet → confirmar que overrides persistem.  
3. Smoke MFA/vault humano em staging.  
4. Só então: checklist + PR `staging → main` + aprovação humana.

**NÃO** merge em main nesta auditoria.
