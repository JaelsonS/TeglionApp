# Production Readiness Checklist — Teglion

**Actualizado:** 28/09/2026  
**Snapshot:** [`CURRENT_STATE.md`](./CURRENT_STATE.md) — **5 escritórios** em produção; `main` alinhado com releases #97–#102.  
**Testes locais (28/09):** backend **652/652**, frontend **224/224**, `tsc` OK, `npm audit` 0 (prod).

Legenda: `PASS` | `FAIL` | `BLOCKED` | `NOT TESTED` | `NOT APPLICABLE`

---

## A. Git e release

| Item | Status | Nota |
|------|--------|------|
| Fluxo staging → main | PASS | PRs #101 (feature) → #102 (promoção staging→main), Set/2026 |
| `main` desactualizado vs staging | PASS | Após #102, `main` inclui banner trial + fixes recentes |
| Force-push / repair prod | PASS | Política mantida |

## B. CI

| Item | Status | Nota |
|------|--------|------|
| Workflow `validate` (`.github/workflows/ci.yml`) | BLOCKED | Conta GitHub Actions pode falhar por **billing locked** — job nem arranca |
| Tenant isolation no CI | NOT TESTED | Depende de secrets + projecto **staging ACTIVE** |
| Hooks locais | NOT TESTED | Opcional |

## C. Backend

| Item | Status | Nota |
|------|--------|------|
| Unit tests | PASS | **652/652** (97 ficheiros `*.test.js`) |
| Security static | PASS | `npm run test:security-static -w backend` |
| Tenant isolation (script) | NOT TESTED | Local 28/09: `ENOTFOUND xscriwhchdblmwmpglby` — staging pausado/inactivo |

## D. Frontend

| Item | Status | Nota |
|------|--------|------|
| Vitest | PASS | **224/224** (48 ficheiros) |
| `tsc --noEmit` | PASS | |
| `vite build` | PASS | CI/Vercel preview OK nos PRs recentes |

## E. Database

| Item | Status | Nota |
|------|--------|------|
| Prod schema vs app | PASS | Migrations document expiry (`20261014000000_*`) aplicadas prod+staging (sessão Set/2026) |
| Ledger migrations | A VALIDAR | Checklist antigo citava dessincronia — rever [`../database/MIGRATIONS.md`](../database/MIGRATIONS.md) antes de declarar PASS |

## F. Auth / MFA

| Item | Status | Nota |
|------|--------|------|
| Password + MFA + anti-replay | PASS | Código + testes (ver [`../security/MFA_FASE4.md`](../security/MFA_FASE4.md)) |
| UAT MFA live formal | NOT TESTED | Recomendado após cada release major |

## G. Tenant isolation

| Item | Status | Nota |
|------|--------|------|
| Script repositório/serviço | NOT TESTED | Bloqueado por Supabase staging inactivo localmente |
| HTTP layer (`API_BASE`) | NOT TESTED | Opcional no script; CI não define `API_BASE` |
| View tracking cross-tenant (0.1) | PASS | Corrigido Ago/2026 — `.eq('firm_id', firmId)` em leituras |

## H. Vault / sensitive

| Item | Status | Nota |
|------|--------|------|
| Step-up + gates | PASS | Testes de regressão (F-01, F-02, F-10, etc.) |
| UAT vault live | NOT TESTED | Operador com conta real |

## I. Rate limit / Redis

| Item | Status | Nota |
|------|--------|------|
| Redis em produção | A VALIDAR | Fallback in-memory se Redis falhar; monitorizar Sentry |
| Smoke 15–30 min | NOT TESTED | Operador |

## J. Produto piloto (5 escritórios)

| Item | Status | Nota |
|------|--------|------|
| Portal cliente + alertas + documentos | PASS | Release #99–#100 |
| Banner trial owner | PASS | Release #101–#102 |
| Demo staging rica (seed/polish scripts) | NOT APPLICABLE | Scripts locais opcionais; não blocker |

## K. Release ops

| Item | Status | Nota |
|------|--------|------|
| Backup prod DB + drill | NOT TESTED | Último drill documentado Ago/2026 — repetir trimestral |
| Rollback plan | NOT TESTED | Ver [`../infrastructure/DEPLOYMENT.md`](../infrastructure/DEPLOYMENT.md) |
| Runbook Supabase pausado | PASS | Incidente 28/09/2026 em [`../operations/INCIDENTS.md`](../operations/INCIDENTS.md) |

---

## Gate mínimo para **10 escritórios** (comercial)

- [x] Multi-tenant com teste automatizado (código + CI quando staging activo)
- [x] Auth/MFA/cofre endurecidos (Fase 0)
- [x] Billing/trial + Stripe em produção
- [ ] Staging Supabase **sempre activo** + CI verde
- [ ] Backup restore drill registado (< 90 dias)
- [ ] UAT browser (owner + contabilista + cliente) por release major
- [ ] Alertas de faturação Supabase + GitHub + Render

Registo histórico: [`../historico/FINAL_MAIN_RELEASE_GATE_2026-08-21.md`](../historico/FINAL_MAIN_RELEASE_GATE_2026-08-21.md) (Agosto 2026).
