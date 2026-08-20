# Schema — detalhe das tabelas nucleares

> Juntei aqui o que já tinha em `docs/04-ARQUITETURA/DATABASE.md` (12/08/2026), `docs/07-OPERACAO/DATABASE-MIGRATIONS.md` (12/08/2026), e o que confirmei lendo direto `supabase/tables.sql`, `supabase/schema.sql`, `supabase/indexes.sql` e `backend/src/db/supabase/repositories/firms.repository.js` (auditoria que fiz em 18-19/08/2026). Pro processo de migration e a lacuna de rastreabilidade em si, ver [`MIGRATIONS.md`](./MIGRATIONS.md).

Este documento descreve o schema como ele existe hoje no banco de produção, do jeito que está registrado em `supabase/tables.sql`, `supabase/schema.sql`, `supabase/indexes.sql` e `supabase/rls.sql` — que **não são migrations rastreadas**, e sim um bundle de bootstrap que apliquei manualmente. Ver a seção sobre `country_code` abaixo e [`MIGRATIONS.md`](./MIGRATIONS.md) pro que isso significa.

## `firms` — o tenant raiz

| Coluna | Tipo | Notas |
|---|---|---|
| `id` | UUID PK | `gen_random_uuid()` |
| `legacy_clinic_id` | TEXT, único | resquício do produto anterior |
| `name` | TEXT | |
| `slug` | TEXT, único | |
| `country_code` | TEXT, default `'PT'` | ver observação abaixo — **existe no banco, sem migration rastreada** |
| `status` | TEXT | `CHECK IN ('ACTIVE','TRIAL','SUSPENDED','CANCELLED')` |
| `billing_plan` | TEXT | |
| `trial_ends_at` | TIMESTAMPTZ | |
| `settings` | JSONB, default `{}` | inclui, por exemplo, fusos horários de booking aceitos (ver `ROADMAP.md`) |
| `created_at` / `updated_at` | TIMESTAMPTZ | trigger `set_updated_at()` |

### A observação que preciso guardar sobre `country_code`

A coluna `firms.country_code` existe no banco de produção, o backend lê e escreve nela (`backend/src/db/supabase/repositories/firms.repository.js`, campo `countryCode`), e é o mecanismo real que uso pra saber se um escritório é português ou brasileiro. Mas **nenhuma migration rastreada em `supabase/migrations/` cria essa coluna**. Ela está definida em `supabase/tables.sql`, que é um arquivo de referência do schema-base que apliquei — não uma migration com número de sequência, aplicada e registrada no histórico de `schema_migrations`.

Isso é consistente com a lacuna maior que documentei em [`MIGRATIONS.md`](./MIGRATIONS.md): apliquei as tabelas nucleares inteiras (incluindo `firms`) manualmente no banco de produção, fora do controle de versão de migrations, num bootstrap que a própria migration `20260701000000_initial_contabil.sql` documenta como um bundle (`schema.sql` → `tables.sql` → `indexes.sql` → `rls.sql` → `policies.sql`) "aplicar manualmente no SQL Editor do Supabase". `country_code` não é um caso isolado — é um exemplo concreto e nomeado dessa lacuna de rastreabilidade, que vale a pena eu deixar registrado porque é a coluna que uso pra uma decisão de produto real (preço em EUR vs. BRL, fuso horário aceito).

Importante eu não confundir duas coisas diferentes: **nunca uso `country_code` pra isolar escritórios** — isso é sempre `firm_id` (ver [`RLS.md`](./RLS.md)). `country_code` é dado de negócio (pra preço, fuso, formulário fiscal local), não um mecanismo de segurança ou de particionamento de tenant.

## `firm_users` — staff do escritório

`firm_id` (FK, `ON DELETE CASCADE`), `auth_user_id`, `email`, `full_name`, `password_hash`, `refresh_token_hash` + expiração, `role` (`CHECK IN ('FIRM_OWNER','FIRM_STAFF','FIRM_CONSULTANT')`), `is_active`. `UNIQUE (firm_id, email)` — deixei assim porque o mesmo e-mail pode existir em escritórios diferentes, mas não dentro do mesmo.

## `clients` — cliente do escritório

