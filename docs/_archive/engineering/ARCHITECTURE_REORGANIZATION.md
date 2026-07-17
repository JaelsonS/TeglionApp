# TegLion — Reorganização arquitectónica

Registo da migração para camadas previsíveis (backend + frontend). Comportamento de produção mantido.

---

## Modelo de camadas

### Backend

```
routes/  →  modules/{domínio}/  →  db/repositories
              services/ (email, storage)
              jobs/, middlewares/, utils/
```

### Frontend

```
src/
├── core/            App, bootstrap
├── features/        auth, firm, client, marketing, blog, legal
├── shared/          components, hooks, utils, design-system, …
├── infrastructure/  api.ts, http/, api/contabil/
└── content/         blog estático
```

---

## Etapas

| # | Descrição | Estado |
|---|-----------|--------|
| 0 | Portal decomposto (hub, booking, tasks, documents, messages) | Concluído |
| 1 | `modules/client/portal/` + barrel | Concluído |
| 2 | `modules/README.md` | Concluído |
| 3 | `shared/index.js` barrel (backend) | Concluído |
| 4 | Frontend `shared/` (utils, components, hooks, …) | Concluído |
| 5 | Frontend `infrastructure/` (api + http) | Concluído |
| 6 | `app/` → `features/` | Concluído |
| 7 | `modules/auth/google/` | Concluído |
| 8 | Código morto (`portal-hub`, `portal-booking` legados removidos) | Concluído |
| 9 | TypeScript gradual em utils críticos | Em curso |
| 10 | Testes + benchmark dashboard | Concluído (29 testes BE, benchmark dashboard) |

---

## Convenções

| Tipo | Padrão |
|------|--------|
| Service BE | `{domínio}.service.js` |
| Controller BE | `{domínio}.controller.js` |
| Barrel | `index.js` |
| Página FE | `*Page.tsx` em `features/{área}/pages/` |
| Util FE | `camelCase.ts` em `shared/utils/` |

---

## Validação

- `npm test` (backend)
- `npm run test:portal-hub` (backend)
- `npx vite build` (frontend)

Mapa completo: [`STRUCTURE.md`](../../STRUCTURE.md) na raiz do repo.
