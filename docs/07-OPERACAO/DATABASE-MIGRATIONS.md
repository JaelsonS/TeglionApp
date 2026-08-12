# Migrations do banco de dados

52 migrations versionadas em `supabase/migrations/`, aplicadas em ordem cronológica pelo nome do arquivo. Cada uma cobre uma evolução específica do produto — desde armazenamento de documento até, mais recentemente, calendário fiscal, alertas/broadcasts e a conexão com Google Calendar.

## A lacuna real

As tabelas nucleares do sistema — `clients`, `documents`, `firms`, `firm_users`, `obligations`, entre outras — não foram criadas por nenhuma migration deste repositório; o schema-base foi aplicado manualmente ao banco de produção, em algum momento anterior a essas 52 migrations existirem como prática, e nunca foi retroativamente versionado. Isso significa que hoje não é possível reconstruir o banco de produção do zero só a partir do Git — falta a definição original dessas tabelas.

Isso não afeta o funcionamento do produto em produção — o banco existe e funciona. O risco é de reprodutibilidade: se for preciso montar um ambiente novo do zero (por exemplo, para um teste de restore de verdade, coberto em [DISASTER-RECOVERY.md](../06-SEGURANCA/DISASTER-RECOVERY.md)), essa parte do schema precisa vir de outro lugar, não do repositório.

**Recomendação, documentada aqui, não implementada**: extrair o schema atual das tabelas nucleares diretamente do banco de produção e versionar isso como uma migration de baseline, para que o repositório volte a ser a fonte completa de verdade do schema.

## O que já está bem — migrations recentes são cuidadosas

As migrations mais recentes seguem um padrão sólido: uso de `IF NOT EXISTS`/`IF EXISTS` para serem seguras de rodar mais de uma vez, políticas de RLS adicionadas junto com a tabela nova (mesmo sabendo que o tráfego real não passa por RLS — ver [MULTI-TENANCY.md](../04-ARQUITETURA/MULTI-TENANCY.md)), e comentário de rollback documentado no fim do arquivo em pelo menos parte delas. Isso é o padrão a manter daqui para frente.
