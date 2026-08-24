# API

> Documento que escrevi a partir da leitura direta de `backend/src/routes/mount-api-routes.js`, `backend/src/routes/contabil-auth.routes.js`, `contabil-public.routes.js`, `contabil.routes.js` (e o subdiretório `contabil/`), `contabil-portal.routes.js`, e `backend/src/app.js`. Não fiz um índice endpoint a endpoint — isso seria cópia do código — é o mapa dos grupos de rota e o princípio de autorização que rege cada um.

## Versionamento

Monto a API duas vezes, a partir do mesmo conjunto de rotas (`mountApiRoutes`, em `backend/src/routes/mount-api-routes.js`): uma vez sob `/api/v1` (versão corrente) e outra sob `/api`, sem prefixo de versão, marcada como depreciada — toda resposta nesse segundo caminho recebe cabeçalho `Deprecation` e `Link` apontando para o sucessor (`/api/v1`). Fiz isso para não quebrar cliente antigo (o próprio frontend, historicamente) enquanto a migração para caminho versionado se completa.

## Os quatro grupos de rota

Monto cada grupo sob um prefixo próprio, dentro de `/api/v1` (e do alias depreciado `/api`):

### `/auth` — autenticação

Cadastro de escritório, login, logout, recuperação de senha, confirmação de conta, fluxo de convite. É o único grupo que pensei para funcionar sem sessão prévia por definição — seu propósito é justamente criar uma. O cadastro de escritório é também o único ponto onde decido `country_code`: o parâmetro `countryCode` recebido aqui é validado contra o registro de país (`resolveCountryConfig`) antes de gravar o escritório — um país não suportado é rejeitado nesse momento, não aceito silenciosamente (ver [INTERNATIONALIZATION.md](./INTERNATIONALIZATION.md)).

### `/public` — rotas públicas

Não exigem sessão de usuário, mas não deixei "sem proteção": rota sensível tem limitação de taxa própria (ex.: newsletter, formulário de suporte) e, em ponto específico, verificação de Turnstile (captcha) antes de aceitar o envio. Inclui, entre outras coisas, a busca de CEP/código postal, a página pública de agendamento do escritório, o webhook público de saúde de integração usado por monitoramento externo, e um endpoint que expõe o registro de país suportado (`GET /public/countries`, que devolve a lista pública gerada por `listSupportedCountries()` — configuração, não dado de tenant, por isso é seguro deixar sem autenticação).

### `/contabil` — aplicação autenticada do escritório

O grupo maior: tudo que a equipe do escritório usa depois de logada — cliente, documento, obrigação, tarefa, agendamento, mensagem, configuração, cobrança da assinatura do Teglion (`/contabil/billing/*`), Stripe Connect (`/contabil/connect/*`), domínio próprio do escritório. Toda rota aqui passa por `authMiddleware` e, exceto o subconjunto de cron interno, por `requireActiveFirm` — ou seja, exige sessão válida **e** escritório em condição de uso antes de chegar ao controller (ver [MULTI_TENANCY.md](./MULTI_TENANCY.md)). Rota que mexe em algo restrito ao dono do escritório usa adicionalmente `requireFirmOwner` ou `requirePermission`/`requireRole` (`backend/src/middlewares/role.middleware.js`).

Uma exceção deliberada que abri dentro desse grupo: as rotas de cron interno (`backend/src/routes/contabil/cron.routes.js`, ex.: disparo de automação para todos os escritórios) são montadas **antes** de `authMiddleware`, e usam `requireCronSecret` no lugar de sessão de usuário — porque quem chama essas rotas é o próprio agendador do sistema, não uma pessoa logada.

### `/client-portal` — portal do cliente

O que o cliente final do escritório usa: painel próprio (`/me/contabil/hub`, `/me/contabil/dashboard`), documento, obrigação, tarefa, notificação. Passa por `authMiddleware` como o grupo contábil, mas a sessão aqui carrega `clientId` além de `firmId` — e fiz a camada de repositório, para esse grupo, filtrar por ambos. Um cliente nunca vê dado de outro cliente do mesmo escritório, nem dado de outro escritório.

## Webhook: fora do padrão de rota, por necessidade técnica

Os webhooks do Stripe (`/api/public/stripe/webhook` para o billing do Teglion, `/api/public/stripe/connect/webhook` para pagamento de cliente final ao escritório) não passam pelo mesmo caminho dos outros grupos: registro os dois diretamente em `backend/src/app.js`, com corpo bruto (`express.raw`), antes do parser JSON global aplicado ao resto da API. Isso é exigência da própria verificação de assinatura do Stripe, que precisa do corpo exato da requisição, byte a byte — não de uma versão reserializada depois de passar por `express.json()`. Cada um verifica a assinatura do evento antes de processar, e ambos usam a mesma proteção que montei contra reprocessamento duplicado (registro do identificador do evento antes de agir sobre ele). Ver [INTEGRATIONS.md](./INTEGRATIONS.md).

## Princípio comum de autorização

Em qualquer grupo autenticado (`/contabil`, `/client-portal`, e o subconjunto autenticado de `/auth` após login), o contexto de quem está fazendo a requisição — `firmId`, `clientId`, `role`, `permissions` — vem sempre do JWT de sessão, nunca de um campo do corpo ou de um parâmetro de URL enviado pelo cliente da API. É esse detalhe, mais do que qualquer verificação isolada, que sustenta o isolamento entre escritórios que descrevi em [MULTI_TENANCY.md](./MULTI_TENANCY.md).

## Onde aprofundar

- [ARCHITECTURE.md](./ARCHITECTURE.md) — o fluxo completo de uma requisição, camada por camada.
- [MULTI_TENANCY.md](./MULTI_TENANCY.md) — como o contexto de tenant é extraído e validado.
- [`docs/security/AUTHENTICATION.md`](../security/AUTHENTICATION.md) — o mecanismo de autenticação (JWT, cookie, renovação de sessão) em detalhe.
- [INTEGRATIONS.md](./INTEGRATIONS.md) — autenticação e autorização específicas de cada integração externa.