`firm_id` (FK), `display_name`, `email`, `password_hash`, `tax_id`, `phone`, `status` (`ACTIVE`/`INACTIVE`/`PENDING_LINK`), `link_status` (`PENDING`/`APPROVED`/`REJECTED`), `assigned_staff_id` (FK para `firm_users`, `ON DELETE SET NULL`), `metadata` JSONB.

## `obligations` — obrigações fiscais/mensais

`firm_id` + `client_id` (FKs), `type` (`CHECK IN ('IVA','IRC','IRS','SS','DRF','IES','DAS','PAYROLL','CUSTOM')` — misturei de propósito tipos fiscais portugueses e brasileiros no mesmo enum simulado), `period`, `due_date`, `status` com ciclo de vida (`PENDING` → `IN_PROGRESS` → `WAITING_CLIENT` → `DELIVERED`, com `OVERDUE`/`CANCELLED` como saídas alternativas). `UNIQUE (firm_id, client_id, type, period)` — assim não dá pra duplicar a mesma obrigação pro mesmo período.

## `client_tasks` — tarefas pedidas ao cliente

`firm_id` + `client_id`, `obligation_id` opcional (FK, `ON DELETE SET NULL`), `schema_json` JSONB (formulário dinâmico), `status` (`OPEN`/`IN_PROGRESS`/`SUBMITTED`/`APPROVED`/`CANCELLED`), `task_type` (`recurring_obligation`/`manual_task`/`internal_task`, que adicionei depois via migration e fui evoluindo mais de uma vez — ver `20260930000000` e as correções de `CHECK` associadas nas migrations de outubro). `recurring_rule_id` liga a tarefa a `task_recurring_rules` quando ela nasce de uma regra recorrente.

## `documents` — metadado de arquivo

`firm_id` + `client_id`, `obligation_id` e `client_task_id` opcionais, `storage_provider` (default `'supabase'`), `storage_key`, `mime_type`, `size_bytes`, `uploaded_by_role` (`FIRM`/`CLIENT`), `validation_status` (`PENDING`/`APPROVED`/`REJECTED`). O arquivo em si eu não guardo no Postgres — fica no Supabase Storage; aqui só a referência.

## `messages` / `conversations` / `document_requests`

`conversations` agrupa a troca entre um `firm_id` + `client_id` (`UNIQUE (firm_id, client_id)`). `messages` carrega `conversation_id`, `sender_role` (`FIRM`/`CLIENT`), `is_read`. `document_requests` é um pedido de documento dentro de uma conversa, com seu próprio ciclo de vida (`pending`/`seen`/`answered`/`completed`) e link opcional para o `document_id` que o atendeu.

## `consultations` — agenda

`firm_id` + `client_id`, `staff_id` opcional, `scheduled_at`, `duration_minutes` (default 60), `status` (`SCHEDULED`/`COMPLETED`/`CANCELLED`/`NO_SHOW`). Coloquei uma constraint de exclusão (`consultations_no_overlap`, via extensão `btree_gist`) que impede duas consultas ativas com horário sobreposto para o mesmo `firm_id` + `staff_id` — detalhei isso em [`DATABASE.md`](./DATABASE.md).

## `audit_logs` — auditoria

`firm_id` (tornei opcional numa migration posterior, `20260829100000_audit_logs_nullable_firm.sql`, pra cobrir eventos que não pertencem a um tenant específico), `actor_role`, `actor_id`, `action`, `entity_type`, `entity_id`, `metadata` JSONB, `ip_address` (tipo `INET`).

## Tabelas fora do núcleo (não detalho aqui)

O schema tem dezenas de outras tabelas que fui adicionando pelas 69 migrations — billing (`firm_stripe_billing`, `firm_payments_booking_hold`, eventos de webhook do Stripe), autenticação (`auth_refresh_sessions`, `auth_login_attempts`, `password_reset_tokens`), integração com Google Calendar, broadcasts, automação de tarefas, catálogo de serviços com agendamento público, tags de entidade, e outras. Cada uma segue o mesmo padrão que adotei de `firm_id` obrigatório e `ON DELETE CASCADE` a partir de `firms`, salvo exceção que documentei no próprio arquivo de migration.
