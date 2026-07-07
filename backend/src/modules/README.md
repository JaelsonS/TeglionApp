# Backend — Módulos de domínio

Cada pasta em `src/modules/` é um **bounded context** com responsabilidade clara.

## Camadas por módulo

```
routes/*.routes.js  →  modules/{x}/{x}.controller.js  →  {x}.service.js  →  db/repositories
```

Controllers: HTTP apenas (validação leve, status codes).  
Services: regra de negócio e orquestração.  
Repositories: acesso a dados (Supabase).

## Mapa de módulos

| Módulo | Responsabilidade | Rotas principais |
|--------|------------------|------------------|
| `auth/` | Login, registo, SSO (`auth/google/`), JWT | `/api/auth/*` |
| `firm/` | Escritório, clientes, branding, equipa | `/api/contabil/firm/*` |
| `client/portal/` | Portal do cliente final | `/api/client-portal/*` |
| `documents/` | Documentos escritório | `/api/contabil/documents/*` |
| `document-requests/` | Pedidos formais | `/api/contabil/document-requests/*` |
| `obligations/` | Obrigações fiscais | `/api/contabil/obligations/*` |
| `tasks/` | Tarefas cliente/escritório | `/api/contabil/tasks/*` |
| `messages/` | Comunicação | `/api/contabil/messages/*` |
| `billing/` | Stripe, subscrições | `/api/contabil/billing/*` |
| `booking/` | Agendamento consultas | via portal + firm |
| `notifications/` | Notificações escritório | `/api/contabil/notifications/*` |
| `automations/` | Regras e cron | `/api/cron/*` |
| `integrations/` | AT, externos | `/api/contabil/integrations/*` |
| `public/` | Endpoints públicos | `/api/public/*` |
| `legal/` | Consentimentos RGPD | `/api/legal/*` |

## Infraestrutura (fora de modules/)

| Pasta | Papel |
|-------|-------|
| `db/supabase/` | Cliente BD + repositories |
| `services/` | Email, storage, SMS, audit (cross-cutting) |
| `jobs/` | Filas Redis |
| `utils/cache/` | TTL cache |
| `middlewares/` | Auth, CSRF, rate limit, timing |
| `config/` | env, country-configs |
| `routes/` | Montagem Express |

## Adicionar um módulo novo

1. Criar `modules/{nome}/` com `{nome}.service.js` + `{nome}.controller.js`
2. Repository em `db/supabase/repositories/` se nova entidade
3. Router em `routes/contabil/` ou área adequada
4. Testes unitários para lógica pura
5. Documentar neste README

Ver [ARCHITECTURE_REORGANIZATION.md](../../docs/engineering/ARCHITECTURE_REORGANIZATION.md) para o plano completo.
