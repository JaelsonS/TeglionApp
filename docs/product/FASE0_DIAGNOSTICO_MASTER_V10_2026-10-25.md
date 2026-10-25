# Fase 0 — Diagnóstico Teglion (Master Prompt V10)

**Tipo:** diagnóstico somente leitura (sem alterações de código nesta fase).  
**Data:** 25/10/2026  
**Aprovado para documentação:** sim (plano Cursor «Fase 0 Diagnostico V10»).  
**Próximo passo autorizado:** só após aprovação explícita da **Fase 1** (especificação).

| Ref | SHA curto | Nota |
|-----|-----------|------|
| Branch de trabalho | `feature/fase-v10-ops-fiscal` @ `a4f0852` | Workspace no diagnóstico |
| Staging remoto | `origin/staging` @ `26116d5` | PR #192 merged — ondas 1–7 em UAT |
| Produção (`main`) | `826c868` | Sem menu V10 (Pagamentos / Rendas / SAF-T / Calculadoras) |

**Decisão default (até contradizer):** após Fase 1, implementação em **paralelo fino** — (2a) estabilização preview/API/docs e (2b) UX nav+Pagamentos+hub Calculadoras — sem repaginação 100% nem Control Center nessa onda.

Carta de produto da frente Ops+Fiscal: [`V10_OPS_FISCAL_CHARTER.md`](./V10_OPS_FISCAL_CHARTER.md).  
Roadmap canónico: [`../ROADMAP.md`](../ROADMAP.md).

---

## 1. Resumo executivo do estado real

O Teglion é um monólito modular (React/Vite + Node/Express + Supabase Postgres) em produção com cerca de **5 escritórios**, MFA, Stripe Connect/billing, portal do cliente e Maya. A frente **Ops+Fiscal V10** (avenças/pagamentos, seis calculadoras de simulação, rendas internas, SAF-T só leitura, Manual `/manual`) está **confirmada em staging** (`26116d5`); **não** está em `main`.

A crítica de UX (menu com seis “Calculadora *”, Pagamentos com grelha densa / “caixa” feia, falta de ações rápidas) está **confirmada no código** ([`frontend/src/features/firm/firmNavConfig.ts`](../../frontend/src/features/firm/firmNavConfig.ts), [`PaymentsWorkspace.tsx`](../../frontend/src/features/firm/payments/PaymentsWorkspace.tsx)).

Lacunas grandes do master prompt — **Control Center AfDigital**, **registo com aprovação interna**, **monitorização em tempo real / bloqueio de IP na edge** — **não existem** no produto. Existe admin intra-escritório, `audit_logs`, rate-limit e lockout por conta.

Documentação canónica de inventário/estado (`FEATURES.md`, `CURRENT_STATE.md`, secções gerais do `ROADMAP.md` datadas 28/09/2026) está **atrás** do código V10; a carta V10 e o router da branch/staging estão alinhados.

---

## 2. Inventário das funcionalidades existentes

Legenda: **C** = confirmado no código · **T** = confirmado por testes (ficheiro) · **S** = confirmado em staging (deploy/merge) · **P** = confirmado em produção/`main` · **H** = hipótese · **NV** = não verificado nesta passagem · **A** = ausente

