# Estrutura do repositório

Visão rápida para onboarding. Cada camada tem uma responsabilidade; regra de negócio fica nos módulos/features.

```
TegLion/
├── backend/                 API Express
├── frontend/                SPA React (Vite)
├── docs/                    Produto, operações, engenharia
├── tools/ci/                Checks de tamanho e qualidade
└── STRUCTURE.md             Este ficheiro
```

---

## Backend (`backend/src/`)

```
src/
├── server.js, app.js        Bootstrap
├── routes/                  Montagem de rotas HTTP
├── modules/                 Domínio (auth, firm, client, documents, …)
│   └── README.md            Mapa de módulos
├── db/supabase/             Cliente Postgres + repositories
├── services/                Cross-cutting: email, storage, audit
├── jobs/                    Filas Redis
├── middlewares/             Auth, CSRF, rate limit, timing
├── utils/                   Helpers sem regra de negócio
├── shared/index.js          Barrel: AppError, logger, cache, redis
└── config/                  env, country-configs
```

**Fluxo:** `routes` → `controller` → `service` → `repository`

**Portal cliente:** `modules/client/portal/` (hub, booking, tasks, documents, messages)

**Auth Google SSO:** `modules/auth/google/`

---

## Frontend (`frontend/src/`)

```
src/
├── main.tsx                 Entry
├── i18n.ts                  Re-export i18n (chunk mínimo no boot)
├── core/
│   └── App.tsx              BrowserRouter + providers globais
├── features/                Uma pasta por área de produto
│   ├── auth/
│   ├── firm/
│   ├── client/
│   ├── marketing/
│   ├── blog/
│   └── legal/
├── shared/
│   ├── components/          UI reutilizável, layout, landing
│   ├── design-system/       Primitivos TegLion
│   ├── hooks/
│   ├── contexts/
│   ├── providers/
│   ├── utils/
│   ├── lib/
│   ├── constants/
│   ├── types/
│   ├── config/
│   ├── i18n/
│   └── styles/
├── infrastructure/
│   ├── api.ts               Barrel HTTP (axios + APIs contabil)
│   ├── authApi.ts
│   ├── api/contabil/        Factories por domínio
│   └── http/                apiClient, CSRF, documentAssets
└── content/                 Posts de blog (estáticos)
```

**Alias:** `@/` → `src/` (ex.: `@/features/firm/...`, `@/shared/utils/...`)

**Router:** `shared/components/layout/ContabilAppRouter.tsx` — lazy-load por rota.

---

## Comandos úteis

| Comando | Onde |
|---------|------|
| `npm test` | `backend/` — testes unitários |
| `npm run test:portal-hub` | `backend/` — smoke portal |
| `npm run benchmark:dashboard` | `backend/` — latência dashboard |
| `npx vite build` | `frontend/` — build produção |
| `npm run build` | `frontend/` — SEO + build + prerender |

---

## Documentação relacionada

- [`backend/src/modules/README.md`](backend/src/modules/README.md) — módulos API
- [`backend/src/modules/client/portal/README.md`](backend/src/modules/client/portal/README.md) — portal cliente
- [`docs/engineering/ARCHITECTURE_REORGANIZATION.md`](docs/engineering/ARCHITECTURE_REORGANIZATION.md) — histórico da reorganização
