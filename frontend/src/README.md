# Frontend — layout `src/`

## Camadas

| Pasta | Conteúdo |
|-------|----------|
| `core/` | App shell: router wrapper, tema auth |
| `features/` | Páginas e lógica por produto (firm, client, auth, blog, …) |
| `shared/` | Código partilhado sem rota própria |
| `infrastructure/` | HTTP, APIs REST, auth API |
| `content/` | Dados estáticos (blog) |

## Imports

Usar sempre o alias `@/`:

```ts
import { formatNif } from '@/shared/utils/formatNif'
import { contabilFirmApi } from '@/infrastructure/api'
import { FirmDashboardPage } from '@/features/firm/pages/FirmDashboardPage'
```

## Onde adicionar código novo

1. **Nova página** → `features/{área}/pages/` ou `features/{área}/`
2. **Componente reutilizável** → `shared/components/` ou `design-system/`
3. **Chamada API** → factory em `infrastructure/api/contabil/`, export em `infrastructure/api.ts`
4. **Hook de dados** → `shared/hooks/` ou `shared/hooks/queries/`

## Router

Todas as rotas lazy estão em `shared/components/layout/ContabilAppRouter.tsx`.