| Capacidade | Estado | Evidência |
|------------|--------|-----------|
| Clientes + hub | **C** **P** | `FirmClientsPage`, `FirmClientHubPage`, `clients.repository.js` |
| Documentos / pedidos | **C** **P** | `documents/`, portal cliente |
| Tarefas + obrigações | **C** **T** **P** | `tasks-workspace`, `TasksObligationsView`; testes `tasks-workspace.service.test.js` |
| Vista mês fiscal N/M | **C** **S** | `/app/firm/tasks/month`, `TasksFiscalMonthPanel.tsx` |
| Agenda / booking | **C** **T** **P** | `FirmAgendaPage`, `booking/`; `booking.service.test.js` |
| Serviços / IRS captação | **C** **P** | `/app/firm/irs`, accounting-services |
| Calendário fiscal | **C** **T** (doc: PARCIAL) | `FirmFiscalCalendarPage`; `firm-fiscal-calendar.service.test.js` |
| MFA TOTP | **C** **T** **P** | `mfa.service.js`; `mfa.service.test.js` |
| Google OAuth (SSO firm) | **C** **T** **P** | `google-sso.service.js` |
| CSRF + step-up | **C** **T** **P** | `csrf.middleware.js`, `step-up.service.js` |
| Stripe Connect + billing SaaS | **C** **T** **P** | `connect/`, `billing/` |
| Maya | **C** **P** | `FirmLayout` + `maya-setup/` |
| Pagamentos / avenças | **C** **T** **S** (não **P**) | `PaymentsWorkspace.tsx`, `fee-charges/`, migration `20261025000000_*`; `fee-charges.service.test.js` |
| Calculadoras IVA/IRS/SS/retenção/IMT/IRC | **C** **T** **S** | `/app/firm/calculators/*`, `fiscal-engine/`; `*-math.test.js`, `v10-fiscal-security.audit.test.js` |
| Imóveis / rendas internas | **C** **T** **S** | `rentals/`, migration `20261025070000_*` |
| SAF-T leitura (XXE-safe) | **C** **T** **S** | `saft/`, migration `20261025080000_*`; `saft-xml-safe.test.js` |
| Manual público `/manual` | **C** **T** **S** | `features/manual/`; `manual-links.test.ts`, `publicRoutes.test.ts` |
| Control Center plataforma | **A** | Sem rotas `/platform`; docs históricos |
| Registo com aprovação AfDigital | **A** | `registerFirm` self-service + confirmação de email |
| SIEM / blocklist IP global | **A** | `audit_logs` + login lockout; sem tabela/middleware de IP block |
| Emissão / comunicação AT oficial | **A** (fora de escopo consciente) | Carta V10 §1 e §4 |

---

## 3. Mapa dos principais módulos e dependências

```text
Browser (Vercel)
  → frontend FirmLayout + firmNavConfig + ContabilAppRouter
  → /api (rewrite) → backend Render (Express mount-api-routes)
       → auth (JWT cookie, MFA, CSRF)
       → firm-domain (clients, tasks, fee-charges, fiscal, rentals, saft, …)
       → Supabase Postgres via service_role (+ Storage)
```

| Camada | Paths principais |
|--------|------------------|
| Nav firm | `frontend/src/features/firm/firmNavConfig.ts` |
| Shell | `frontend/src/features/firm/FirmLayout.tsx` |
| API mount | `backend/src/routes/mount-api-routes.js`, `contabil/firm-domain.routes.js` |
| Auth | `backend/src/modules/auth/`, `middlewares/auth.middleware.js`, `csrf.middleware.js` |
| Domínio V10 | `modules/fee-charges`, `fiscal-engine`, `rentals`, `saft` |
| Repos | `backend/src/db/supabase/repositories/*` |

**Dependência crítica:** isolamento multi-tenant = **aplicação** (`.eq('firm_id', …)`), não RLS no path API (`service_role`). Ver [`../architecture/MULTI_TENANCY.md`](../architecture/MULTI_TENANCY.md).

---

## 4. Avaliação dos riscos de segurança conhecidos

| Risco | Classificação | Mitigação actual / residual |
|-------|---------------|-----------------------------|
| Query sem `firm_id` no path `service_role` | Confirmado arquitectural | Testes unitários + `tenant-isolation-test.js` (CI condicional a secrets staging) |
| Preview Vercel `/api` → fallback prod | Confirmado em `frontend/vercel.json` | Rewrite OK para `staging.teglion.com`; previews `*.vercel.app` sem «staging» no host podem ir a prod |
| Engines Node inconsistentes | Confirmado (`package.json` root/backend/frontend) | Runtime Render efectivo **NV** |
| CI `validate` falha por billing Actions | Confirmado no PR #192 | Merge staging com override admin; gate de qualidade enfraquecido |
| Self-signup sem aprovação interna | Confirmado ausência de fila | Superfície de abuso / spam de gabinetes |
| Sem block IP na edge | Confirmado ausência | Rate-limit + lockout conta apenas |
| Conteúdo fiscal em calculadoras tratado como “oficial” | Risco de produto | Copy de simulação na carta V10 — reforçar UX na Fase 2b |

---

## 5. Estado confirmado e não confirmado dos problemas anteriormente identificados

