# Banco de dados

> Fontes consolidadas neste documento: `docs/04-ARQUITETURA/DATABASE.md` (12/08/2026) e leitura direta de `supabase/tables.sql`, `supabase/schema.sql`, `supabase/indexes.sql` e `supabase/migrations/` (69 arquivos, auditoria de 18-19/08/2026). Ver também [`SCHEMA.md`](./SCHEMA.md), [`RLS.md`](./RLS.md) e [`MIGRATIONS.md`](./MIGRATIONS.md) para o detalhe de cada parte.

Postgres 17, gerenciado pelo Supabase (confirmado na versão do Postgres restaurada no drill de backup de 13/08 — ver [BACKUPS.md](./BACKUPS.md)). O projeto roda em plano Supabase Pro.

## Como o schema é organizado

Tudo vive no schema `public`. Não há separação por schema entre módulos do produto — a organização é por convenção de nome de tabela e, principalmente, pela coluna `firm_id`, que aparece em praticamente toda tabela que guarda dado de um escritório (o tenant, no sentido de multi-tenancy). Isolamento entre escritórios nunca é feito por país ou qualquer outra dimensão — é sempre por `firm_id`. O desenho estrutural do isolamento multi-tenant (por que o backend acessa com uma chave que ignora políticas de banco, o que isso implica) está em `architecture/MULTI_TENANCY.md`; aqui o foco é como isso aparece no schema e em RLS — ver [`RLS.md`](./RLS.md).

## Tabelas principais

Núcleo do produto (contabilidade para escritórios e seus clientes):

| Tabela | O que guarda |
|---|---|
| `firms` | O escritório de contabilidade — o tenant raiz. Nome, slug, `country_code`, status (`ACTIVE`/`TRIAL`/`SUSPENDED`/`CANCELLED`), plano de billing, `settings` (JSONB). |
| `firm_users` | Staff do escritório (`FIRM_OWNER`, `FIRM_STAFF`, `FIRM_CONSULTANT`). |
| `clients` | Cliente do escritório — quem recebe o serviço de contabilidade. |
| `obligations` | Obrigações fiscais/mensais por cliente (IVA, IRC, IRS, SS, DAS, folha de pagamento, etc.), com `due_date` e status de ciclo de vida. |
| `client_tasks` | Tarefas pedidas ao cliente (entrega de documento, preenchimento de formulário), com `task_type` distinguindo tarefa recorrente ligada a obrigação, tarefa manual e tarefa interna. |
| `documents` | Metadado de documento — o arquivo em si vive no Supabase Storage, aqui fica a referência (`storage_key`, `mime_type`, status de validação). |
| `messages` / `conversations` | Comunicação escritório ↔ cliente, agrupada por conversa. |
| `document_requests` | Pedido de documento feito dentro de uma conversa, com ciclo de vida próprio (`pending` → `seen` → `answered` → `completed`). |
| `consultations` | Agenda/consultoria — inclui uma constraint de exclusão no banco (`consultations_no_overlap`, `btree_gist`) que impede duas consultas ativas sobrepostas para o mesmo escritório+staff. Adicionada na migration `20260927010000_consultations_no_overlap.sql` e registrada como concluída em `SPRINT-0.md` (constraint em staging e produção, overlap drill OK). Documentos mais antigos de arquitetura descreviam esse ponto como sem proteção nenhuma no banco — isso já não é mais verdade; qualquer contradição residual entre documentos de produto sobre o assunto é tratada separadamente no item 1.6 do [`ROADMAP.md`](../ROADMAP.md). |
| `accounting_services` | Catálogo de serviços do escritório (usado em booking público). |
| `client_invites` | Convite de acesso ao portal do cliente. |
| `audit_logs` | Trilha de auditoria por ação. |

Além do núcleo, o schema cresceu por 69 migrations cobrindo billing (Stripe + Stripe Connect), autenticação (SSO, refresh sessions, tentativas de login), integração com Google Calendar, broadcasts do escritório, workspace de tarefas com automações, catálogo de serviços com agendamento público, tags de entidade, e mais — cada área tem suas próprias tabelas, quase todas seguindo o mesmo padrão de `firm_id` obrigatório.

## Decisões de design

- **UUID como chave primária em toda tabela**, gerado com `gen_random_uuid()` (extensão `pgcrypto`).
- **JSONB para metadado flexível**, em vez de coluna rígida, onde o formato varia por escritório ou por tipo de registro: `firms.settings`, `clients.metadata`, `client_tasks.schema_json`, `audit_logs.metadata`. A troca é: consulta e validação ficam mais fracas do que uma coluna tipada, mas evita migration a cada pequena variação de configuração por tenant.
- **Enum simulado com `CHECK` + `TEXT`**, não `ENUM` nativo do Postgres — por exemplo `firms.status IN ('ACTIVE', 'TRIAL', 'SUSPENDED', 'CANCELLED')`. Mais fácil de alterar (um `ALTER TABLE ... DROP/ADD CONSTRAINT`) do que migrar um tipo `ENUM`, ao custo de não ter o valor validado no nível de tipo da coluna.
- **Colunas `legacy_*`** (`legacy_clinic_id`, `legacy_patient_id`, `legacy_user_id`, `legacy_obligation_id`, `legacy_document_id`, `legacy_task_id`, `legacy_message_id`, `legacy_consultation_id`) presentes nas tabelas nucleares — resquício de uma migração de dados de um produto anterior (nomenclatura de clínica/paciente). Não removidas, mantidas como referência de rastreabilidade da migração de dados original.
- **Trigger `updated_at`** central (`public.set_updated_at()`), aplicado por `CREATE TRIGGER` em cada tabela que precisa dele, em vez de cada aplicação de código lembrar de atualizar o campo manualmente.
- **`ON DELETE CASCADE`** a partir de `firm_id` na maioria das tabelas filhas — apagar um escritório apaga em cascata os dados dele. Não há hoje um fluxo de "exclusão efetiva de escritório" documentado além disso; ver a lacuna de apagamento de dado pessoal (LGPD/GDPR) registrada no [`ROADMAP.md`](../ROADMAP.md).

## Índices

Para os padrões de acesso atuais — praticamente tudo filtrado por `firm_id`, muitas vezes combinado com `client_id`, `status` ou `created_at` — os índices compostos necessários existem nas tabelas de maior volume (documentos, mensagens, eventos de atividade, obrigações, clientes, agendamentos, auditoria). Isso não é o gargalo de performance hoje.

## Paginação — ponto de atenção já real

Algumas listagens (mensagens, pedidos de documento) usam limite fixo de registros sem paginação por cursor. Para uma conta com histórico grande, itens mais antigos ficam fora de alcance dessas rotas — já é uma limitação hoje, não só uma projeção para quando houver mais escritórios.

## Acesso ao banco

O backend acessa o Supabase com a chave de privilégio total (`service_role`), que ignora Row Level Security. A fronteira real de isolamento entre escritórios é o filtro `firm_id` explícito em cada consulta de repositório, não a política de RLS declarada no schema — detalhe completo em [`RLS.md`](./RLS.md) e, para o veredito de risco dessa escolha, em `security/MULTI_TENANT_SECURITY.md`.
