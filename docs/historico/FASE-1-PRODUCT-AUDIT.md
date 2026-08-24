# Teglion — Fase 1 · Product UX/UI + Security + Responsiveness + MayaIA

> **Arquivado em 19/08/2026, com uma atualização importante.** Este documento registrou originalmente (13/08/2026) o achado SEC-H1 — risco de um usuário STAFF se autopromover a FIRM_OWNER via `PATCH /team/:id`. Uma auditoria de segurança de 19/08/2026 confirmou, por leitura direta de `backend/src/modules/firm/team.service.js` e `team.service.test.js`, que esse risco **já foi corrigido** — commit `f1c3121` (13/08/2026), com guarda de código (`assertActorCanAssignRole`) e 8 testes automatizados passando. Ver `docs/security/AUTHORIZATION.md` para o detalhe completo. Este arquivo fica preservado como registro histórico da auditoria original; não é mais fonte de verdade sobre prioridades atuais — essa fonte é `docs/ROADMAP.md`.

**Tipo:** auditoria e planeamento (sem implementação)  
**Data:** 2026-08-13  
**Branch de contexto:** `staging` (Fase 0 em fecho de UAT)  
**Escopo:** diagnóstico, priorização e plano executável — **nenhuma alteração de código, Vercel, Render, Supabase, Stripe, Google ou produção** neste documento.

---

## 1. Executive Summary

A Fase 0 deixou o Teglion **tecnicamente sólido** no núcleo multi-tenant (sessão JWT, isolamento por `firm_id` da sessão, booking com exclusividade, CI de tenant isolation, gates de segurança). O produto, porém, ainda não comunica como um **SaaS profissional de escritórios**: a UI tem **dois (ou três) sistemas visuais em paralelo**, o IRS/Serviços são potentes mas cognitivamente pesados, o onboarding não fecha o caminho sozinho, e a Maya / Admin / MFA **não existem** no produto.

| Dimensão | Score (0–10) | Leitura |
|----------|--------------|---------|
| UX/UI | **5.5** | Tokens existem; adoção inconsistente; hierarquia e CTAs uneven |
| Security | **7.0** | Isolamento cross-tenant bom; escalação in-tenant e MFA ausente |
| Responsive | **6.0** | Shell firm/client pensado; tabelas e settings ainda frágeis em tablet |
| IRS | **6.5** | Hub existe e é útil; modelo mental ≠ “cálculo IRS”; editor pesado |
| Services | **6.5** | Catálogo + 2 filas + público; conversão e clareza ainda a melhorar |
| Public Pages | **7.0** | Segurança slug-first boa; empty states e naming fracos |
| Blog | **6.0** | 33 posts PT-relevantes; overlap e gaps de ICP escritório |
| Admin readiness | **2.0** | Sem área platform admin |
| MFA readiness | **1.5** | Explicitamente deferido; sem TOTP/recovery |
| MayaIA readiness | **2.0** | Design antigo (LLM); v1 guiada ainda por desenhar |

**Princípio norteador da Fase 1**

> Um utilizador novo deve perceber o que a tela faz, por que existe e qual é o próximo passo — sem explicação externa.

**Primeira implementação recomendada (ver § final):** fechar o **P0 de segurança in-tenant (escalação de role)** e, em paralelo imediato no mesmo sprint, **congelar e adoptar o Design System único** nas superfícies firm críticas — sem isso, cada melhoria de IRS/Serviços multiplica dívida visual.

---

## 2. UX/UI Score — **5.5 / 10**

### O que está bem

- Existe um núcleo de design system em `frontend/src/shared/design-system/` (Button, Input, Badge, EmptyState, PageHeader, PageLoading, ModuleHelpDialog, FirmModuleShell, FirmSplitView, UploadDropzone, …).
- Tokens CSS em `frontend/src/shared/styles/tokens.css` (brand navy, gold, semantic, radius, motion, tipografia).
- Guia por módulo via `ModuleHelpDialog` (“Como funciona?”) em IRS, Serviços, Agenda, Clientes, etc.
- Toast centralizado (Sonner) e ConfirmDialog partilhados.

