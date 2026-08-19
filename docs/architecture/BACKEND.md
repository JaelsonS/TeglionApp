# Backend

> Fonte consolidada: `docs/04-ARQUITETURA/BACKEND.md` (removido após esta migração).

Node.js com Express. Organizado por módulo de domínio dentro de `backend/src/modules/` — cada pasta é uma área de negócio (`auth`, `firm`, `client`, `billing`, `connect`, `booking`, `documents`, `document-requests`, `messages`, `inbox`, `fiscal`, `obligations`, `tasks`, `news`, `broadcasts`, `consultations`, `integrations`, `public`, `service-requests`, `tracking`, `live`, `notifications`, `push`, `automations`, `entitlements`, `legal`, entre outros), cada uma com o próprio conjunto de controller, service e rotas.

## Padrão dentro de um módulo

`routes → middlewares → controller → service → repository`. O repository é sempre a última camada antes do Supabase — nenhum controller ou service monta consulta ao banco diretamente. Esse padrão é consistente entre módulos.

## Middlewares principais

Todos vivem em `backend/src/middlewares/`:

- **Autenticação** (`auth.middleware.js`) — extrai e valida o usuário a partir do cookie JWT.
- **Contexto de escritório** (`firm-access.middleware.js`, `firm-owner.middleware.js`) — controle de acesso por escritório ativo e por dono do escritório.
- **Papel e permissão** (`role.middleware.js`) — restringe rota por `role` ou por permissão granular.
- **CSRF** (`csrf.middleware.js`).
- **Sanitização** de log (`log-sanitization.middleware.js`) e de resposta (`response-sanitize.middleware.js`).
- **Tratamento central de erro** (`error.middleware.js`) — também dispara registro no Sentry quando configurado (`sentry.middleware.js`).
- **Limitação de taxa de requisição**, aplicada pontualmente em rotas sensíveis (ex.: newsletter, suporte, registro de conta).
- **Cron interno** (`cron-secret.middleware.js`) — protege rota de automação disparada por agendador externo com um segredo próprio, fora do fluxo normal de sessão de usuário.
- **Idioma da requisição** (`i18n.middleware.js`) — resolve o locale e expõe `req.locale`/`req.t` para o resto da cadeia (ver [INTERNATIONALIZATION.md](./INTERNATIONALIZATION.md) para o estado real de uso disso).
- **Request context** (`request-context.middleware.js`) e **timing** (`request-timing.middleware.js`) — instrumentação por requisição.

## Tratamento de erro

Existe um handler central de erro que padroniza a resposta, evita vazar detalhe interno sensível na mensagem de erro devolvida ao cliente, e passa pela sanitização de log antes de registrar — mas essa sanitização central não cobre chamada de log feita fora desse caminho (ver [`docs/security/SECURITY.md`](../security/SECURITY.md) para o detalhe desse risco).

## Jobs e tarefas em segundo plano

Este é o ponto mais importante para quem for pensar em escala: hoje existe apenas um mecanismo real de fila, baseado em Redis, usado para um único tipo de tarefa — lembrete de obrigação por escritório. Todo o resto, envio de email por exemplo, roda de forma síncrona, dentro da própria requisição HTTP que o originou. Isso funciona bem no volume atual (4 escritórios pilotos), mas é o primeiro lugar onde a arquitetura sente fricção conforme o número de escritórios ativos cresce.

## Agendadores (schedulers)

Rodam dentro do próprio processo do backend, não em um worker separado — o lembrete de obrigação, por exemplo, roda a cada hora para todo escritório ativo, disparado no boot do processo. Não há orquestração de job distribuída hoje.

## Entrada da API e webhook

O processo Express (`backend/src/app.js`) monta as rotas de API em `backend/src/routes/mount-api-routes.js`, com prefixo `/api/v1` como versão atual e `/api` mantido como alias depreciado (ver [API.md](./API.md)). Os webhooks do Stripe (billing e Connect) são a exceção deliberada a esse caminho: são registrados diretamente em `app.js`, com corpo bruto (`express.raw`), antes do parser JSON global — necessário porque a verificação de assinatura do Stripe exige o corpo exato, não reserializado (ver [INTEGRATIONS.md](./INTEGRATIONS.md)).

## Onde aprofundar

- `docs/database/DATABASE.md` — schema, migrations, índices.
- [MULTI_TENANCY.md](./MULTI_TENANCY.md) — como o isolamento entre escritórios é desenhado.
- [`docs/security/AUTHENTICATION.md`](../security/AUTHENTICATION.md) — autenticação e sessão em detalhe.
- [API.md](./API.md) — grupos de rota e princípios de autorização.
