# Frontend

> Fonte consolidada: `docs/04-ARQUITETURA/FRONTEND.md` (removido após esta migração).

Uso React 19, Vite 6, TypeScript. É uma SPA com prerender para o blog e suporte a PWA. Faço deploy na Vercel, como processo separado do backend — toda comunicação com o servidor acontece por chamada HTTP à API do Teglion, nunca diretamente ao Supabase (ver [ARCHITECTURE.md](./ARCHITECTURE.md)).

## Organização

Dividi o código em `frontend/src/` em cinco áreas com responsabilidade clara:

- **`features/`** — cada funcionalidade do produto (cliente, documento, mensagem, agendamento, captação pública, painel do escritório, portal do cliente) vive isolada aqui. É a maior parte do código da aplicação.
- **`infrastructure/`** — a camada que fala com a API do backend: cliente HTTP, chamadas por domínio, sem regra de negócio.
- **`core/`** — o que é transversal ao app inteiro: configuração, roteamento de alto nível, autenticação do lado do cliente.
- **`shared/`** — componente e utilitário reaproveitado entre features, sem lógica de negócio específica de um domínio. É aqui que vive, por exemplo, a configuração de país usada pela interface (`shared/config/country/countryConfig.ts` — ver [INTERNATIONALIZATION.md](./INTERNATIONALIZATION.md)).
- **`content/`** — conteúdo estático, principalmente o material do blog.

## Estado e dados

Gerencio estado de servidor via React Query. Um ponto de desenho que vale destacar: fiz notificação e mensagem usarem um único agendador de polling consolidado por sessão, em vez de cada componente abrir o próprio intervalo — isso evita que o número de requisições cresça proporcional à quantidade de componente na tela, só ao número de sessões ativas.

## Internacionalização

Já preparei o frontend com i18n desde a base (i18next, ver `frontend/src/shared/i18n/`) — reflete a mesma decisão que tomei no backend de tratar idioma como configuração, não como texto fixo espalhado pelo código. Isso é a pré-condição técnica para operar em outro mercado, mas ter a estrutura pronta não é o mesmo que ter o conteúdo traduzido — ver [INTERNATIONALIZATION.md](./INTERNATIONALIZATION.md) para o estado real disso hoje.

## Build e bundle

Configurei o Vite com divisão manual de pacote (`manualChunks`) — separo biblioteca de terceiro grande (componente de interface, roteamento, consulta de dado, i18n) e o conteúdo do blog em pedaços próprios do bundle, em vez de carregar tudo de uma vez. Isso é consciência real de tamanho de bundle no projeto, não uma configuração padrão esquecida.

## O que não foi verificado nesta rodada

Cobertura de teste E2E de frontend (Playwright), profundidade de teste de componente e acessibilidade não entraram no escopo aprofundado da auditoria que fiz para este documento — não assumo que estejam em determinado estado sem confirmar.

## Onde aprofundar

- [ARCHITECTURE.md](./ARCHITECTURE.md) — como o frontend se encaixa no fluxo completo de uma requisição.
- [API.md](./API.md) — os grupos de rota que o `infrastructure/` do frontend consome.