### O que puxa o score para baixo

| Problema | Evidência | Impacto |
|----------|-----------|---------|
| Dual/triple brand | Tokens HSL + hex `#0F2942` em auth/landing + paleta blog/Literata | Marca inconsistente |
| Dual buttons | Shadcn `Button` vs `.cb-btn-*` vs `<button>` com gradient hardcoded | CTAs “não parecem o mesmo produto” |
| Dual cards | Shadcn Card vs `.cb-card` vs AuthCard `rounded-[2rem]` | Densidade visual aleatória |
| PageHeader ×3 | `design-system/`, `layout/`, `portal-cliente/` | Manutenção e hierarquia divergentes |
| CSS monolito | `contabil.css` ~3500 linhas | Overrides locais matam tokens |
| Onboarding incompleto | `invite: false` hardcoded em `FirmOnboardingWizard` | Wizard nunca completa o passo “convidar” |
| Editor de serviços | 5 tabs no `ServiceFullEditorSheet` | Barreira à publicação |

---

## 3. Security Score — **7.0 / 10**

### Controlos positivos (não regredir)

- `firm_id` / autorização derivados da **sessão JWT**, não do body do browser (`requireUserFirmId` / `contabil-scope.js`).
- Cookies httpOnly + CSRF double-submit; Bearer off por defeito.
- Público resolve firm por **slug**; Turnstile + rate limits em intake.
- Stripe webhooks com assinatura + idempotência.
- Storage privado; downloads via proxy autenticado com filtro `firm_id`.
- Erros de produção sem stack trace ao cliente.
- Helmet (backend) + CSP/HSTS/frame-deny (frontend `vercel.json`).
- CI de tenant isolation (fail-closed) documentado em `docs/06-SEGURANCA/SECURITY-GATES.md`.

### Riscos residuais (ver §12)

O score não sobe porque: (1) isolamento depende 100% da disciplina da app (`service_role` bypassa RLS); (2) **staff pode promover a FIRM_OWNER**; (3) MFA inexistente; (4) permissões default de staff amplas.

---

## 4. Responsive Score — **6.0 / 10**

| Breakpoint | Comportamento actual | Risco |
|------------|----------------------|-------|
| 1440 / 1280 | Sidebar firm desktop (≥ xl) | OK |
| 1024 | Ainda “mobile shell” (< xl) | Tablet com bottom nav + pouco espaço |
| 768 | Grids md; tabelas → scroll / mobile-cards | Depende de classes `cb-table-*` |
| 430 / 390 / 375 | Topbar + bottom nav | Forms longos e settings horizontais |

**Não** basta “encolher desktop”. Tablet (768–1279) precisa de layout próprio: sidebar colapsável ou rail, não apenas bottom nav de telemóvel.

---

## 5. IRS Score — **6.5 / 10**

IRS no Teglion **não calcula imposto** — é um **hub de campanha/captação** sobre serviços da categoria IRS (`FirmIrsPage` + pack no catálogo). Isso é correcto para o negócio, mas o nome e a IA visual ainda sugerem “módulo fiscal de declaração”.

**Pontos fortes:** KPIs, activação de modelos (Modelo 3 + anexos), ligação a publicação e intake público.  
**Pontos fracos:** editor pesado; pouca ligação explícita “serviço → solicitações”; calendário fiscal separado sem narrativa unificada; mobile = lista densa.

---

## 6. Services Score — **6.5 / 10**

Três superfícies: **Catálogo** · **Solicitações** (`service_inquiries`) · **Central** (`service_requests`). Potencial enorme para concentrar o que hoje está em WhatsApp/email — mas **duas filas com vocabulários de estado diferentes** confundem.

Oportunidades de utilização: publicar mais serviços no site, booking opcional, portal `/pedidos/:token`, quote PDF, pagamentos (Transferência ok; Multibanco/Stripe Connect ainda limitados).

