# Banco de dados

Postgres gerenciado pelo Supabase, com 52 migrations versionadas no repositório (`supabase/migrations/`), cobrindo a evolução do produto desde meados de 2026 — armazenamento de documento, calendário fiscal, alertas/broadcasts, conexão com Google Calendar, e assim por diante.

## Uma lacuna real de reprodutibilidade

As tabelas nucleares do sistema — `clients`, `documents`, `firms`, `firm_users`, `obligations`, entre outras — não foram criadas por nenhuma migration deste repositório. O schema-base foi aplicado manualmente ao banco, fora do controle de versão. Isso significa que, hoje, não é possível recriar o banco de produção do zero só a partir do que está versionado no Git — falta a definição original dessas tabelas centrais. Não é um erro que quebra o produto em produção, mas é uma lacuna real: se for preciso montar um ambiente novo do zero, essa parte do schema precisa vir de outro lugar, não do repositório.

## Índices

Para os padrões de acesso atuais — praticamente tudo filtrado por `firm_id`, frequentemente combinado com `client_id` ou `created_at` — os índices necessários existem nas tabelas de maior volume (documentos, mensagens, eventos de atividade, obrigações, clientes, leads). Isso não é o gargalo de performance hoje.

## Paginação — um ponto de atenção já real, não só projeção futura

Algumas listagens (mensagens, pedidos de documento) usam um limite fixo de registros sem paginação por cursor. Isso significa que, para uma conta com histórico grande, itens mais antigos ficam simplesmente fora de alcance por essas rotas — já é uma limitação hoje, com o volume de uma única conta, não só algo que aparece com mais escritórios.

## Concorrência

O ponto mais crítico encontrado na auditoria de 12/08/2026: a criação de agendamento público não usa nenhuma trava ou restrição de exclusividade no banco para impedir duas inserções simultâneas no mesmo horário — é uma leitura de disponibilidade seguida de uma escrita, sem proteção transacional entre as duas. Detalhado em [BOOKING.md](../03-PRODUTO/BOOKING.md), listado como bloqueador no [Sprint 0](../02-ROADMAP/SPRINT-0.md).

## Acesso ao banco

O backend acessa o Supabase com uma chave de privilégio total (`service_role`). Isso tem implicação direta para o isolamento entre escritórios — detalhado em [MULTI-TENANCY.md](./MULTI-TENANCY.md) e, com o veredito de risco completo, em [MULTI-TENANT-SECURITY.md](../06-SEGURANCA/MULTI-TENANT-SECURITY.md).
