# Teglion — Arquitectura

**Documento oficial · Última actualização: Julho 2026**

Este documento define a **arquitectura alvo** do Teglion — como o sistema deve estar organizado para suportar milhares de escritórios e centenas de milhares de clientes durante muitos anos.

Descreve o estado **ideal**. O estado actual está documentado em [MODULES.md](../product/MODULES.md) com classificações de maturidade.

---

## Princípios arquitecturais

| Princípio | Regra |
|-----------|-------|
| **Simplicidade** | Monólito modular bem organizado > microserviços prematuros |
| **Multi-tenant first** | Todo dado de domínio tem `firm_id`; isolamento verificável |
| **Country-agnostic core** | Lógica fiscal e legal injectada via `CountryConfig` |
| **API-first** | Backend é a fonte de verdade; frontend é um cliente |
| **Event-driven interno** | Acções de domínio emitem eventos para notificações, IA, audit |
| **Fail secure** | Erros não expõem dados; tenant isolation nunca falha silenciosamente |
| **Stateless API** | Sessão em JWT + refresh DB; API escalável horizontalmente |

---

## Vista de alto nível

```
┌─────────────────────────────────────────────────────────────────────┐
│                         UTILIZADORES                                │
│   Browser (escritório) · Browser/PWA (cliente) · Cron · Webhooks   │
└──────────────────────────────┬──────────────────────────────────────┘
                               │
┌──────────────────────────────▼──────────────────────────────────────┐
│  CDN / EDGE (Vercel + Cloudflare WAF)                                 │
│  · SPA React · Blog prerender · Assets · CSP/HSTS                     │
│  · Proxy /api → Backend                                               │
└──────────────────────────────┬────────────────────────────────────────┘
                               │
┌──────────────────────────────▼────────────────────────────────────────┐
│  API GATEWAY LAYER (Express)                                          │
│  · CORS · Helmet · Rate limit · CSRF · i18n · Auth · Error handler   │
│  · /api/v1/auth · /api/v1/contabil · /api/v1/portal · /api/v1/public │
└──────────────────────────────┬────────────────────────────────────────┘
                               │
┌──────────────────────────────▼────────────────────────────────────────┐
│  APPLICATION LAYER (Módulos de domínio)                               │
│  Route → Controller → Service → Repository                              │
│  + CountryConfig · Permissions · Validators · Events                    │
└──────┬──────────────────┬──────────────────┬──────────────────────────┘
       │                  │                  │
┌──────▼──────┐  ┌────────▼────────┐  ┌─────▼──────┐
│  PostgreSQL │  │  Redis          │  │  Storage   │
│  (Supabase) │  │  Rate·Queue·    │  │  (Supabase │
│  + pgvector │  │  Cache·Session  │  │  Buckets)  │
└─────────────┘  └─────────────────┘  └────────────┘
       │
┌──────▼──────────────────────────────────────────────────────────────┐
│  SERVIÇOS EXTERNOS                                                   │
│  Brevo (email/SMS) · Stripe (billing) · OpenAI/Anthropic (IA)       │
│  WhatsApp Business · Sentry (observability)                          │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Estrutura de repositório (alvo)

```
Teglion/
├── package.json                 # Workspace root (npm/pnpm workspaces)
├── .github/workflows/           # CI: build, test, lint, deploy, tenant-isolation
│
├── frontend/
│   ├── src/
│   │   ├── main.tsx             # Bootstrap
│   │   ├── App.tsx              # Router shell
│   │   │
│   │   ├── app/                 # Feature modules (pages por domínio)
│   │   │   ├── auth/
│   │   │   ├── firm/            # Escritório
│   │   │   ├── client/          # Portal cliente
│   │   │   ├── marketing/
│   │   │   ├── blog/
│   │   │   └── legal/
│   │   │
│   │   ├── api/                 # HTTP clients (um ficheiro por domínio, < 200 linhas)
│   │   │   └── contabil/
│   │   │
│   │   ├── components/          # Componentes partilhados (não de domínio)
│   │   ├── design-system/       # ÚNICA fonte de componentes UI
│   │   ├── hooks/               # Hooks reutilizáveis + queries/
│   │   ├── contexts/            # Auth, branding (mínimo)
│   │   ├── providers/           # QueryClient, LiveEvents
│   │   ├── i18n/                # ÚNICO sistema de tradução
│   │   ├── lib/                 # Utilitários (queryClient, utils)
│   │   ├── types/               # Tipos partilhados
│   │   ├── config/              # productMode, brand, country
│   │   └── styles/              # globals, tokens, app-shell
│   │
│   ├── public/
│   └── scripts/                 # Build: seo, prerender, blog catalog
│
├── backend/
│   ├── src/
│   │   ├── server.js            # Bootstrap: DB, schedulers, listen
│   │   ├── app.js               # Express setup + middleware global
│   │   │
│   │   ├── routes/              # Um router por área (< 150 linhas cada)
│   │   │   ├── v1/
│   │   │   │   ├── auth.routes.js
│   │   │   │   ├── contabil.routes.js
│   │   │   │   ├── portal.routes.js
│   │   │   │   └── public.routes.js
│   │   │
│   │   ├── modules/             # Domínio (controller + service por módulo)
│   │   │   ├── auth/
│   │   │   ├── firm/
│   │   │   ├── documents/
│   │   │   ├── obligations/
│   │   │   ├── tasks/
│   │   │   ├── messages/
│   │   │   ├── billing/
│   │   │   ├── ai/              # Fase 5
│   │   │   ├── automations/
│   │   │   ├── integrations/
│   │   │   └── ...
│   │   │
│   │   ├── middlewares/         # Auth, CSRF, upload, RBAC, tenant, error
│   │   ├── db/
│   │   │   └── supabase/
│   │   │       ├── client.js
│   │   │       └── repositories/  # Um repo por entidade (< 300 linhas)
│   │   │
│   │   ├── services/            # Cross-cutting (email, storage, audit, stripe)
│   │   ├── config/              # env, jwt, country-configs/
│   │   ├── events/              # Event bus interno (futuro)
│   │   ├── jobs/                # Workers BullMQ (futuro)
│   │   ├── i18n/
│   │   └── utils/
│   │
│   └── scripts/                 # Smoke, tenant-isolation, pilot-e2e
│
├── supabase/
│   ├── schema.sql
│   ├── tables.sql
│   ├── indexes.sql
│   ├── rls.sql
│   ├── policies.sql
│   └── migrations/
│
└── docs/                        # Documentação oficial (este conjunto)
```

---

## Camadas da aplicação

### 1. Apresentação (Frontend)

| Responsabilidade | Onde |
|------------------|------|
| Routing e layouts | `app/*/pages`, `components/layout` |
| Estado de servidor | TanStack Query (`hooks/queries/`) |
| Estado de sessão | `AuthContext`, `FirmBrandingContext` |
| UI | `design-system/` exclusivamente |
| Chamadas HTTP | `api/contabil/*.ts` — nunca axios directo em componentes |
| Formatação locale | `utils/locale.ts` — delega a `CountryConfig` |

**Regra:** Componentes de página não contêm lógica de negócio. Apenas composição, estado UI local e chamadas a hooks.

### 2. API (Backend — rotas + middleware)

| Responsabilidade | Onde |
|------------------|------|
| HTTP I/O | Controllers |
| Validação de input | `express-validator` nas rotas + validators dedicados |
| Autenticação | `auth.middleware.js` |
| Autorização | `role.middleware.js` + `permissions.js` |
| Tenant scoping | `contabil-scope.js` — `firmId` do JWT, nunca do body |
| Rate limiting | `app.js` + Redis store |
| Erros | `error.middleware.js` → `AppError` tipado |

### 3. Domínio (Backend — services)

| Responsabilidade | Onde |
|------------------|------|
| Regras de negócio | `modules/*/service.js` |
| Orquestração | Services chamam repositories + services transversais |
| Eventos de domínio | `events/` (futuro) — ex: `DocumentUploaded`, `ObligationOverdue` |
| Country-specific | Delegado a `CountryConfig` — nunca if/else por país no service |

### 4. Persistência (Backend — repositories)

| Responsabilidade | Onde |
|------------------|------|
| Queries Supabase | `repositories/*.repository.js` |
| Mapeamento row → entity | Funções `map*()` no repository |
| Filtros tenant | Todo query inclui `.eq('firm_id', firmId)` |
| PostgREST safety | `postgrest-filter.js` para `.or()` e `.ilike()` |

**Regra:** Repositories não contêm regras de negócio. Services não fazem queries directas.

### 5. Infraestrutura (Services transversais)

| Service | Responsabilidade |
|---------|------------------|
| `storage/` | Upload/download Supabase Storage |
| `email/` | Brevo — templates, envio |
| `audit/` | `audit_logs` — eventos sensíveis |
| `stripe/` | Billing, webhooks |
| `sms/` | Brevo SMS — logs, templates |
| `notifications/` | In-app notifications |
| `activity/` | Timeline de eventos |

---

## Fluxo de dados

### Request autenticado (exemplo: upload de documento)

```
1. Browser → POST /api/v1/portal/documents (multipart + cookies)
2. CORS → Rate limit → CSRF → Auth middleware
   └─ JWT validado → req.user = { id, role, firmId, clientId }
3. Upload middleware → magic bytes → size check
4. portal.controller.uploadDocument()
   └─ assertValid(validationResult)
5. documents.service.createDocument({ firmId, clientId, file, metadata })
   ├─ storage.service.upload() → Supabase Storage
   ├─ documents.repository.insert() → PostgreSQL
   ├─ activity.service.log('document.uploaded')
   ├─ audit.service.log('document.upload')
   └─ events.emit('DocumentUploaded') → notifications, IA (futuro)
6. Response 201 { document }
```

### Fluxo multi-tenant

```
JWT (server-issued)
  └─ claims: { sub, role, firmId, clientId? }
      (clinicId sobrevive só como leitura de compatibilidade em session-user.js — não é mais emitido)
      └─ auth.middleware → req.user
          └─ contabil-scope.requireFirmId(req) → UUID
              └─ repository.*.eq('firm_id', firmId)
                  └─ RLS (defesa em profundidade — futuro com JWT Supabase)
```

**Regra absoluta:** O frontend **nunca** envia `firmId`. O backend **nunca** confia em IDs do body sem verificar pertença ao tenant.

---

## Padrão de módulo (backend)

Cada módulo de domínio segue esta estrutura:

```
modules/documents/
├── documents.controller.js    # HTTP handlers (< 200 linhas)
├── documents.service.js       # Business logic (< 300 linhas)
├── documents.validator.js     # Input validation (opcional)
└── documents.events.js        # Domain events (futuro)
```

Repository separado:

```
db/supabase/repositories/
└── documents.repository.js    # Queries (< 300 linhas)
```

---

## Padrão de módulo (frontend)

```
app/firm/documents-hub/
├── FirmDocumentsLayout.tsx      # Layout + tabs
├── DocumentsRequestsWorkspace.tsx
├── DocumentsFilesWorkspace.tsx
├── DocumentsHistoryWorkspace.tsx
├── useDocumentsHub.ts           # Hook com queries/mutations
├── documentsHubTypes.ts
└── documentsHubUtils.ts
```

API client separado:

```
api/contabil/documents.ts        # createContabilDocumentsApi (< 150 linhas)
```

---

## Comunicação entre módulos

### Actual (aceitável no piloto)

- Services importam outros services directamente
- `require()` dinâmico em alguns pontos (evitar)

### Alvo (Fase 2–3)

```
Service A → events.emit('EntityAction', payload)
              └─ Event handlers (notifications, activity, ai, audit)
```

- Sem imports circulares entre módulos de domínio
- Comunicação via event bus interno ou fila

---

## Escalabilidade

### Horizontal (API)

| Componente | Estratégia |
|------------|------------|
| Express | Stateless; múltiplas instâncias atrás de load balancer |
| Sessão | JWT + refresh em DB (não em memória) |
| Rate limit | Redis obrigatório em produção |
| Upload | In-memory multer → migrar para streaming se > 50MB |
| Schedulers | Um leader election (Redis lock) — apenas 1 instância corre cron |

### Vertical (Database)

| Componente | Estratégia |
|------------|------------|
| Queries | Índices compostos `(firm_id, ...)` — já implementado |
| Logs | Particionamento mensal em `audit_logs`, `activity_events` |
| Full-text | pgvector para busca IA (Fase 5) |
| Read replicas | Quando p95 dashboard > 500ms |

### Caching

| Dado | Cache | TTL |
|------|-------|-----|
| Dashboard KPIs | Redis | 30s |
| Fiscal calendar | In-memory (por país/ano) | 24h |
| Firm branding | React Query | 5min |
| CSRF token | Cookie + memória | Sessão |

---

## Deploy

| Ambiente | Frontend | Backend | Database |
|----------|----------|---------|----------|
| Local | Vite :3000 | Express :8001 | Supabase Cloud |
| Staging | Vercel (preview) | Render (staging) | Supabase (staging) |
| Production | Vercel (teglion.com) | Render (api.teglion.com) | Supabase (production) |

**Pipeline CI:**
1. Lint + typecheck
2. Unit tests
3. Build frontend
4. E2E (staging)
5. Deploy backend → frontend
6. Smoke test (`smoke:pilot`)

---

## Decisões arquitecturais (ADRs)

| Decisão | Escolha | Alternativa rejeitada | Razão |
|---------|---------|----------------------|-------|
| Auth | Custom JWT + cookies | Supabase Auth | Controlo de firm_users/clients |
| ORM | Repository + Supabase JS | Prisma, Drizzle | Simplicidade; SQL directo |
| Email | Brevo API | Supabase email | Templates, branding, SMS |
| Blog | TypeScript + prerender | CMS headless | Type-safe; sem dependência externa no piloto |
| Monólito vs micro | Monólito modular | Microserviços | Equipa enxuta; complexidade prematura |
| **Backend vs Supabase-only** | **Express + Supabase (híbrido)** | Eliminar backend; RLS + Edge Functions | ~80 módulos já implementados; auth/Brevo/Stripe/cron; rewrite = 3–6 meses e risco no piloto |
| Real-time | Long-poll (actual) | WebSocket | Migrar na Fase 7 |
| Filas | BullMQ + Redis (futuro) | Síncrono | Desacoplar email, IA, automações |

---

## Relação com outros documentos

| Documento | Conteúdo |
|-----------|----------|
| [CODING_STANDARDS.md](./CODING_STANDARDS.md) | Regras que enforce esta arquitectura |
| [DATABASE.md](./DATABASE.md) | Schema e modelagem |
| [API.md](./API.md) | Contratos HTTP |
| [SECURITY.md](../security/SECURITY.md) | Controles de segurança |
| [MULTI_COUNTRY.md](../international/MULTI_COUNTRY.md) | CountryConfig |
| [AI.md](../ai/AI.md) | Módulo de IA na arquitectura |