---

## 7. Public Pages Score — **7.0 / 10**

Segurança e isolamento por slug estão maduros. UX: secções com naming invertido (`bookingServices` = sem booking), empty state silencioso (secção desaparece), URL pública pouco visível no onboarding.

---

## 8. Blog Score — **6.0 / 10**

**33 artigos** (não 29) — corpus maioritariamente PT-fiscal, pouco fluff de “transformação digital”. Gaps: overlap IVA/prazos, série incompleta, 1 post fora do ICP (estudantes), poucos artigos “produto Teglion” para aquisição de escritórios.

---

## 9. Admin Readiness — **2.0 / 10**

Não existe `/admin` de plataforma. “Admin” na nav firm = Definições + Billing. Role `PLATFORM_OWNER` no frontend é legado; backend trata `MASTER` → `FIRM_OWNER`.

---

## 10. MFA Readiness — **1.5 / 10**

Ausente (Sprint 0 itens MFA marcados como blocked/deferred). Sem TOTP, recovery codes, challenge pós-login, nem auditoria de enrolamento.

---

## 11. MayaIA Architecture (v1 — guiada, não generativa)

### Posicionamento

| Maya v1 (Fase 1) | Maya futura |
|------------------|-------------|
| Assistente guiada com respostas **pré-cadastradas** | LLM / RAG / Document Intel |
| Integrada ao **Guia** existente (`ModuleHelpDialog` + painel lateral) | Gateway `/api/v1/ai/*` |
| Zero acesso a dados sensíveis | Capabilities com RBAC + audit + cost tracking |

### UX — primeira entrada do Tenant Owner

1. Boas-vindas com **nome do utilizador**.
2. “Sou a Maya, assistente virtual do Teglion.”
3. “Ajudo a navegar e configurar o escritório — não vejo documentos nem dados privados.”
4. Chips de ajuda (intents):

| Intent (exemplos) | Resposta |
|-------------------|----------|
| Como configurar minha página? | Passos + deep-link Definições → Página pública |
| Como criar um serviço? | Catálogo → activar/publicar |
| Como funciona o IRS? | Hub IRS = campanha, não cálculo |
| Como configurar o booking? | Serviço + slots + agenda |
| Como configurar minha agenda? | Agendamentos |
| Como receber pedidos? | Solicitações + `/pedidos/:token` |
| Como funciona a faturação? | Billing / planos (alto nível) |
| Quero conhecer o Teglion. | Tour curto dos módulos |

### Arquitectura proposta (substituível por IA depois)

```
frontend/
  features/maya/
    MayaPanel.tsx          # sheet/drawer no FirmLayout
    MayaWelcome.tsx        # first-run (localStorage + flag user)
    MayaIntentList.tsx
    MayaAnswerView.tsx
    mayaContent.ts         # intents + answers versionados (ou fetch API)

backend/ (opcional já na v1)
  modules/maya/
    maya.controller.js     # GET /maya/intents, GET /maya/answers/:id
    maya.content.js        # JSON versionado; sem DB de tenant data
```

**Contrato de segurança (obrigatório):**

- Maya v1 **NÃO** lê: documentos, NIF de clientes, dados bancários, credentials, tokens, secrets, DB cross-tenant, tools admin, mensagens privadas.
- Respostas = conteúdo estático + **deep-links** internos.
- Telemetria: apenas `intent_id`, `firm_id` (sessão), timestamp — sem payloads de negócio.
- Evolução: mesmo `intent_id` / API shape; trocar `maya.content.js` por LLM adapter **sem** alargar o scope de dados sem revisão de segurança.

### Integração com Guia

- `ModuleHelpDialog` continua como ajuda **contextual do módulo**.
- Maya = ajuda **global + onboarding conversacional**.
- Evitar duplicar texto: ModuleHelp aponta “Perguntar à Maya” para intents relacionados.

---

## 12. Critical Security Findings

