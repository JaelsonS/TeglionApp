# Frontend

React 19, Vite 6, TypeScript. SPA com prerender para o blog e suporte a PWA. Deploy na Vercel.

## Organização

A base do código fica dividida em cinco áreas com responsabilidade clara:

- **`features/`** — cada funcionalidade do produto (clientes, documentos, mensagens, agendamento, captação pública, painel do escritório, portal do cliente) vive isolada aqui, é a maior parte do código da aplicação.
- **`infrastructure/`** — a camada que fala com a API do backend: clientes HTTP, chamadas por domínio, nada de regra de negócio.
- **`core/`** — o que é transversal ao app inteiro (configuração, roteamento de alto nível, autenticação do lado do cliente).
- **`shared/`** — componentes e utilitários reaproveitados entre features, sem lógica de negócio específica de um domínio.
- **`content/`** — conteúdo estático, principalmente o material do blog.

## Estado e dados

Gerenciamento de estado de servidor via React Query. Um ponto de desenho que vale destacar porque a auditoria de performance confirmou que funciona bem: notificações e mensagens usam um único agendador de polling consolidado por sessão, em vez de cada componente abrir seu próprio intervalo — isso evita que o número de requisições cresça proporcional à quantidade de componentes na tela, só ao número de sessões ativas.

## Internacionalização

O frontend já é preparado com i18n desde a base, refletindo a mesma decisão arquitetural do backend de tratar idioma como configuração, não como texto fixo espalhado pelo código — o que é a pré-condição técnica para a visão de expansão internacional descrita em [EXPANSAO-INTERNACIONAL.md](../01-ESTRATEGIA/EXPANSAO-INTERNACIONAL.md).

## Build e bundle

O Vite está configurado com divisão manual de pacotes (`manualChunks`) — bibliotecas de terceiros grandes (componentes de interface, roteamento, consulta de dados, i18n) e o conteúdo do blog são separados em pedaços próprios do bundle, em vez de tudo carregado de uma vez. Isso mostra consciência real de tamanho de bundle no projeto, não uma configuração padrão esquecida.

## O que não foi verificado nesta rodada

Cobertura de teste E2E de frontend (Playwright), profundidade de testes de componente, e acessibilidade não foram escopo aprofundado desta auditoria — não presuma que estão em determinado estado sem confirmar.
