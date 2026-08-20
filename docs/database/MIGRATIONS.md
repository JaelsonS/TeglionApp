# Migrations do banco de dados

> Fonte que já tinha: `docs/07-OPERACAO/DATABASE-MIGRATIONS.md` (12/08/2026), que atualizei lendo direto `supabase/migrations/` (69 arquivos) e `supabase/migrations/20260701000000_initial_contabil.sql` (auditoria que fiz em 18-19/08/2026).

Tenho 69 migrations versionadas em `supabase/migrations/`, aplicadas em ordem cronológica pelo nome do arquivo (prefixo `YYYYMMDDHHmmss_`). Cada uma cobre uma evolução específica do produto que fui construindo — de armazenamento de documento e refatoração de tarefas, passando por billing (Stripe e Stripe Connect), autenticação (SSO, sessões de refresh, proteção contra brute-force), integração com Google Calendar, catálogo de serviços com agendamento público, até a mais recente, acesso oficial de cliente e senha de vault para staff.

## A lacuna real de reprodutibilidade que eu tenho

As tabelas nucleares do sistema — `firms`, `firm_users`, `clients`, `obligations`, `client_tasks`, `documents`, `messages`, `consultations`, `client_invites`, `audit_logs`, entre outras — **eu não criei por nenhuma migration deste repositório**. Apliquei o schema-base manualmente no banco de produção, num momento anterior a eu ter as 69 migrations como prática, e nunca voltei pra versionar isso retroativamente como migration.

Deixei isso documentado no próprio repositório, de forma direta: a primeira migration cronológica, `20260701000000_initial_contabil.sql`, não cria tabela nenhuma — é um comentário meu descrevendo um bundle de arquivos (`schema.sql` → `tables.sql` → `indexes.sql` → `rls.sql` → `policies.sql`, hoje na raiz de `supabase/`) que precisava **aplicar manualmente no SQL Editor do Supabase**, fora do fluxo normal de migration:

```sql
-- ContaBil — migration bundle inicial
-- Aplicar manualmente no Supabase SQL Editor (ordem):
--   1. schema.sql
--   2. tables.sql
--   3. indexes.sql
--   4. rls.sql
--   5. policies.sql
```

Um exemplo concreto do que isso me custa: a coluna `firms.country_code` — que uso hoje no backend pra saber se um escritório é português ou brasileiro — existe em `supabase/tables.sql`, mas em nenhuma migration numerada. Chegou ao banco de produção pelo mesmo bootstrap manual, não por um `ALTER TABLE` versionado. Ver [`SCHEMA.md`](./SCHEMA.md) pro detalhe.

Isso não afeta o funcionamento do produto em produção — o banco existe e funciona normalmente. O risco é de reprodutibilidade: hoje eu não consigo reconstruir o banco de produção do zero só a partir do que está no Git. Se eu precisar montar um ambiente novo (por exemplo, pra um teste de restore de verdade — ver [`DISASTER_RECOVERY.md`](./DISASTER_RECOVERY.md)), essa parte do schema precisa vir de `supabase/schema.sql` + `tables.sql` + `indexes.sql` + `rls.sql` + `policies.sql`, aplicados manualmente, não de uma sequência de migrations reproduzível de ponta a ponta.

**Recomendação que deixo registrada aqui, ainda não implementada**: extrair o schema atual das tabelas nucleares direto do banco de produção e versionar isso como uma migration de baseline, pra que o repositório volte a ser a fonte completa de verdade do schema — incluindo o registro correto no histórico `schema_migrations` do Supabase.

## O que já está bem — as migrations recentes eu fiz com cuidado

Nas migrations mais recentes (a partir do bootstrap inicial em diante) segui um padrão sólido:

- `IF NOT EXISTS` / `IF EXISTS` em praticamente toda operação de DDL, pra serem seguras de rodar mais de uma vez sem quebrar (a `20260824200000_fix_rls_policies_idempotent.sql` existe justamente porque escrevi uma migration anterior que não era idempotente e precisei corrigir).
- Política de RLS que adiciono junto com a tabela nova, no mesmo arquivo — mesmo sabendo que o tráfego real do backend não passa por RLS hoje (ver [`RLS.md`](./RLS.md)).
- Comentário de rollback que documento no fim do arquivo, em pelo menos parte das migrations mais recentes (por exemplo `20260927020000_sprint0_rls_defense_in_depth.sql` e `20260927010000_consultations_no_overlap.sql` trazem o `DROP`/reversão comentado, pronto pra eu usar manualmente se precisar reverter).
- Verificação prévia antes de aplicar constraint que pode falhar em dado existente — por exemplo, em `20260927010000_consultations_no_overlap.sql` documentei no próprio comentário que rodei um script (`backend/scripts/check-consultation-overlaps.js`) pra confirmar que não havia sobreposição nos dados atuais antes de criar a constraint de exclusão.

Esse é o padrão que quero manter daqui pra frente: `IF NOT EXISTS`, RLS junto com a tabela, rollback documentado, e verificação de dado existente antes de constraint nova que pode falhar.

## Processo prático

As migrations novas seguem o padrão de nome `YYYYMMDDHHmmss_descricao_curta.sql` e aplico em ordem cronológica. Ainda não tenho, neste repositório, um comando único de "aplicar todas as migrations pendentes num ambiente novo do zero" que cubra também o schema-base — por causa da lacuna que descrevi acima, montar um ambiente novo exige aplicar manualmente o bundle de bootstrap antes de rodar as migrations versionadas.