Severidade: **P0 CRITICAL** · **P1 HIGH** · **P2 MEDIUM** · **P3 LOW**

### P0 / P1

#### SEC-H1 — Staff pode escalar para `FIRM_OWNER` (in-tenant)
- **Severidade:** P1 HIGH (P0 se staff malicioso for cenário realista no piloto multi-utilizador)
- **Evidência:** `ALLOWED_ROLES` inclui `FIRM_OWNER` (`backend/src/modules/firm/team.service.js`); `PATCH /team/:id` só exige `USERS_UPDATE` (`firm-domain.routes.js`); `FIRM_STAFF` tem `USERS_UPDATE` / `USERS_CREATE` (`permissions.js`). `FIRM_MEMBER_ROLE_MANAGE` existe mas **não** é aplicado nestas rotas.
- **Impacto:** staff promove-se a owner → billing, settings, Connect, desactivar outros.
- **Exploração possível:** autenticado como staff, `PATCH` role=`FIRM_OWNER` no próprio ou outro membro.
- **Correcção:** exigir `requireFirmOwner` ou `FIRM_MEMBER_ROLE_MANAGE` para criar/alterar role `FIRM_OWNER`; staff nunca pode atribuir owner.

#### SEC-H2 — Isolamento só na aplicação (`service_role`)
- **Severidade:** P1 HIGH (arquitectural)
- **Evidência:** `getSupabaseAdmin()` com service role; RLS não está no caminho do request.
- **Impacto:** um `.eq('firm_id')` em falta = leak cross-tenant silencioso.
- **Correcção:** manter CI tenant-isolation fail-closed; revisão obrigatória em PRs; médio prazo: roles DB scoped.

### P2

| ID | Finding | Evidência | Correcção |
|----|---------|-----------|-----------|
| SEC-M1 | Refresh não revalida `is_active` | `contabil-auth.service.js` (login verifica; refresh não) | Reject refresh se inactive |
| SEC-M2 | Permissões default staff amplas | settings/team/invites em `FIRM_STAFF` | Least privilege |
| SEC-M3 | Helpers de comments sem `firm_id` | `listComments(requestId)` | Sempre filtrar firm |
| SEC-M4 | Sem MFA | Sprint 0 deferred | Plano §10 / Sprint 5 |
| SEC-M5 | Rate-limit fail-open se Redis cair | audit 2026-08-05 + docs | Fail-closed ou limite local |

### P3

| ID | Finding | Correcção |
|----|---------|-----------|
| SEC-L1 | RLS claim names ≠ JWT (`FIRM_CONSULTANT` vs `CONSULTANT`) | Alinhar se PostgREST+JWT algum dia |
| SEC-L2 | OAuth state / cron secret com `!==` | `timingSafeEqual` |
| SEC-L3 | `consultationId` em resposta pública | Omitir se FE não precisa |
| SEC-L4 | Logs ad-hoc sem sanitizer | `logger.safe` em toda a parte |

### Páginas públicas (secção 12 dedicada)

| Controlo | Estado |
|----------|--------|
| Dados privados via slug | Não (perfil público intencional) |
| IDs internos | Minimizados; UUID consulta ocasionalmente exposto (L3) |
| Documentos | Só com token portal `/pedidos/:token` |
| Spam / abuse | Turnstile + honeypot + rate limit |
| Cross-tenant | Firm resolvido por slug no servidor |
| Brute force tokens | Tokens longos (32/24 bytes hex) |

### Console / frontend secrets

- `VITE_*` observados: API URL, Sentry DSN, Turnstile **site** key, flags — **públicos por desenho**.
- Não tratar todo `VITE_` como secret; garantir que **nunca** entram: service_role, JWT secrets, Stripe secret, Brevo key.
- Stack traces: stripped em prod no middleware de erro.

### AUTH / cookies / JWT (resumo)

| Tema | Estado |
|------|--------|
| Access ~15m HS256 | OK |
| Refresh + jti hashed | OK |
| CSRF | OK (skip público + Stripe) |
| Google OAuth | state cookie + email_verified |
| Impersonation | **Não encontrado** — se algum dia existir, exige audit trail + MFA + time-box |

