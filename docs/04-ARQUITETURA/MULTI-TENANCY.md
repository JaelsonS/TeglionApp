# Multi-tenancy — como é construído

Este documento é sobre desenho estrutural — como o isolamento entre escritórios foi montado. O veredito de risco (o quão seguro isso é na prática, o que a auditoria encontrou) está em [MULTI-TENANT-SECURITY.md](../06-SEGURANCA/MULTI-TENANT-SECURITY.md) — leia os dois juntos.

## O modelo

Cada escritório (`firm`) é o tenant. Toda tabela de dado que pertence a um escritório — clientes, documentos, mensagens, obrigações, agendamentos, configurações — carrega uma coluna `firm_id`. O padrão de acesso, em toda a camada de repositório, é: nenhuma consulta busca ou grava dado sem esse filtro combinado com o `firm_id` extraído da sessão autenticada de quem está fazendo a requisição.

## Por que o backend usa a chave de privilégio total do Supabase

O backend se conecta ao banco com a `service_role` — uma chave que ignora as políticas de segurança em nível de linha (RLS) que o Postgres oferece. Essa escolha existe porque o backend precisa fazer operação administrativa em nome de qualquer escritório (por exemplo, um agendador rodando lembretes para todos os escritórios ativos ao mesmo tempo) — um modelo de acesso restrito por RLS, pensado para uma sessão de usuário único, não encaixa diretamente nesse tipo de operação em lote.

A consequência dessa escolha é que a proteção de isolamento entre escritórios não vem do banco — vem inteiramente da disciplina de sempre incluir `firm_id` em cada consulta, na camada de aplicação. As políticas RLS existem no schema do banco, mas são hoje irrelevantes para o tráfego real, porque nada usa uma chave que respeitaria essas políticas.

## O padrão de repositório

Cada função de repositório que busca ou grava dado tenant-scoped recebe o `firm_id` como parâmetro explícito, derivado sempre da sessão autenticada — nunca de um valor que o cliente da API poderia manipular livremente. Esse padrão foi verificado como consistente em toda a camada de repositórios na auditoria de 12/08/2026.

## O que isso implica para quem desenvolve

Todo código novo que toca dado de escritório precisa seguir esse padrão manualmente — não existe uma rede de segurança automática no banco que bloquearia uma consulta que esqueça o filtro. É por isso que o teste de isolamento entre escritórios (hoje não conectado a nenhum pipeline automático — ver [SECURITY-GATES.md](../06-SEGURANCA/SECURITY-GATES.md)) é tão importante: é a única forma de pegar esse tipo de erro antes de chegar em produção.

## Caminho futuro considerado

Existe a possibilidade, de médio prazo, de emitir tokens de autenticação compatíveis com o mecanismo nativo do Supabase, permitindo que RLS realmente proteje consultas feitas com um papel de acesso mais restrito — deixando a `service_role` só para as operações administrativas que genuinamente precisam dela. Isso é direção considerada, não trabalho em andamento hoje.
