# Gates de segurança — o que roda automaticamente e o que não roda

Esta é a distinção mais importante deste documento: existe uma diferença grande entre "o teste existe" e "o teste protege alguma coisa". Um teste que só roda quando alguém lembra de digitar o comando não é uma rede de segurança — é um documento com sintaxe de código.

**Atualizado durante a execução do Sprint 0** — dois dos três gaps abaixo já foram fechados; o texto original desta seção (que dizia "não roda sozinho" para os dois) está preservado no histórico do arquivo para quem quiser ver o antes/depois.

## O que roda sozinho, em todo PR/push

- Checagem de tipos e testes do frontend.
- Build do frontend.
- Um scan estático de segurança do backend (padrões conhecidos de risco no código).
- Varredura de segredos (evita que uma chave real seja commitada por engano).
- **A suíte completa de testes de backend** — 365 testes (locais verificados 2026-08-13). O job CI injeta placeholders de `JWT_*` / `SUPABASE_*` para o `env.js` carregar; os testes mockam I/O e não usam produção.

Isso é real e roda automaticamente hoje.

## Isolamento entre escritórios (fail-closed)

**Projeto staging:** `xscriwhchdblmwmpglby` (`teglion-staging`, eu-west-1).

O step `Tenant isolation test (staging)` em `.github/workflows/ci.yml`:

- **Sem** `STAGING_SUPABASE_URL` ou `STAGING_SUPABASE_SERVICE_ROLE_KEY` → **CI FAIL** (`exit 1`). Não passa em silêncio.
- **Com** secrets → corre `npm run test:tenant-isolation -w backend` contra staging (escreve dados sintéticos; nunca produção).

### Secrets obrigatórios no GitHub (Settings → Secrets → Actions)

| Secret | Valor |
|---|---|
| `STAGING_SUPABASE_URL` | `https://xscriwhchdblmwmpglby.supabase.co` |
| `STAGING_SUPABASE_SERVICE_ROLE_KEY` | service_role do projeto **staging** (Dashboard → Settings → API) |

Nunca usar a service_role de produção nestes secrets.

### Suíte backend no CI

O job `Backend unit tests` injeta placeholders locais (`JWT_*`, `SUPABASE_*` fictícios) porque `env.js` exige essas variáveis ao importar módulos. Os unit tests mockam I/O e não contactam Supabase real.

## Por que isso importava mais do que parecia

Antes, era possível publicar mudança em produção sem isolamento automático no CI, e o step de tenant isolation saía limpo quando os secrets faltavam. Agora falta só a peça operacional: cadastrar os dois secrets de staging e confirmar um run verde.

## Matriz RLS — 4 tabelas críticas (audit 2026-08-13)

Tráfego real do produto: backend com `service_role` (bypassa RLS). RLS = defesa em profundidade no PostgREST.

| Tabela | Prod RLS | Prod Policies | Staging RLS | Staging Policies | Acesso | Risco residual |
|---|---|---|---|---|---|---|
| `stripe_webhook_events` | ON | deny-all (1) | ON | deny-all (1) | só backend | baixo — sem `firm_id`; idempotência Stripe |
| `auth_login_attempts` | ON | deny-all (1) | ON | deny-all (1) | só backend | baixo — lockout; IPs/contas |
| `obligation_templates` | ON | firm_staff (1) | ON | firm_staff (1) | backend; JWT staff se usado | baixo — tenant via `firm_id` |
| `obligation_recurrence_rules` | ON | firm_staff (1) | ON | firm_staff (1) | backend; JWT staff se usado | baixo — tenant via `firm_id` |

Migration canónica: `20260927020000_sprint0_rls_defense_in_depth.sql` (aplicada em staging e produção).

### Storage `contabil-documents`

| Ambiente | `public` | Policies select/insert/delete | Equivalente |
|---|---|---|---|
| Produção | `false` | firm_staff + client scoped a `firm/{firm_id}/…` | sim |
| Staging | `false` | mesmas 5 policies | sim |

Isolamento efectivo de documentos no produto continua a passar pelo backend (`firm_id` na autorização); policies Storage reforçam se JWT Supabase for usado.

### Nota de schema

Produção tem tabelas extras das migrations de maio (`conversations`, `document_requests`, `task_recurring_rules`, `task_month_exclusions`) — todas com RLS ON. Staging baseline absorveu o equivalente sem reaplicar esses ficheiros; não é gap de segurança nas 4 tabelas acima.