---

## 13. UX Findings

Regra: problema · impacto · proposta · prioridade · componente reutilizável.

### P0 — bloqueia utilização

| ID | Problema | Impacto | Proposta | Reutilizar |
|----|----------|---------|----------|------------|
| UX-P0-1 | Onboarding: passo `invite` sempre `false` | Wizard mente / nunca “completo” | Detectar convite enviado ou remover passo | `FirmOnboardingWizard`, `Progress` |
| UX-P0-2 | (segurança) Escalação role | Compromete confiança do tenant | Ver SEC-H1 | — |

### P1 — grande impacto

| ID | Problema | Impacto | Proposta | Reutilizar |
|----|----------|---------|----------|------------|
| UX-P1-1 | IRS sem subtítulo “captação” | Expectativa errada | PageHeader + intro ModuleHelp | `PageHeader`, `ModuleHelpDialog` |
| UX-P1-2 | Solicitações vs Central | Pedidos perdidos | Educação empty-state + labels de pipeline | `EmptyState`, `SegmentedControl` |
| UX-P1-3 | Editor 5 tabs | Escritório não publica | Wizard “Publicar em 3 passos” | `Progress`, `FirmModuleShell` |
| UX-P1-4 | Dual design systems | Produto “amador” | Adoptar tokens + Button/Card únicos | DS `Button`, `Card`, tokens |
| UX-P1-5 | URL pública escondida | Zero conversão site | Mostrar no onboarding + IRS/Serviços | `EmptyState` CTA |
| UX-P1-6 | Dashboard denso | Paralisia | Uma frase “próximo passo” + 3 KPIs primários | `DashKpi`, `PageHeader` |

### P2 — melhoria importante

| ID | Problema | Proposta | Reutilizar |
|----|----------|----------|------------|
| UX-P2-1 | PageHeader triplicado | Um só no DS | `design-system/PageHeader` |
| UX-P2-2 | Empty states inconsistentes | Sempre: o quê / porquê / CTA | `EmptyState` |
| UX-P2-3 | ClientHub “configure em Definições” errado | Link para Serviços/IRS | `EmptyState` |
| UX-P2-4 | Secções site mal nomeadas | Renomear booking vs services | `PublicSiteEditor` |
| UX-P2-5 | Auth/landing hex vs tokens | Migrar para `brand` | `Button` brand |
| UX-P2-6 | Toasts fora do padrão | `useApiToast` / Sonner único | RouteToaster |
| UX-P2-7 | Orphan `ServiceEditorSheet` | Remover ou wire | `ServiceFullEditorSheet` |

### P3 — refinamento

| ID | Problema | Proposta |
|----|----------|----------|
| UX-P3-1 | Radius misturados | Escala: sm/md/lg só |
| UX-P3-2 | Ícones Lucide uneven sizing | 16/20 padrão |
| UX-P3-3 | Loading skeletons incompletos | `Skeleton` / `PageLoading` |
| UX-P3-4 | Mensagens erro técnicas | Mapear códigos → PT humano |

---

## 14. Responsive Findings

| Área | 1440 | 1280 | 1024 | 768 | 430–375 | Prioridade |
|------|------|------|------|-----|---------|------------|
| Dashboard | OK | OK | KPI wrap frágil | scroll | cards empilhados | P1 |
| IRS | split OK | OK | sheet full | lista | densos CTAs | P1 |
| Serviços tabs | OK | OK | tabs overflow | stack | stack + FAB? | P1 |
| Booking/Agenda | OK | OK | min-widths | scroll | forms longos | P1 |
| Página pública | OK | OK | OK | OK | hero/CTA | P2 |
| Settings | OK | OK | nav snap | horizontal | difícil | P1 |
| Tabelas | scroll | scroll | scroll | mobile-cards* | cards* | P1 |
| Chat/Messages | OK | OK | split apertado | stack | stack | P2 |
| Onboarding | OK | OK | OK | OK | botões full-width | P2 |
| Blog | OK | OK | 1100px MQ | OK | OK | P3 |

