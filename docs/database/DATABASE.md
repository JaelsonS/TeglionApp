# Banco de dados

> Juntei aqui o que já tinha escrito em `docs/04-ARQUITETURA/DATABASE.md` (12/08/2026) e o que confirmei lendo direto `supabase/tables.sql`, `supabase/schema.sql`, `supabase/indexes.sql` e `supabase/migrations/` (69 arquivos, auditoria que fiz em 18-19/08/2026). Ver também [`SCHEMA.md`](./SCHEMA.md), [`RLS.md`](./RLS.md) e [`MIGRATIONS.md`](./MIGRATIONS.md) pra o detalhe de cada parte.

Uso Postgres 17, gerenciado pelo Supabase (confirmei isso pela versão do Postgres que restaurei no drill de backup de 13/08 — ver [BACKUPS.md](./BACKUPS.md)). Meu projeto roda no plano Supabase Pro.

## Como eu organizei o schema

Tudo vive no schema `public`. Eu não separei por schema entre módulos do produto — organizei por convenção de nome de tabela e, principalmente, pela coluna `firm_id`, que coloquei em praticamente toda tabela que guarda dado de um escritório (o tenant, no sentido de multi-tenancy). Nunca isolei escritórios por país ou qualquer outra dimensão — sempre foi por `firm_id`. Escrevi o desenho estrutural do isolamento multi-tenant (por que o backend acessa com uma chave que ignora políticas de banco, o que isso implica) em `architecture/MULTI_TENANCY.md`; aqui o foco é como isso aparece no schema e em RLS — ver [`RLS.md`](./RLS.md).

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
| `consultations` | Agenda/consultoria — inclui uma constraint de exclusão no banco (`consultations_no_overlap`, `btree_gist`) que impede duas consultas ativas sobrepostas para o mesmo escritório+staff. Eu adicionei isso na migration `20260927010000_consultations_no_overlap.sql` e registrei como concluído em `SPRINT-0.md` (constraint em staging e produção, overlap drill OK). Documentos de arquitetura mais antigos que eu tinha escrito descreviam esse ponto como sem proteção nenhuma no banco — isso já não é mais verdade; trato qualquer contradição residual entre documentos de produto sobre o assunto separadamente no item 1.6 do [`ROADMAP.md`](../ROADMAP.md). |
| `accounting_services` | Catálogo de serviços do escritório (usado em booking público). |
| `client_invites` | Convite de acesso ao portal do cliente. |
| `audit_logs` | Trilha de auditoria por ação. |

Além do núcleo, o schema cresceu por 69 migrations que fui escrevendo cobrindo billing (Stripe + Stripe Connect), autenticação (SSO, refresh sessions, tentativas de login), integração com Google Calendar, broadcasts do escritório, workspace de tarefas com automações, catálogo de serviços com agendamento público, tags de entidade, e mais — cada área tem suas próprias tabelas, quase todas seguindo o mesmo padrão de `firm_id` obrigatório que adotei desde o início.

## Decisões de design que eu tomei

- **UUID como chave primária em toda tabela**, gerado com `gen_random_uuid()` (extensão `pgcrypto`).
- **JSONB para metadado flexível**, em vez de coluna rígida, onde o formato varia por escritório ou por tipo de registro: `firms.settings`, `clients.metadata`, `client_tasks.schema_json`, `audit_logs.metadata`. A troca que fiz: consulta e validação ficam mais fracas do que uma coluna tipada, mas evito migration a cada pequena variação de configuração por tenant.
- **Enum simulado com `CHECK` + `TEXT`**, não `ENUM` nativo do Postgres — por exemplo `firms.status IN ('ACTIVE', 'TRIAL', 'SUSPENDED', 'CANCELLED')`. Escolhi assim porque é mais fácil de alterar (um `ALTER TABLE ... DROP/ADD CONSTRAINT`) do que migrar um tipo `ENUM`, ao custo de não ter o valor validado no nível de tipo da coluna.
- **Colunas `legacy_*`** (`legacy_clinic_id`, `legacy_patient_id`, `legacy_user_id`, `legacy_obligation_id`, `legacy_document_id`, `legacy_task_id`, `legacy_message_id`, `legacy_consultation_id`) que deixei nas tabelas nucleares — resquício de uma migração de dados de um produto anterior meu (nomenclatura de clínica/paciente). Não removi, mantive como referência de rastreabilidade da migração de dados original.
- **Trigger `updated_at`** central (`public.set_updated_at()`), que apliquei por `CREATE TRIGGER` em cada tabela que precisa dele, em vez de depender de eu lembrar de atualizar o campo manualmente em cada lugar do código.
- **`ON DELETE CASCADE`** a partir de `firm_id` na maioria das tabelas filhas — apagar um escritório apaga em cascata os dados dele. Ainda não tenho um fluxo de "exclusão efetiva de escritório" documentado além disso; a lacuna de apagamento de dado pessoal (LGPD/GDPR) está registrada no [`ROADMAP.md`](../ROADMAP.md).

## Índices

Para os padrões de acesso que tenho hoje — praticamente tudo filtrado por `firm_id`, muitas vezes combinado com `client_id`, `status` ou `created_at` — já criei os índices compostos necessários nas tabelas de maior volume (documentos, mensagens, eventos de atividade, obrigações, clientes, agendamentos, auditoria). Não é o gargalo de performance hoje.

## Paginação — ponto de atenção que já é real

Algumas listagens (mensagens, pedidos de documento) usam limite fixo de registros sem paginação por cursor. Numa conta com histórico grande, itens mais antigos ficam fora de alcance dessas rotas — já é uma limitação hoje, não só uma projeção pra quando eu tiver mais escritórios.

## Acesso ao banco

O backend acessa o Supabase com a chave de privilégio total (`service_role`), que ignora Row Level Security. A fronteira real de isolamento entre escritórios é o filtro `firm_id` explícito que escrevi em cada consulta de repositório, não a política de RLS declarada no schema — detalhe completo em [`RLS.md`](./RLS.md) e, pro veredito de risco dessa escolha, em `security/MULTI_TENANT_SECURITY.md`.
