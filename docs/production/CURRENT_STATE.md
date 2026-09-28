# Estado actual do Teglion (produção)

**Actualizado:** 28/09/2026  
**Branch de produção:** `main` (`401d7e8` — merge PR #102)  
**Uso comercial:** **5 escritórios** cadastrados e a utilizar o sistema em produção (`www.teglion.com` / API Render).

Este ficheiro é o **snapshot operacional** mais recente. Checklists históricos (ex. [`../historico/FINAL_MAIN_RELEASE_GATE_2026-08-21.md`](../historico/FINAL_MAIN_RELEASE_GATE_2026-08-21.md)) ficam como registo; não reflectem o presente.

---

## Capacidade e escala (ordem de grandeza)

| Dimensão | Estado actual | Notas |
|----------|---------------|--------|
| Escritórios (tenants) | **5** | Piloto comercial activo; meta imediata ~10 |
| Arquitectura | Monólito modular (Node + React + Supabase) | Adequado para dezenas de escritórios numa instância API |
| Schedulers | `setInterval` horário por processo API | OK com 1 instância Render; duplicar instâncias exige locks (futuro) |
| Multi-tenant | `firm_id` na app + teste de isolamento | Ver [`../security/TENANT_ISOLATION.md`](../security/TENANT_ISOLATION.md) |

---

## Releases recentes (main)

| PR | Conteúdo |
|----|----------|
| #97–#98 | Dependências backend (npm audit) |
| #99–#100 | Alertas cliente (detalhe, anexos), UX cofre/password, validade documentos + lembretes 5 dias |
| #101–#102 | Banner trial `FIRM_OWNER`, utils + testes; fix typecheck metadata documentos |

---

## Testes automatizados (evidência local 28/09/2026)

| Suite | Resultado |
|-------|-----------|
| Backend `node --test` | **652** testes, 97 ficheiros |
| Frontend Vitest | **224** testes, 48 ficheiros |
| `npm audit` (prod deps) | **0** vulnerabilidades (backend + frontend) |
| `tsc --noEmit` | OK |

---

## Infraestrutura crítica

| Componente | Produção | Staging / CI |
|------------|----------|----------------|
| Supabase prod (`teglion-production`) | Deve estar **ACTIVE_HEALTHY**; pausa = `ENOTFOUND` e login **500** | Projeto `teglion-staging` (`xscriwhchdblmwmpglby`) — **reactivar** para CI e teste local de isolamento |
| GitHub Actions | Job `validate` pode falhar se **billing da conta GitHub** estiver bloqueado (não é falha de código) | Secrets `STAGING_SUPABASE_*` obrigatórios para tenant isolation no CI |
| Redis | Rate limit partilhado quando saudável; fallback in-memory por instância | Ver logs `NOSCRIPT` / Sentry `[rate-limit]` |
| Vercel + Render | Frontend + API | Deploy automático em merge `main` |

---

## Teste de isolamento multi-tenant (local)

Comando: `npm run test:tenant-isolation -w backend`

- Usa `SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY` do **`.env` local** (muitas vezes apontam para staging).
- Se o host Supabase estiver **pausado ou inexistente**, falha com `getaddrinfo ENOTFOUND …supabase.co` — **não é regressão de código**; é ambiente.
- **Nunca** apontar este teste para produção (grava dados sintéticos).

Passos: reactivar projeto staging no painel Supabase **ou** usar credenciais de um projecto de dev dedicado; confirmar DNS (`ping` / resolver) antes de re-correr.

Aviso estático conhecido (não bloqueia por defeito): `service-inquiries.repository.js:172` — rever se `id` já vem validado no call site.

---

## Prontidão comercial (5 → 10 escritórios)

**Pronto hoje:** isolamento testado (quando staging activo), MFA/cofre, CSRF, billing/trial, portal cliente, documentos com validade.

**A fechar sem bloquear piloto:** backup restore trimestral registado; UAT formal MFA/vault em browser; staging sempre activo para CI; alertas Supabase/Render/GitHub pagos; runbook Supabase pausado (ver [`../operations/INCIDENTS.md`](../operations/INCIDENTS.md)).

---

## Onde actualizar a seguir

Alterou produto, segurança ou ops → actualizar este ficheiro + [`PRODUCTION_READINESS_CHECKLIST.md`](./PRODUCTION_READINESS_CHECKLIST.md) + [`../ROADMAP.md`](../ROADMAP.md) (secção «Onde estou»).