\* Só se usarem `cb-table-scroll` / `cb-table-mobile-cards`. Auditar módulos que usam `<table>` nu.

**Comportamentos específicos a definir (não “só shrink”):**

1. **Tablet firm (768–1279):** rail de ícones + drawer labels (não bottom-nav de telemóvel).
2. **Mobile:** 1 coluna; sheets full-screen; KPIs em carrossel horizontal com snap.
3. **Forms:** secções accordion; sticky CTA “Guardar”.
4. **Public intake:** 1 campo por viewport quando possível; Turnstile no fim.

---

## 15. Blog Findings

### Inventário: 33 posts

Classificação Fase 1 (ICP = escritório pagante + funil PT):

| Class | Count | Acção |
|-------|------:|-------|
| KEEP | ~23 | Manter; refresh factual quando AT mudar |
| REWRITE | 4 | `calendario-fiscal-…`, `organizar-documentos-…`, `contabilidade-explicada-…`, `proteger-dados-…` |
| MERGE | 5 | `ferramentas-essenciais-…`→digitalizar/software; `prazos-irs-…`+`obrigacoes-mes-a-mes`→calendário; cluster IVA unificar |
| DELETE/ARCHIVE | 1 | `estudar-contabilidade-…` (fora ICP) |
| NEW | 4–5 | ver plano editorial |

### Plano editorial novo (perguntas reais PT)

1. **NEW** — “Primeiros 7 dias no escritório no Teglion” (fecha Sprint 1 §4).
2. **NEW** — “Como sair do WhatsApp: pedidos de documentos no portal”.
3. **NEW** — Cessação de actividade / fechar ENI.
4. **NEW** — Obrigações mensais/trimestrais da Lda após abertura.
5. Completar série `independente-2026` part 2 (re-series conteúdo existente se possível).

**Princípios:** intenção de busca concreta; linguagem humana; datas/limites AT verificáveis; CTA para escritório ou produto sem spam; zero “transformação digital genérica”.

---

## 16. Recommended Design System

### Princípios

1. **Uma marca, um conjunto de tokens** — app, auth, landing e blog partilham brand navy/gold; blog pode manter Literata só em headings de conteúdo.
2. **Componentes > classes soltas** — preferir `design-system/*` + shadcn; reduzir novos `.cb-*` ad-hoc.
3. **Empty state obrigatório** — título + 1 frase + 1 CTA.
4. **Hierarquia tipográfica** — só 4 níveis: display / title / body / caption (`tokens.css`).
5. **Um PageHeader** — título, subtítulo (porquê), acções primária/secundária, Guia.

### Tokens canónicos (já em `tokens.css` — adoptar, não reinventar)

| Token | Uso |
|-------|-----|
| `--cb-brand` | Primário / CTAs |
| `--cb-gold` | Destaque raro |
| `--cb-success/warning/danger/info` | Estados |
| `--radius` 0.75rem | Base; variantes via Tailwind |
| `--cb-shadow-card` / elevated | Elevação |
| `--text-*` | Tipografia |

**Deprecar gradualmente:** hex `#0F2942` em componentes; `AuthCard` radius exclusivo; PageHeaders duplicados; `.cb-btn-*` onde `Button` chega.

### Inventário reutilizável (não criar novos sem necessidade)

`Button`, `Input`, `Badge`, `EmptyState`, `PageHeader`, `PageLoading`, `Skeleton`, `Progress`, `FormField`, `EuroInput`, `ModuleHelpDialog`, `FirmModuleShell`, `FirmSplitView`, `MobileBottomNav`, `SegmentedControl`, `UploadDropzone`, `ConfirmDialog`, Dialog/Sheet/Select (ui/), Sonner toasts.

### Proposta de “Teglion DS v1” (documentar em PR futuro, não agora)

