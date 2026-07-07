# TegLion — Base de Dados

**Documento oficial · Última actualização: Julho 2026**

Modelagem, convenções e evolução da base de dados PostgreSQL (Supabase) do TegLion.

---

## Princípios

| Princípio | Regra |
|-----------|-------|
| **Multi-tenant** | Todo dado de domínio tem `firm_id` NOT NULL |
| **UUIDs** | Chaves primárias UUID v4 (`gen_random_uuid()`) |
| **Timestamps** | `created_at`, `updated_at` TIMESTAMPTZ em toda tabela de domínio |
| **Soft delete** | `is_active BOOLEAN` onde aplicável (documents) |
| **JSONB** | Para dados flexíveis (`settings`, `metadata`, `schema_json`) — com schema documentado |
| **Migrations forward-only** | Nunca reverter SQL em produção |
| **RLS** | Activada como defesa em profundidade; backend usa service role com scoping na app |

---

## Diagrama de entidades (core)

```
firms (tenant root)
│
├── firm_users ──────────────────────────────────────────┐
│                                                        │
├── clients ─────────────────────────────────┐         │
│   │                                          │         │
│   ├── obligations                            │         │
│   │   └── (type, period, due_date, status)   │         │
│   │                                          │         │
│   ├── client_tasks                           │         │
│   │   └── (title, status, schema_json)       │         │
│   │                                          │         │
│   ├── documents                              │         │
│   │   └── (storage_key, validation_status)   │         │
│   │                                          │         │
│   ├── messages                               │         │
│   │   └── (body, sender_role, read_at)       │         │
│   │                                          │         │
│   ├── consultations                          │         │
│   │   └── (scheduled_at, status)             │         │
│   │                                          │         │
│   └── client_invites                         │         │
│       └── (token, status, expires_at)        │         │
│                                              │         │
├── document_requests ◄──────────────────────┘         │
├── service_requests                                     │
├── firm_broadcasts                                      │
├── news_articles                                        │
├── accounting_services                                  │
├── obligation_templates                                 │
├── obligation_recurrence_rules                          │
├── task_automation_rules                                │
├── firm_notifications ◄─────────────────────────────────┘
│
├── audit_logs
├── activity_events
├── sms_logs
├── content_views
├── in_app_notifications
├── push_subscriptions
├── auth_refresh_sessions
├── auth_login_attempts
├── password_reset_tokens
├── user_legal_consents
├── blog_newsletter_subscribers
└── task_month_exclusions
```

---

## Tabelas core

### `firms` — Tenant root

| Coluna | Tipo | Notas |
|--------|------|-------|
| `id` | UUID PK | |
| `name` | TEXT NOT NULL | Nome do escritório |
| `slug` | TEXT UNIQUE | URL pública (login cliente) |
| `country_code` | TEXT DEFAULT 'PT' | **Fonte de verdade para multi-país** |
| `status` | TEXT | TRIAL, ACTIVE, SUSPENDED, CANCELLED |
| `billing_plan` | TEXT | Plano Stripe |
| `trial_ends_at` | TIMESTAMPTZ | Fim do trial |
| `settings` | JSONB | Branding, notificações, fiscal config |
| `stripe_customer_id` | TEXT | Via migration |
| `stripe_subscription_id` | TEXT | Via migration |
| `legacy_clinic_id` | TEXT | 🔴 Remover na Fase 1 |

### `firm_users` — Staff do escritório

| Coluna | Tipo | Notas |
|--------|------|-------|
| `firm_id` | UUID FK | Tenant |
| `email` | TEXT | UNIQUE per firm |
| `role` | TEXT | FIRM_OWNER, FIRM_STAFF, FIRM_CONSULTANT |
| `password_hash` | TEXT | Argon2id |
| `is_active` | BOOLEAN | |
| `refresh_token_hash` | TEXT | 🔴 Legacy — usar `auth_refresh_sessions` |

### `clients` — Clientes do escritório

