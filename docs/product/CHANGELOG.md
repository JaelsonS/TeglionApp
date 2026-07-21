# Teglion — Changelog

**Documento oficial · Última actualização: Julho 2026**

Histórico de evolução do Teglion. Entradas em ordem cronológica inversa.

Formato baseado em [Keep a Changelog](https://keepachangelog.com/).

---

## [Unreleased]

### Dívida técnica — Sprints 1–4 (Jul 2026)
- **Arquitectura Etapa 1:** `modules/client/portal/` subpasta com barrel; `portal.service.js` = compat; `modules/README.md` + plano `ARCHITECTURE_REORGANIZATION.md`
- **Portal facade:** hub + booking extraídos; `portal.service.js` ~20 linhas
- **Sprint 2:** dashboard optimizado (só obrigações abertas, counts head-only, sync OVERDUE throttled 5min, cache TTL 45s); `benchmark:dashboard`
- **Sprint 3:** testes `firm-dashboard.stats` + `portal-hub.helpers` (29 testes BE); middleware `X-Response-Time`
- **Sprint 4:** `ttl-cache.js`, `redis-queue.js` + worker no boot; health com estado Redis

### Dívida técnica (Jul 2026)
- **`portal.service.js`:** extraídos `portal-hub.helpers.js`, `portal-client.guard.js` (~970 → ~883 linhas); 7 testes unitários novos

### Estratégia (Jul 2026)
- **Roadmap reestruturado:** `ROADMAP.md` reescrito — de SaaS de gestão contábil para **plataforma de crescimento para escritórios de contabilidade na Europa** (10 fases, 6 pilares, plano 24 meses, métricas norte)
- **Backlog master:** novo `ROADMAP_BACKLOG.md` com 350 melhorias categorizadas (A–K)
- **Visão actualizada:** `VISION.md` alinhado com posicionamento Europa 2031

### Limpeza (Fase 1)
- **Etapa 1.1:** Removidas cópias duplicadas/obsoletas em `docs/visual-baseline/`
- **Etapa 1.2:** Documentação reorganizada em pastas temáticas (`product/`, `engineering/`, `security/`, `design/`, `operations/`, `content/`, `qa/`, `ai/`, `international/`) com README por pasta
- **Etapa 1.3:** Código morto frontend (lote 1): removidos `MetricCard`, `PageShell`, `legacy-print.css`, `#print-area-root`; desinstalados 5 pacotes npm não usados; `button.jsx` migrado para `button.tsx` com tipos TypeScript
- **Etapa 1.4:** Código morto (lote 2): removidos `authApi.login()`, `registerAdmin()`, `AuthContext.login`; `PublicAdSense` renomeado para `BlogAdSense`; removidos `AppRouter` wrapper e `isTeglionMode()`; removido endpoint órfão `GET /contabil/activity` e cliente frontend associado
- **Etapa 1.5:** Permissões legacy renomeadas (`PATIENTS_MANAGE` → `FIRM_CLIENTS_MANAGE`, `EXAM_TYPES_*` → `FIRM_ACCOUNTING_SERVICES_*`); removidos `DOCTORS_*` e `EXAM_*` não usados; removidos endpoints API `POST /login-clinic` e `POST /login-patient` (redirects frontend mantidos)
- **Etapa 1.6:** Limpeza completa domínio clínica: papéis JWT `CLIENT`/`CONSULTANT`/`FIRM_*`, permissões `FIRM_READ`/`FIRM_CONSULTATIONS_*`; removidos `clinicId`/`patientId` do código activo; removido alias `/api/patient-portal` e rotas URL legacy (`/login-clinic`, etc.)
- **Etapa 1.7:** Navegação portal cliente — alertas, notícias e agendamento na sidebar; alertas na barra inferior mobile; badges de não lidos
- **Etapa 1.8:** Link «Casos de sucesso» no footer da landing → `/case-studies`
- **Etapa 1.2 (deps):** Removidos `@dnd-kit/sortable` e `libphonenumber-js` (órfãos; telefone via `react-phone-number-input`)
- Links actualizados em `docs/` e `README.md` raiz
- Removido `docs/.DS_Store`; pasta `docs/deploy/` absorvida por `operations/`

### Documentação
- Criação da documentação oficial do produto (CTO docs):
  - VISION.md, ARCHITECTURE.md, PRODUCT.md, ROADMAP.md
  - MODULES.md, DATABASE.md, API.md, SECURITY.md
  - DESIGN_SYSTEM.md, MULTI_COUNTRY.md, AI.md
  - CODING_STANDARDS.md, CHANGELOG.md

### Arquitectura (Fase 2)
- **2.1:** `services/api.ts` reduzido a 75 linhas; cliente HTTP em `services/http/` (`apiBase`, `apiClient`, `csrf`, `documentAssets`); `authApi` e `consentsApi` separados
- **2.2:** `contabil.repository.js` → facade; domínios em `repositories/contabil/` (obligations, tasks, documents, firm-dashboard, audit, mappers)
- **2.3:** `contabil.routes.js` → facade; sub-routers em `routes/contabil/` (cron, billing, firm-domain)
- **2.6:** `CountryConfig` registry PT + BR stub (`frontend` + `backend`)
- **2.7:** Rotas duplicadas em `/api/v1/*`; `/api/*` com headers `Deprecation` + `Link`
- **2.8:** Root `package.json` com npm workspaces
- **Extra:** Playwright smoke E2E; Stripe webhook idempotência (`stripe_webhook_events`); CI `check-file-sizes.mjs`
- **2.5 (parcial):** Namespace `contabil` registado no i18next (ponte para migrar `contabilPt.ts`)

### Padronização (Fase 3) — em curso
- **3.2:** E2E Playwright smoke (5/5) — servidor via `build:spa` + `preview` (fix esbuild/Radix no dev)
- **3.10:** `.env.example` em `frontend/` e `backend/`
- **3.1:** `billing-access.test.js` — 7 testes (trial, ACTIVE, map Stripe)
- CI: job `frontend-e2e`; testes billing no backend
- `vite.config.ts`: `optimizeDeps.esbuildOptions.target = esnext` (fix `npm run dev` com Node 26)

### Planeado (Fase 3 — restante)
- ESLint limites; E2E fluxo piloto completo; god files; migrar `contabilPt`

---

## [2.0.0] — 2026-06

### Produto
- Redesign corporate do escritório + portal cliente premium
- Consolidação de rotas (sem `?tab=` entre módulos)
- Blog SEO: 27 artigos, prerender estático, sitemap/RSS automáticos
- Landing, pricing, security, case studies pages
- Workspace de tarefas unificado (obrigações + manual + calendário + kanban)

### Técnico
- TypeScript frontend: 124 → 0 erros de compilação
- AuthProvider + CSP corrigidos em produção
- Migração para cookie-only auth (sem tokens em sessionStorage)
- Argon2id para passwords (migração bcrypt no login)
- Lockout de conta (5 falhas / 15 min)
- Magic bytes validation em uploads
- PostgREST injection fix
- Audit logs para auth, documentos e hub cliente
- Rate limiting com Redis (produção)
- Tenant isolation tests
- Cloudinary removido — Supabase Storage único
- Limpeza de código morto e env legado (Saúde/WhatsApp/Mongo)

### Infra
- Deploy produção: Vercel (frontend) + Render (backend) + Supabase
- CI: build + tsc + testes unitários backend
- Sentry (frontend + backend)
- PWA com Workbox

### Segurança
- Auditoria AppSec completa (ver SECURITY.md)
- CSRF double-submit
- Helmet + CSP
- Log sanitization
- Login security service

---

## [1.5.0] — 2026-05

### Produto
- Módulo de obrigações fiscais com templates e recorrência
- Calendário fiscal PT (JSON + geração automática de anos)
- Service requests (pedidos de serviço/orçamentos)
- Broadcasts e news para clientes
- Booking e consultorias (agenda)
- Push notifications (VAPID)
- Live events (long-poll)
- Automações básicas (regras cron)

### Técnico
- 26 migrations SQL incrementais
- Módulo fiscal com providers
- Integração AT fase 1 (deep-links)
- Activity events e content views
- SMS via Brevo
- Stripe billing (código)

---

## [1.0.0] — 2025–2026

### Produto
- **Migração de produto:** Teglion (clínicas/saúde) → ContaBil (escritórios de contabilidade)
- Portal do escritório: clientes, documentos, tarefas, mensagens
- Portal do cliente: upload, pedidos, obrigações
- Auth: registo escritório, convite cliente, login, recuperação password
- Multi-tenant por `firm_id`

### Técnico
- Stack: React + Vite + Express + Supabase
- Repository pattern (sem ORM)
- JWT auth custom (não Supabase Auth)
- Email via Brevo
- Supabase Storage para documentos
- RLS no PostgreSQL
- i18n pt-PT

### Infra
- GitHub Actions CI
- Deploy Vercel + Render

---

## [0.x] — 2024–2025

### Produto (era Teglion Saúde)
- SaaS para clínicas: pacientes, consultas, exames, prontuários
- Portal do paciente
- Facturação clínica

### Técnico
- Stack inicial: React + Node + MongoDB (migrado para Supabase)
- Auth com clinic/patient model

> **Nota:** Código legacy da era saúde ainda presente em permissões, aliases e redirects. Remoção planeada na Fase 1 do roadmap.

---

## Convenções deste changelog

### Categorias

- **Produto** — funcionalidades visíveis ao utilizador
- **Técnico** — alterações de código e arquitectura
- **Infra** — deploy, CI, monitoring
- **Segurança** — controlos e auditorias
- **Documentação** — docs oficiais

### Versionamento

| Versão | Significado |
|--------|-------------|
| MAJOR | Breaking changes (API, auth, migrations) |
| MINOR | Novas funcionalidades |
| PATCH | Bug fixes, melhorias menores |

---

## Relação com outros documentos

| Documento | Conteúdo |
|-----------|----------|
| [ROADMAP.md](./ROADMAP.md) | O que vem a seguir |
| [STATUS.md](../operations/STATUS.md) | Estado operacional actual |
| [VISION.md](./VISION.md) | Visão de longo prazo |