- Figma/spec leve: cores, type, spacing 4/8/12/16/24/32, button sizes, card anatomy, form anatomy, table→card mobile.
- Checklist PR: “usa tokens? EmptyState? focus ring? contraste?”

---

## 17. Prioritized Roadmap

### SPRINT 1 — Security + Design System + Critical UX

| # | Item | P |
|---|------|---|
| 1 | SEC-H1: bloquear escalação a FIRM_OWNER | P0/P1 |
| 2 | SEC-M1: `is_active` no refresh | P2↑ |
| 3 | Congelar DS: PageHeader único + Button/Card tokens nas shells firm | P1 |
| 4 | Fix onboarding invite step + URL pública visível | P0/P1 |
| 5 | EmptyState padrão nos hubs IRS/Serviços/Dashboard | P1 |
| 6 | Narrow staff defaults (SEC-M2) — decisão de produto | P2 |

**Saída:** segundo escritório não é bloqueado por confusão visual básica; staff não escala privilégio.

### SPRINT 2 — IRS + Services + Dashboard

| # | Item | P |
|---|------|---|
| 1 | Copy IRS = “Campanha / captação IRS” | P1 |
| 2 | Wizard publicar IRS/serviço em 3 passos | P1 |
| 3 | Cruzar Solicitações ↔ serviço/IRS | P1 |
| 4 | Educação dual-pipeline (Solicitações vs Central) | P1 |
| 5 | Dashboard: próximo passo + KPIs primários | P1 |
| 6 | Renomear secções página pública | P2 |

### SPRINT 3 — Responsive + Public Pages + Booking

| # | Item | P |
|---|------|---|
| 1 | Layout tablet dedicado (rail) | P1 |
| 2 | Auditoria tabelas sem `cb-table-*` | P1 |
| 3 | Settings mobile/tablet usável | P1 |
| 4 | Public empty states + CTA activar serviço | P1 |
| 5 | Intake mobile polish + sticky CTA | P2 |
| 6 | Booking: clareza “preferência vs confirmado” | P2 |

### SPRINT 4 — Maya v1 + Onboarding + Guide

| # | Item | P |
|---|------|---|
| 1 | Maya panel + welcome Owner + intents estáticos | P1 |
| 2 | Content pack PT (8+ respostas) | P1 |
| 3 | Hard security boundary (sem dados) | P0 |
| 4 | Onboarding guiado até 1º cliente + 1º pedido doc | P1 |
| 5 | ModuleHelp ↔ Maya deep-links | P2 |

### SPRINT 5 — Platform Admin + MFA

#### Platform Admin (mapa — não implementar ainda)

| Domínio | Capacidades |
|---------|-------------|
| Tenants | listar, status, suspender, notas suporte |
| Utilizadores | por tenant; staff plataforma |
| Subscriptions / planos | Stripe mirror, trials, dunning |
| Features / entitlements / limites | **separar de permissions** |
| Overrides | auditados, com expiração |
| Pagamentos | falhas, reembolsos (cuidado) |
| Saúde | uptime, jobs, Redis, filas |
| Auditoria / logs / métricas | append-only |
| Suporte | impersonation **só se** MFA + reason + TTL + audit |

**Roles (nunca misturar):**

| Actor | Scope |
|-------|-------|
| PLATFORM ADMIN | multi-tenant ops |
| TENANT OWNER | firm + billing firm |
| STAFF | permissões firm |
| CUSTOMER/CLIENT | portal |

**Permission ≠ Entitlement:** permission = “pode editar clientes”; entitlement = “plano inclui IRS hub / N utilizadores”.

#### MFA (plano)

| Tema | Decisão proposta |
|------|------------------|
| Método | TOTP (Authenticator) |
| Recovery | 8–10 codes one-time, hashed |
| Quem | Owner obrigatório; staff opcional depois |
| Activação | settings → enrol QR → confirm code |
| Challenge | pós-password / pós-Google se enrolled |
| Sessões | listar/revogar refresh sessions |
| Rate limit | tentativas TOTP |
| Auditoria | enrol / disable / challenge fail |
| Disable | re-auth + recovery ou suporte platform |