| Coluna | Tipo | Notas |
|--------|------|-------|
| `firm_id` | UUID FK | Tenant |
| `display_name` | TEXT NOT NULL | |
| `email` | TEXT | Login portal |
| `tax_id` | TEXT | NIF/CPF/CNPJ (normalizado) |
| `phone` | TEXT | SMS/WhatsApp |
| `status` | TEXT | ACTIVE, INACTIVE, PENDING_LINK |
| `metadata` | JSONB | Regime fiscal, tipo entidade, etc. |
| `assigned_staff_id` | UUID FK | Contabilista responsável |
| `legacy_patient_id` | TEXT | 🔴 Remover na Fase 1 |

**Evolução Fase 4:**
```sql
ALTER TABLE clients ADD COLUMN tax_id_type TEXT; -- 'NIF' | 'CPF' | 'CNPJ'
ALTER TABLE clients ADD COLUMN entity_type TEXT;  -- 'INDIVIDUAL' | 'COMPANY'
```

### `obligations` — Obrigações fiscais

| Coluna | Tipo | Notas |
|--------|------|-------|
| `firm_id`, `client_id` | UUID FK | Tenant + cliente |
| `type` | TEXT | Validado contra CountryConfig |
| `period` | TEXT | `2026-03`, `2026-Q1`, `2026` |
| `due_date` | DATE | Prazo |
| `status` | TEXT | PENDING → DELIVERED / OVERDUE |
| UNIQUE | | `(firm_id, client_id, type, period)` |

### `client_tasks` — Tarefas para o cliente

| Coluna | Tipo | Notas |
|--------|------|-------|
| `obligation_id` | UUID FK | Opcional — link a obrigação |
| `schema_json` | JSONB | Form builder dinâmico |
| `status` | TEXT | OPEN → SUBMITTED → APPROVED |

### `documents` — Metadados de ficheiros

| Coluna | Tipo | Notas |
|--------|------|-------|
| `storage_key` | TEXT NOT NULL | Path no Supabase Storage |
| `storage_provider` | TEXT | `supabase` |
| `validation_status` | TEXT | PENDING, APPROVED, REJECTED |
| `uploaded_by_role` | TEXT | FIRM, CLIENT |
| `is_active` | BOOLEAN | Soft delete |
| `storage_url` | TEXT | 🔴 Redundante — usar signed URLs |

**Storage path:** `firm/{firmId}/clients/{clientId}/documents/{docId}/{filename}`

### `messages` — Comunicação

| Coluna | Tipo | Notas |
|--------|------|-------|
| `sender_role` | TEXT | FIRM, CLIENT |
| `body` | TEXT NOT NULL | |
| `read_at` | TIMESTAMPTZ | |
| `document_id` | UUID FK | Anexo opcional |

---

## Tabelas de suporte

| Tabela | Propósito | Retenção |
|--------|-----------|----------|
| `audit_logs` | Segurança e compliance | 24 meses (particionar) |
| `activity_events` | Timeline operacional | 12 meses |
| `auth_refresh_sessions` | Sessões refresh (jti) | Até expirar/revogar |
| `auth_login_attempts` | Lockout brute force | 30 dias |
| `password_reset_tokens` | Reset password | 1 hora |
| `sms_logs` | Histórico SMS | 12 meses |
| `content_views` | Tracking de visualizações | 6 meses |
| `push_subscriptions` | Web push endpoints | Até unsubscribe |
| `ai_requests` | Auditoria IA (futuro) | 12 meses |
| `ai_embeddings` | Vectores RAG (futuro) | Vida da entidade |

---

## Índices

Todos os queries de domínio devem usar índices compostos com `firm_id` como primeira coluna.

```sql
-- Padrão obrigatório para toda tabela de domínio
CREATE INDEX idx_{table}_firm ON {table}(firm_id);
CREATE INDEX idx_{table}_firm_status ON {table}(firm_id, status);
CREATE INDEX idx_{table}_firm_created ON {table}(firm_id, created_at DESC);
```

Índices específicos existentes (ver `supabase/indexes.sql`):
- `obligations(firm_id, due_date)` — calendário e alertas
- `messages(firm_id, client_id, created_at DESC)` — chat
- `documents(firm_id, client_id)` — ficheiros por cliente
- `client_tasks(firm_id, status)` — workspace de tarefas

**Regra:** Todo novo query frequent deve ter índice correspondente. Verificar com `EXPLAIN ANALYZE` antes de deploy.

---

## Row Level Security (RLS)

