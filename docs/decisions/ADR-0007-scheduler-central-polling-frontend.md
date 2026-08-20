# ADR-0007 — Scheduler central de polling no frontend, em vez de temporizadores independentes por componente

## Status

Aceito, com padrão complementar ainda em uso paralelo em parte do sistema. Decisão já em vigor — documentei retroativamente em 18/08/2026.

## Contexto

O frontend do Teglion precisa manter dados relativamente atualizados sem depender de WebSockets/push em tempo real para tudo — uso polling (verificação periódica) para atualizar caches do React Query. Antes desta decisão, minha equipe já tinha identificado um problema de polling duplicado no frontend: vários componentes, cada um com seu próprio `setInterval`, disparando requisições de forma independente e redundante — o mesmo tipo de problema que a auditoria de requisições HTTP de 18/08/2026 voltou a confirmar em outras áreas do sistema (ver item 1.2 do roadmap).

## Problema

Como eu mantenho os dados visíveis na interface razoavelmente atualizados via polling, sem que cada componente ou hook rode seu próprio temporizador independente — o que multiplica requisições ao backend proporcionalmente ao número de componentes montados, não ao número de usuários?

## Decisão

Construí um scheduler central de polling por "shell" da aplicação (escritório ou cliente): `frontend/src/shared/hooks/useAppPollingScheduler.ts`. Um único `window.setInterval`, a cada 120 segundos, invalida um conjunto fixo de chaves de cache do React Query (`queryKeys.liveEventsRoot`, e — dependendo do escopo — `firm-inbox`/`firmDashboard` para escritório, ou `clientPortalHub`/notificações/mensagens/pedidos de documento para cliente), em vez de cada componente que consome esses dados rodar seu próprio timer. Deixei a intenção registrada no próprio comentário do código: "Um único scheduler por shell (firm/client) invalida caches em vez de N intervals." O scheduler também respeita visibilidade da aba (`document.visibilityState`) e um debounce de 3 segundos ao voltar o foco, e verifica se as queries estão pausadas por rate limit antes de disparar.

## Alternativas consideradas

- **Manter um `setInterval`/`refetchInterval` por componente ou hook que precisa de dados atualizados.** Era o padrão anterior que causava o problema de "N intervals" que mencionei no comentário do código — descartei porque o número de requisições cresce com o número de componentes montados na tela, não com uma cadência previsível que eu controle centralmente.

## Motivos da decisão

- Um único timer por shell da aplicação é previsível para mim: o número de requisições de polling não cresce conforme a interface ganha mais componentes ou mais partes da tela passam a depender de dados "quase em tempo real".
- Centralizar em invalidação de cache (em vez de refetch direto) deixa o React Query decidir o que efetivamente precisa buscar de novo, aproveitando o cache existente quando possível.
- Corrijo um problema concreto que minha equipe já tinha identificado antes desta implementação — não é uma otimização especulativa, é resposta a um padrão de duplicação que eu já tinha observado.

## Consequências positivas

- Reduzo de verdade o número de requisições de polling simultâneas por sessão de usuário, especialmente em telas com muitos componentes.
- Tenho um único lugar para ajustar cadência, pausar por rate limit, ou adicionar/remover o que é invalidado no tick — em vez de precisar caçar vários `setInterval` espalhados pelo código.
- Respeito visibilidade da aba, evitando polling desperdiçado quando a aba está em segundo plano.

## Consequências negativas

- O scheduler central resolve o polling de "eventos ao vivo" e dados de hub/dashboard, mas não é, e não pretendo que seja, a única forma de polling do sistema. Mesmo com ele em produção, a auditoria de 18/08/2026 confirmou que ainda tenho **6 hooks de badge no lado do escritório com `refetchInterval` próprio e independente**, em `frontend/src/features/firm/useFirmNavBadges.ts`: `useFirmMessagesUnread`, `useFirmServiceInquiriesUnseen`, `useFirmConsultationsAttention`, `useFirmDocumentsPending`, `useFirmTasksAttention` e `useFirmObligationsAttention`, cada um com seu próprio intervalo (variando entre 60 e 90 segundos). Isso não contradiz esta decisão — é um padrão complementar deliberado que mantenho para contadores específicos de badge, que têm necessidades de atualização diferentes entre si — mas significa que o scheduler central não eliminou todo polling independente do sistema, só a categoria de dados que ele cobre.
- Além disso, a mesma auditoria encontrou duplicações reais de requisições em outras partes do frontend que não têm relação direta com o scheduler (chamadas repetidas a `listObligations()`, `listDocumentRequests()`, e a lista de clientes do escritório buscada de forma independente em pelo menos nove lugares) — ver `docs/ROADMAP.md`, item 1.2, estado `PRÓXIMO`, prioridade P1. Isso me mostra que o problema de requisições redundantes no frontend é mais amplo do que o que este scheduler resolve; resolvi uma categoria (polling de "eventos ao vivo"/hub), não o problema inteiro.

## Riscos

- Novo código que precise de dados "quase em tempo real" pode, por conveniência, adicionar mais um `refetchInterval` independente em vez de estender o scheduler central ou os hooks de badge que já tenho — reintroduzindo o mesmo padrão de "N intervals" que criei esta decisão para evitar.
- Os 6 hooks de badge, por serem independentes entre si e do scheduler central, são um ponto de manutenção espalhado para mim: uma mudança de cadência de polling geral não os atinge automaticamente, exigindo que eu altere cada um.

## Impacto futuro

- Antes de adicionar um novo `setInterval` ou `refetchInterval` isolado em um componente novo, preciso avaliar se o dado pode ser coberto pela invalidação do scheduler central que já existe.
- As duplicações que confirmei no item 1.2 do roadmap (chamadas repetidas a `listObligations()`, `listDocumentRequests()`, lista de clientes buscada em nove lugares, etc.) são um trabalho de correção separado deste ADR — não são polling propriamente dito na maioria dos casos, é falta de cache compartilhado entre componentes que buscam o mesmo dado de forma independente.
- Vale eu considerar, como evolução futura, se os 6 hooks de badge deveriam ser consolidados numa única fonte (por exemplo, um endpoint de contadores agregados) em vez de seis requisições independentes — isso reduziria ainda mais o número de chamadas de polling do lado do escritório, mas é uma mudança de escopo maior do que a coberta por este ADR.

## Relação com outros ADRs

Não há dependência direta de outro ADR deste conjunto — esta é uma decisão de arquitetura de frontend, independente do isolamento multi-tenant (ADR-0001/0002), da plataforma de dados (ADR-0003) ou de autenticação (ADR-0004).