### SPRINT 6 — Blog / content + SEO

| # | Item |
|---|------|
| 1 | Executar KEEP/REWRITE/MERGE/DELETE |
| 2 | Publicar NEW product/case PT |
| 3 | Fechar gaps de séries |
| 4 | CTAs → registo escritório / página pública |
| 5 | Cadência: 1 new/semana + 1 pillar/mês |

---

## Anexos rápidos

### A. Performance (sinais)

| Sinal | Evidência | Acção Fase 1 |
|-------|-----------|--------------|
| Polling 60s | bell, obligations, access | Unificar scheduler; pausar tab hidden |
| Dual DOM firm shell | mobile+desktop montados | Avaliar single tree |
| Bundle | blog loaders já code-split | Manter; evitar importar blog no firm |
| N+1 risco | listagens + detalhes | Preferir workspace endpoints |
| Imagens | SafeImage / blog responsive | Lazy + sizes correctos |

### B. Acessibilidade (sinais)

| Tema | Estado | Acção |
|------|--------|-------|
| aria em shells/blog | Parcial (nav labels, dialogs) | Expandir forms firm |
| Focus ring | Depende Tailwind ring | Checklist DS |
| Labels | Mistura `sr-only` / visíveis | Forms críticos IRS/intake |
| Contraste | Brand navy OK; gold em texto? | Auditar gold-on-cream |
| Keyboard | Radix ajuda dialogs | Tabelas/actions menus |
| Erros em forms | Variável | `aria-invalid` + texto |

### C. Mapa de rotas (referência)

- Firm: `/app/firm/{dashboard,clients,documents,tasks,agenda,fiscal-calendar,messages,alerts,news,irs,services,settings,billing}`
- Client: `/app/client/{…}`
- Público: `/:firmSlug`, `/:firmSlug/servicos/:serviceSlug`, `/pedidos/:token`
- Blog: `/blog`, `/blog/:slug`
- **Sem** `/admin` plataforma

### D. Documentação relacionada

- `docs/06-SEGURANCA/*`, `docs/02-ROADMAP/SPRINT-0.md`, `SPRINT-1.md`
- `docs/03-PRODUTO/{IRS,SERVICOS,BOOKING,PAGINA-PUBLICA}.md`
- `docs/product/SERVICOS_IRS_REDESIGN_APPROVAL.md`
- UX e produto actuais: `docs/03-PRODUTO/*`, `docs/00-PRODUTO/*`

---

## QUAL É A PRIMEIRA COISA QUE DEVEMOS IMPLEMENTAR?

**Corrigir a escalação de privilégio staff → `FIRM_OWNER` (SEC-H1), e imediatamente a seguir (mesmo Sprint 1) adoptar o Design System mínimo + corrigir o onboarding (invite step + URL pública).**

### Porquê esta ordem

1. **Segurança primeiro:** o isolamento cross-tenant está maduro; o buraco mais grave residual é **dentro do tenant**. Um staff com permissões default pode tornar-se owner — isso mina billing, settings e confiança antes de qualquer polish de UI.
2. **Design System em seguida:** sem tokens/componentes únicos, cada melhoria de IRS/Serviços/Dashboard **cria mais inconsistência** e atrasa a percepção de SaaS profissional.
3. **Onboarding P0:** a Fase 1 e o Sprint 1 de receita exigem que um Owner novo **perceba o próximo passo sozinho**; o wizard com `invite: false` e URL pública escondida bloqueia valor percebido sem precisar de features novas.

Maya, Admin e MFA são estratégicos, mas **não** são o primeiro commit: dependem de base segura e de uma UI estável onde a Maya e o Guia se encaixem.

---

*Fim da auditoria Fase 1 — documento de planeamento apenas. Nenhuma alteração de aplicação foi feita além da criação deste ficheiro.*