RLS activada em `supabase/rls.sql` com funções helper:
- `current_firm_id()` — do JWT Supabase
- `current_client_id()`
- `is_firm_staff()`

**Estado actual:** Backend usa `service_role` (bypassa RLS). Isolamento na aplicação.

**Alvo (Fase 7):** Migrar para JWT Supabase com claims → RLS como defesa em profundidade.

---

## Migrations

### Bootstrap (BD nova)

```
1. supabase/schema.sql      — Extensions, types
2. supabase/tables.sql      — Core tables
3. supabase/indexes.sql     — Índices
4. supabase/rls.sql         — RLS enable
5. supabase/policies.sql    — Políticas
6. supabase/migrations/*    — 26 migrations incrementais
```

### Convenção de naming

```
{YYYYMMDDHHMMSS}_{descricao_snake_case}.sql
```

### Regras

1. **Forward-only** — nunca `DROP` em produção sem plano
2. **Idempotente** — `IF NOT EXISTS`, `IF EXISTS`
3. **Uma preocupação por migration** — não misturar schema + data
4. **Testar em staging** antes de produção
5. **Documentar** migrations significativas neste ficheiro

---

## Convenções de naming

| Elemento | Convenção | Exemplo |
|----------|-----------|---------|
| Tabelas | snake_case, plural | `client_tasks` |
| Colunas | snake_case | `due_date`, `firm_id` |
| FK | `{entity}_id` | `client_id`, `obligation_id` |
| Enums (CHECK) | UPPER_SNAKE | `PENDING`, `IN_PROGRESS` |
| JSONB keys | camelCase | `settings.branding.logoUrl` |
| Índices | `idx_{table}_{columns}` | `idx_obligations_firm_due` |

---

## JSONB schemas documentados

### `firms.settings`

```jsonc
{
  "branding": { "logoUrl": "string", "primaryColor": "string" },
  "notifications": { "emailReminders": true, "smsReminders": false },
  "fiscal": { "defaultObligationTypes": ["IVA"], "reminderDaysBefore": 7 },
  "onboarding": { "completedAt": "ISO8601", "steps": [] }
}
```

### `clients.metadata`

```jsonc
{
  "taxRegime": "simplificado" | "organizado" | "simples_nacional",
  "entityType": "INDIVIDUAL" | "COMPANY",
  "ivaRegime": "mensal" | "trimestral" | "isento",
  "atLinks": { "lastVerifiedAt": "ISO8601" }
}
```

### `client_tasks.schema_json`

```jsonc
{
  "fields": [
    { "id": "amount", "type": "number", "label": "Valor", "required": true },
    { "id": "notes", "type": "text", "label": "Notas", "required": false }
  ]
}
```

---

## Escalabilidade

| Volume | Estratégia |
|--------|------------|
| < 100 escritórios | Schema actual suficiente |
| 100–1000 escritórios | Particionar logs; read replicas |
| 1000+ escritórios | Particionar `messages`, `documents` por `firm_id` hash |
| 100K+ clientes | Avaliar sharding por região |

### Retention policy (Fase 3)

```sql
-- Exemplo: apagar audit_logs > 24 meses
DELETE FROM audit_logs WHERE created_at < now() - interval '24 months';
-- Executar via cron mensal
```

---

## Campos a remover (Fase 1)

| Tabela | Coluna | Motivo |
|--------|--------|--------|
| `firms` | `legacy_clinic_id` | Era saúde |
| `clients` | `legacy_patient_id` | Era saúde |
| `firm_users` | `refresh_token_hash` | Substituído por `auth_refresh_sessions` |
| `clients` | `refresh_token_hash` | Idem |
| `documents` | `storage_url` | Signed URLs |
| Todas com `legacy_*_id` | — | Migração completa |

---

## Relação com outros documentos

| Documento | Conteúdo |
|-----------|----------|
| [ARCHITECTURE.md](./ARCHITECTURE.md) | Repository pattern |
| [MULTI_COUNTRY.md](../international/MULTI_COUNTRY.md) | Campos multi-país |
| [AI.md](../ai/AI.md) | Tabelas de IA (futuro) |
| [SECURITY.md](../security/SECURITY.md) | RLS e audit |
| [DEV_LOCAL.md](../operations/DEV_LOCAL.md) | Setup local da BD |