| Item | Estado |
|------|--------|
| Staging escreveu em produção via `/api` | **Corrigido no código** (rewrite condicional); residual em previews sem host staging — ver [`../infrastructure/DEPLOYMENT.md`](../infrastructure/DEPLOYMENT.md) |
| Descrição de serviços a desaparecer | **Regressão coberta por testes** (`accounting-services.service.test.js`); runtime staging/prod **NV** nesta passagem |
| Runtime Node no Render | **NV** (painel) |
| Staging isolado de prod | **Documentado** + health API staging OK em 25/10/2026; valores de env nos painéis **NV** |
| Isolamento cross-tenant | **T** forte ao nível serviço/repo; HTTP E2E no CI só com secrets |
| Migrations `20261025*` em `schema_migrations` | **NV** — tabelas podem ter sido aplicadas à mão em staging/prod |
| Contagens de testes no ROADMAP (652+224) | **Provavelmente desatualizadas** pós-V10 — **NV** nesta passagem |

---

## 6. Funcionalidades que podem ser reutilizadas

- Autenticação completa: MFA, OAuth Google, CSRF, step-up, rate-limit, lockout.
- Shell e design system firm (`FirmModuleShell`, padrões de empty/error a melhorar pontualmente).
- Módulos V10 já em staging: `fee-charges`, `fiscal-engine`, `rentals`, `saft`, Manual.
- Maya + Manual (voz / allowlist de links).
- `audit_logs` + permissões de equipa intra-escritório.
- Stripe Connect / Billing SaaS.
- Padrões de teste de isolamento `firm_id` (replicar em qualquer tabela nova).

---

## 7. Lacunas que exigem desenvolvimento

| Lacuna | Prioridade lógica pós-Fase 0 |
|--------|------------------------------|
| Hub **Calculadoras** (1 item de menu) + UI componente partilhada | 2b (UX fino) |
| Redesign **Pagamentos** (lista legível, ações por linha) | 2b |
| Quick actions (ex. IRS → calculadora) | 2b |
| Estabilização preview API / engines / docs / `schema_migrations` / CI | 2a |
| Centro Operacional Unificado | Fase 3 |
| Endurecer 1 ferramenta fiscal com revisão profissional + fontes AT | Fase 4 (não reinventar as 6) |
| Control Center AfDigital | Fase 5 |
| Registo com aprovação obrigatória (email + Google) | Fase 6 |
| Monitorização, correlação, bloqueio IP efectivo | Fase 7 |
| NPS / campanhas / retenção | Fase 8 |
| Extratos bancários / exportações ERP | Fase 9 |
| Comunicação AT de rendas / certificação | Fase 10 (legal) |
| Landing onda 8 + consolidação comercial | Charter V10 + Fase 11 |

---

## 8. Arquitectura-alvo preliminar

- **Manter** monólito modular; novos domínios em `backend/src/modules/*` + `frontend/src/features/firm/*`.
- **Nav:** um destino `/app/firm/calculators` (hub); deep-links `/calculators/iva|irs|…` mantidos.
- **Calculadoras:** motor em `fiscal-engine`; UI partilhada (`CalculatorShell`, disclaimer de simulação, histórico); embutível como componente / quick-action.
- **Control Center:** rota privada + autorização **backend** (allowlist AfDigital ou role plataforma já existente — decidir na Fase 1); reutilizar MFA, step-up, `audit_logs`; sem segundo stack de auth.
- **Registo:** estados `pending_review` → approve/reject; OAuth **não** contorna; grandfathering de pilotos — decidir na Fase 1.
- **Monitorização:** começar por `audit_logs` + Sentry; bloqueio de IP só se aplicado no middleware Render (não só tabela órfã).
- **Sem** microserviços, novas BD ou SIEM pagos sem justificação de custo.

---

## 9. Roadmap faseado (remapeado à realidade)

O master prompt propunha Fases 0–11. Ajustes porque **V10 ops/fiscal + Manual já estão em staging**:

| Fase | Objectivo | Estado |
|------|-----------|--------|
| **0** | Diagnóstico (este documento) | `CONCLUÍDO` (documentação) |
| **1** | Especificação: UX nav/Pagamentos/hub + guião entrevista + AC/testes + decisões §11 | `BLOQUEADO` — aguarda aprovação explícita |
| **2a** | Estabilização (preview API, Node, docs FEATURES/CURRENT_STATE, migrations history, CI) | Após Fase 1 |
| **2b** | UX fino: menu Calculadoras, Pagamentos, 1–2 quick actions | Após Fase 1 (paralelo fino com 2a) |
| **3** | Centro Operacional Unificado | Planejado |
| **4** | Validação profissional de **uma** ferramenta fiscal (não recriar as 6) | Planejado |
| **5–7** | Control Center, aprovação registo, monitorização/incidentes | Planejado |
| **8–11** | Retenção/NPS, imports, AT oficial, consolidação | Planejado |

**Esforço qualitativo:** 2a+2b = S–M · Fase 3 = M · 5–7 = L · 8–11 = L+ (custos fornecedor só com aprovação).

---

## 10. Estimativa qualitativa de esforço, complexidade e custo

| Bloco | Esforço | Complexidade | Custo recorrente extra |
|-------|---------|--------------|------------------------|
| 2a Estabilização | S | Baixa–média | €0 (config existente) |
| 2b UX Pagamentos + hub calc | S–M | Média (UI + regressão) | €0 |
| Fase 3 Centro Operacional | M | Média–alta (integração de sinais) | €0 se reutilizar dados |
| Fase 5–6 Control Center + aprovação | L | Alta (authz + fluxos) | Email já (Brevo) |
| Fase 7 Monitorização / IP | M–L | Alta se edge/block | Evitar SIEM novo |
| Fase 8 NPS/campanhas | M | Média | Possível custo email/volume |
| Fase 9–10 Imports / AT | L+ | Alta + legal | Avaliar por integração |

---

## 11. Decisões necessárias antes da Fase 1

1. Confirmar **paralelo fino** (2a+2b) vs segurança-first estrito vs UX-first total.
2. Promoção staging → `main` **só** após UAT (owner + Liliane) — fora desta Fase 0.
3. Modelo Control Center: allowlist emails AfDigital vs role `PLATFORM_OWNER` (já referida no código de roles).
4. Registo com aprovação: todos os novos gabinetes vs a partir de data X (pilotos grandfathered).
5. Orçamento: reutilizar Sentry; **não** contratar SIEM/filas na Fase 7 sem aprovação de custo.
6. Quem revê regras fiscais antes de marcar uma calculadora como “validada internamente” (Fase 4).

---

## 12. Lista explícita do que não foi possível verificar

- Painéis Vercel / Render / Supabase (env vars reais, versão Node no Web Service Render).
- Execução da suíte completa de testes nesta sessão de diagnóstico.
- UAT funcional completo em staging (health API e login headless OK; Pagamentos observado por screenshot do utilizador).
- Presença das migrations `20261025*` em `schema_migrations` (staging e prod).
- Conteúdo operacional de `audit_logs` em staging/prod.
- Revalidação em runtime do bug histórico de descrição de serviços.
- Contagem exacta actual de testes backend/frontend pós-V10.
- Se GitHub Actions billing continua a bloquear o job `validate`.

---

## Feedback UX (validado — fora de implementação nesta fase)

- **Pagamentos:** grelha anual densa; coluna de cliente apertada; poucas ações rápidas por linha.
- **Menu:** seis entradas Calculadora* em `FIRM_NAV_GROUPS` / `FIRM_NAV_RAIL_MAIN` — alvo: um item «Calculadoras» + hub.
- **Ações contextuais:** ex. módulo IRS sem botão directo para calculadora; calculadoras como **componentes** reutilizáveis, não só páginas.

**Viabilidade:** sim, sem reescrita — consolidar nav, hub + `CalculatorShell` sobre `fiscal-engine`, redesenhar `PaymentsWorkspace`. Spec na Fase 1; código na 2b.

---

## Gate de fases

| Fase | Autorização |
|------|-------------|
| 0 Diagnóstico + este documento | Concluída |
| 1 Especificação | **Requer** mensagem explícita do owner («aprovo Fase 1» / equivalente) |
| 2a / 2b Implementação | **Requer** aprovação da Fase 1 |
| Push / PR / merge / deploy / migrations partilhadas | **Requer** autorização por acção concreta |

---

*Documento gerado no âmbito do Master Prompt V10 · AfDigital — Soluções Tecnológicas · Produto Teglion · teglion.com*
