# Backend

Node.js com Express. Organizado por módulo de domínio dentro de `backend/src/modules/` — cada pasta é uma área de negócio (auth, firm, client, billing, booking, documents, messages, fiscal, obligations, news, broadcasts, integrations, public, service-requests, tasks, entre outros), com o próprio conjunto de controller, service e rotas.

## Padrão dentro de um módulo

`routes → middlewares → controller → service → repository`. O repository é sempre a última camada antes do Supabase — nenhum controller ou service monta consulta ao banco diretamente. Esse padrão foi verificado como consistente na auditoria de 12/08/2026, não é regra teórica descumprida na prática.

## Middlewares principais

Autenticação (extrai e valida o usuário a partir do cookie JWT), controle de acesso por escritório e por papel, CSRF, sanitização de log e de resposta, tratamento central de erro (que também dispara o registro no Sentry quando configurado), limitação de taxa de requisição, e um middleware específico para proteger rotas de cron interno com um segredo próprio.

## Tratamento de erro

Existe um handler central de erro que padroniza a resposta, evita vazar detalhe interno sensível na mensagem de erro para o cliente, e passa pela sanitização de log antes de registrar — mas essa sanitização central não cobre chamadas de log feitas fora desse caminho (ver [SECURITY.md](../06-SEGURANCA/SECURITY.md) para o detalhe desse risco).

## Jobs e tarefas em segundo plano

Este é o ponto mais importante para quem for pensar em escala: hoje existe apenas um mecanismo real de fila (baseado em Redis), usado para um único tipo de tarefa (lembrete de obrigação por escritório). Todo o resto — envio de email, por exemplo — roda de forma síncrona, dentro da própria requisição HTTP que o originou. Isso funciona bem no volume atual, mas é o primeiro lugar onde a arquitetura sente fricção conforme o número de escritórios ativos cresce (ver a análise de escala no [roadmap de longo prazo](../02-ROADMAP/LONG-TERM.md)).

## Agendadores (schedulers)

Rodam dentro do próprio processo do backend, não em um worker separado — o lembrete de obrigação, por exemplo, roda a cada hora para todo escritório ativo, chamado no boot do processo. Não há orquestração de job distribuída hoje.

## Onde aprofundar

[DATABASE.md](./DATABASE.md) para o schema, [MULTI-TENANCY.md](./MULTI-TENANCY.md) para como o isolamento é desenhado, [AUTH.md](./AUTH.md) para autenticação.
