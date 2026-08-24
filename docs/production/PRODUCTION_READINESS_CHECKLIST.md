# Production Readiness Checklist — Teglion

**Actualizado:** 24/08/2026 (sessão de hardening final, sobre a auditoria independente de 21/08)  
**Código:** `fix/main-release-blockers` (a promover para `staging` nesta sessão)  
**Decisão actual:** ver relatório final da sessão de 24/08 — **READY WITH CONDITIONS**, condicionado ao UAT
autenticado ao vivo (secções G–H, I, J, K, M continuam NOT TESTED — não há credenciais reais disponíveis
nesta sessão para as validar em browser)

Legenda: `PASS` | `FAIL` | `BLOCKED` | `NOT TESTED` | `NOT APPLICABLE`

---

## A. Git

| Item | Status | Nota |
|------|--------|------|
| Trabalho fora de `main` | PASS | |
| Staging contém MFA + Gate1/2 + vault harden | PASS | PR #82 |
| `main` alinhado com staging | FAIL | 26 commits atrás |
| Sem force-push / repair prod | PASS | política |

## B. CI

| Item | Status | Nota |
|------|--------|------|
| CI staging verde | NOT TESTED | verificar Actions antes do PR main |
| Hooks locais | NOT TESTED | |

## C. Backend

| Item | Status | Nota |
|------|--------|------|
| Unit tests | PASS | **586/586** (24/08, +21 desde 21/08: F-01, F-04, F-05, F-08, F-10, replay MFA) |
| Security static | PASS | |
| Tenant isolation script | PASS | **24/0** (API_BASE skip) |

## D. Frontend

| Item | Status | Nota |
|------|--------|------|
| Vitest | PASS | **192/192** (24/08, +11 desde 21/08) |
| `tsc --noEmit` | PASS | |
| `vite build` | PASS | |
| `build:spa` completo (seo+tsx) | BLOCKED env | EPERM tsx IPC; vite build OK |

## E. Database

| Item | Status | Nota |
|------|--------|------|
| Staging schema coerente com app | PASS | objectos presentes |
| Prod schema tem F1/F2/MFA | PASS | app `main` ainda antiga |
| Ledger `202610*` | FAIL | 0 em stg e prod — repair depois |

## F. Migrations

| Item | Status | Nota |
|------|--------|------|
| Ledger ↔ ficheiros | FAIL | dessincronizado |
| Plano repair | BLOCKED | sem autorização; **não** blocker de código |

## G–H. Auth / MFA

| Item | Status | Nota |
|------|--------|------|
| Password + MFA gate (código) | PASS | |
| Owner MFA obrigatório | PASS | |
| Staff MFA opcional | PASS | |
| Challenge ≠ access token | PASS | |
| Challenge JWT anti-replay (jti) | PASS | 24/08 — achado novo durante o hardening, corrigido + testado |
| Código TOTP anti-replay (por-utilizador) | PASS | 24/08 — mesmo código não serve 2x (login, sensitive-action, vault) |
| Rate-limit MFA não multiplica por challenge novo | PASS | 24/08 — F-04, chave agora por identidade decodificada do JWT |
| UAT MFA live formal | NOT TESTED | obrigatório antes de main — sem credenciais reais nesta sessão |
| Copy autenticador | PASS | e-mail negado; SMS P2 |

## I. Tenant isolation

| Item | Status | Nota |
|------|--------|------|
| Script live Firm A≠B | PASS | 24 checks |
| HTTP cross-tenant com API_BASE | NOT TESTED | skip sem API_BASE |

## J. Vault / sensitive

| Item | Status | Nota |
|------|--------|------|
| Step-up 10m purpose-bound | PASS | |
| List sem plaintext | PASS | |
| Gate 2 backend | PASS | |
| Logout limpa step-up do cofre (sessionStorage) | PASS | 24/08 — F-02 |
| Reactivar membro exige o mesmo step-up que desactivar | PASS | 24/08 — F-01 (era o único achado HIGH) |
| Rotação da palavra-passe do cofre exige TOTP com MFA on | PASS | 24/08 — F-10 |
| UAT vault live | NOT TESTED | antes de main — sem credenciais reais nesta sessão |

## K. Rate limit

| Item | Status | Nota |
|------|--------|------|
| Gate 1 código | PASS | |
| Smoke 15–30 min | NOT TESTED | operador |

## L. Produto piloto

| Item | Status | Nota |
|------|--------|------|
| Tasks M2M | PASS | 24/08 — testes de regressão dedicados p/ createClientTask + updateTask (F-08) |
| Services / groups | PASS | 24/08 — grupo inactivo deixou de aparecer publicamente (F-05, testado) |
| Public accordion | PASS | path-based; confirmado agrupado, não lista plana |
| Agenda dateOverrides | **PASS** | 24/08 — P1 corrigido: `ServiceFullEditorSheet` preserva excepções ao guardar |
| Agenda: acessibilidade do calendário mensal | PASS | 24/08 — F-06, aria-label por dia; F-12, label do fuso horário |
| Images públicas | PASS | round-trip editor↔público confirmado no código |
| Subdomain | NOT APPLICABLE | fase posterior; `COOKIE_DOMAIN` de produção por confirmar (F-07) |
| Demo AFDigital rica | NOT TESTED / FOLLOW-UP | 2 svc / 0 groups — fora de escopo de segurança |

## M. Release ops

| Item | Status | Nota |
|------|--------|------|
| Backup prod DB | NOT TESTED | obrigatório pré-main |
| Rollback plan | NOT TESTED | |
| Aprovação humana | BLOCKED | até P1 + UAT |

---

## Gate mínimo para declarar READY

- [x] P1-AGENDA-DATEOVERRIDES corrigido e testado (24/08)
- [x] F-01 a F-05, F-08, F-10 corrigidos e testados (24/08)
- [ ] MFA UAT staging — precisa de operador com conta real
- [ ] Vault UAT staging — precisa de operador com conta real
- [ ] Agenda UAT (firm + per-serviço + guardar serviço) — precisa de operador
- [ ] Backup prod + rollback escrito
- [ ] Confirmar `COOKIE_DOMAIN` real de produção (F-07)
- [ ] PR staging → main + aprovação humana

Fonte de decisão: relatório final da sessão de hardening de 24/08/2026 (ver conversa/artefacto entregue ao founder).
`FINAL_MAIN_RELEASE_GATE_2026-08-21.md` fica como registo histórico do estado em 21/08.
