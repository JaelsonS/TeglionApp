# Roadmap do Teglion

**Esse é o único roadmap que eu uso.** Se eu esbarrar em qualquer outro documento com lista de tarefas, sprints ou "próximos passos" que não seja esse arquivo, já sei que ele está desatualizado — corrijo ou arquivo. Nenhuma outra lista de prioridades no repositório tem autoridade sobre essa aqui.

Última vez que eu atualizei: 18 de agosto de 2026, depois de três auditorias técnicas completas que eu fiz nessa data (multi-tenancy e segurança, requisições HTTP/polling, e preparação para expansão internacional). Onde uma afirmação vem de uma dessas auditorias, eu marco isso. Onde eu ainda não investiguei fundo o suficiente pra ter certeza, eu também marco — não quero fingir que sei o que ainda não sei.

---

## Como eu uso esse documento

Em cada item eu escrevo: **o que eu preciso fazer**, **por que**, **prioridade** (P0 a P3), **do que depende**, **estado**, **como eu vou saber que terminei** e, quando dá, **a evidência**.

Estados que eu uso:

- `CONCLUÍDO` — eu já fiz, e tenho evidência (teste, código que eu li direto, log de execução real).
- `EM ANDAMENTO` — estou trabalhando nisso agora, ainda não fechei.
- `PRÓXIMO` — é a minha prioridade imediata depois do que está em andamento.
- `PLANEJADO` — está no meu roadmap, mas eu ainda não comecei.
- `BLOQUEADO` — eu não consigo avançar até outra coisa acontecer (técnica, jurídica ou uma decisão minha).
- `A VALIDAR` — pode já estar pronto, mas eu ainda não comprovei o suficiente pra marcar como concluído.

Prioridades que eu uso:

- **P0** — risco ativo hoje (segurança, integridade de dados, ou algo que já está quebrado pro usuário). Não espero a próxima sprint.
- **P1** — importante, entra no meu próximo ciclo de trabalho.
- **P2** — relevante, mas posso esperar sem risco imediato.
- **P3** — otimização ou preparação pra um estágio futuro que ainda não chegou.

Regra que eu sigo: só marco algo como `CONCLUÍDO` quando eu tenho evidência — código que eu li, teste rodando, log real. Código que eu implementei pela metade fica `EM ANDAMENTO`, nunca `CONCLUÍDO`.

---

## Minha visão de longo prazo

Eu criei o Teglion pra tirar o contador de dentro do WhatsApp e da planilha e dar ao escritório de contabilidade um lugar único onde cliente, documento, obrigação e cobrança se encontram. Comecei em Portugal, sou brasileiro, e minha tese de expansão sempre foi natural: se funciona pra um escritório português, o mesmo problema existe — com regras fiscais diferentes — no Brasil, e depois em qualquer mercado onde contabilidade ainda vive espalhada entre apps genéricos.

Minha visão de dez anos é uma plataforma que um escritório de qualquer tamanho, em qualquer país de língua portuguesa (e depois além disso), possa adotar com confiança de que os dados do cliente A nunca vazam pro escritório B, que o sistema não cai quando minha equipe crescer de 4 pra 40 pessoas, e que o Teglion continua evoluindo sem depender só de mim saber onde cada coisa está guardada.

Isso não é uma promessa de que eu já cheguei lá. É a régua contra a qual eu meço cada decisão de arquitetura desse roadmap.

## Onde eu estou (agosto de 2026)

- **4 escritórios pilotos** usando o sistema em produção/staging.
- Monólito modular: backend Node/Express, frontend React/Vite, Postgres via Supabase (Auth + Storage + RLS), Stripe pra cobrança, integração com Google Calendar/Drive, e-mail transacional via Brevo.
- Isolamento multi-tenant por `firm_id`, que eu apliquei de forma consistente nos repositórios de dados, com RLS como camada adicional de defesa (não a fronteira principal — meu backend acessa via `service_role`, que ignora RLS; a fronteira real é o filtro explícito que eu coloco em cada consulta).
- Reescrevi minha documentação recentemente (12/08/2026) com disciplina real de "implementado vs. parcial vs. não existe" — mas meu roadmap tinha ficado fragmentado em onze arquivos contando duas histórias diferentes, o que esse documento aqui resolve.
- Estou no meio de uma auditoria de segurança e multi-tenancy mais ampla (comecei em paralelo a esse trabalho de documentação) e ainda não terminei todos os módulos dela — o que já tem evidência concreta eu já listei na Fase 0; o resto eu incorporo aqui assim que terminar, não antes.

---

## FASE 0 — Segurança e fundação

Minha prioridade absoluta. Nada do resto importa se a base não é sólida.

### 0.1 — Corrigir vazamento cross-tenant que eu confirmei no rastreamento de visualizações

- **Estado:** `CONCLUÍDO`
- **Prioridade:** P0 (era)
- **O que era:** Os endpoints `POST /api/me/contabil/documents/:id/view` e `.../obligations/:id/view` liam `view_count` e `first_viewed_at`/`last_viewed_at` filtrando só por `id`, sem `firm_id`, em `backend/src/services/tracking/view-tracking.service.js`. Um usuário com papel CLIENT de qualquer escritório que descobrisse o UUID de um documento ou obrigação de outro escritório conseguia ler essa metadata na resposta.
- **O que corrigi em 20/08/2026:** adicionei `.eq('firm_id', firmId)` nas duas leituras dentro de `recordView()` (a escrita já filtrava corretamente por `firm_id`, só as duas leituras que compõem a resposta não filtravam). Escrevi `view-tracking.service.test.js` cobrindo os dois cenários: cliente do escritório B lendo `entityId` do escritório A (antes vazava o contador real, `47`; agora recebe `0`, e o contador do escritório A continua intocado), e o caso normal (mesmo escritório) continuando a funcionar sem regressão.
- **Como terminei:** `backend/src/services/tracking/view-tracking.service.test.js` (2 testes) passando, suíte completa do backend (500 testes) passando.
- **Evidência:** `backend/src/services/tracking/view-tracking.service.js`, `backend/src/services/tracking/view-tracking.service.test.js` (novo). Achado original da minha auditoria de multi-tenancy, 18/08/2026 (F1).

### 0.2 — SEC-H1 (escalação de staff a FIRM_OWNER) — eu confirmei que já está corrigido

- **Estado:** `CONCLUÍDO`
- **Prioridade:** P0 (era) — já fechei esse item.
- **O que era:** Em `docs/historico/FASE-1-PRODUCT-AUDIT.md` (13/08/2026) eu tinha registrado um achado de que um usuário com papel STAFF e permissão `USERS_UPDATE` conseguia se promover a `FIRM_OWNER` via `PATCH /team/:id`.
- **Como resolvi:** Confirmei lendo o código direto em 19/08/2026 (durante a reestruturação de documentação): `backend/src/modules/firm/team.service.js` já tem uma guarda dedicada (`assertActorCanAssignRole`, com comentário citando "SEC-H1" explicitamente), e existem 8 testes automatizados cobrindo o cenário em `team.service.test.js`, todos passando no CI. Eu já tinha corrigido isso no commit `f1c3121` (13/08/2026) — o mesmo dia que fechei o Sprint 0, só que eu nunca tinha atualizado nenhum documento narrativo pra registrar essa correção especificamente.
- **Evidência:** `docs/security/AUTHORIZATION.md`, seção sobre SEC-H1; commit `f1c3121`; `backend/src/modules/firm/team.service.test.js`.
- **O que eu aprendi:** É mais um exemplo do padrão que eu descrevo na Fase 1 — eu corrigi de verdade, mas não atualizei a documentação pra refletir isso. A diferença é que dessa vez eu encontrei e corrigi o registro no mesmo ciclo de trabalho.

### 0.3 — Corrigir o cálculo de "hoje" nas obrigações (uso UTC fixo, não o fuso do escritório)

- **Estado:** `CONCLUÍDO` para o bug em si (Portugal) — continua `BLOQUEADO` por 3.2 pra suportar de verdade outro país além de Portugal
- **Prioridade:** P0 (era)
- **O que era:** `syncOverdueObligations` (`backend/src/db/supabase/repositories/contabil/obligations.repository.js`) e `runAutomationsForFirm` (`automation.service.js`) calculavam "hoje" com `new Date().toISOString().slice(0, 10)` — sempre UTC, nunca o fuso real do escritório.
- **O que corrigi em 20/08/2026:** criei `backend/src/utils/firm-timezone.js` (usa `dayjs` + plugin de timezone, que já era dependência do módulo de Booking) com `resolveFirmTimezone()` (lê `firm.settings.booking.timezone`, cai pra `Europe/Lisbon` se não houver valor válido) e `todayInTimezone()`. Liguei os dois pontos que eu tinha identificado a esse utilitário — ambos agora buscam a `firm` antes de calcular "hoje", em vez de assumir UTC direto. Escrevi um teste isolado provando o bug real com datas concretas (`2026-07-15T23:30:00Z` é `15/07` em UTC mas já `16/07` em Lisboa no horário de verão) e testes de integração nos dois pontos, usando Atlantic/Azores (UTC-1 sem DST) pra ficar determinístico o ano inteiro.
- **Ressalva honesta:** isso resolve o bug real pra Portugal (meus 4 escritórios pilotos de hoje) — o fuso agora reflete `settings.booking.timezone` de cada escritório em vez de UTC fixo. Não criei a coluna `firms.timezone` nem ampliei a allow-list de fusos pra incluir horários brasileiros — isso continua sendo o item 3.2, que eu não fiz nessa rodada (estava fora do escopo que eu combinei: só Fase 0 + Fase 1). Ou seja: o bug que eu tinha (erro de fuso pra quem já está em produção) está corrigido; o pré-requisito pro Brasil (item 4.1) continua pendente do 3.2.
- **Como terminei:** `backend/src/utils/firm-timezone.test.js` (6 testes), mais um teste de integração cada em `obligations.repository.test.js` e no novo `automation.service.test.js` — suíte completa do backend (500 testes) passando.
- **Evidência:** `backend/src/utils/firm-timezone.js` (novo), `backend/src/utils/firm-timezone.test.js` (novo), `backend/src/modules/automations/automation.service.test.js` (novo), commit ainda não criado (fica no working tree, conforme combinado).

### 0.4 — Manter o gate de segurança automatizado rodando no CI

- **Estado:** `CONCLUÍDO`
- **Prioridade:** P0 (manutenção contínua)
- **O que já fiz:** O teste de isolamento entre tenants roda automaticamente no CI e derruba o pipeline (fail-closed) se os segredos de staging estiverem ausentes.
- **Evidência:** Confirmei lendo direto `.github/workflows/ci.yml` (linhas 57-72) durante a reestruturação de documentação, 18/08/2026. Isso corrige uma afirmação desatualizada que ainda estava em `docs/04-ARQUITETURA/MULTI-TENANCY.md` e `docs/06-SEGURANCA/MULTI-TENANT-SECURITY.md` (ambos de 12/08, que eu nunca atualizei depois de o gate entrar em produção em 13/08) — ver Fase 1.

### 0.5 — Rotação de segredos de produção

- **Estado:** `CONCLUÍDO` *(segundo `docs/historico/SPRINT-0.md`, eu concluí esse item em 13/08/2026 — não reverifiquei de forma independente nessa rodada de auditoria)*
- **Prioridade:** P0 (manutenção contínua)
- **Evidência:** `SPRINT-0.md`. Devo fazer uma verificação independente periódica (não só confiar no registro), principalmente antes de eu crescer a equipe.

### 0.6 — Teste de restauração de backup

- **Estado:** `CONCLUÍDO` *(dois drills reais que eu registrei em 13/08/2026, com RTO observado, em `docs/database/BACKUPS.md`, migrado de `docs/operations/BACKUP_RESTORE.md`)*
- **Prioridade:** P0 (preciso repetir periodicamente, não é um evento único)
- **Meu próximo passo:** Definir uma cadência pra repetir o drill (trimestral é uma referência razoável pro meu estágio atual) — hoje eu ainda não defini essa cadência. Ver item 0.7.

### 0.7 — Definir RPO/RTO formalmente e uma cadência de teste de disaster recovery

- **Estado:** `PLANEJADO`
- **Prioridade:** P1
- **O que eu preciso fazer:** Os dois drills de 13/08 já me dão um RTO observado na prática, mas eu ainda não defini formalmente um RPO/RTO como meta (o que é diferente de "o que aconteceu na única vez que eu testei").
- **Como vou saber que terminei:** Documento formal com RPO/RTO-alvo, cadência de teste definida (minha sugestão: trimestral), e o próximo drill já agendado.

---

## FASE 1 — Estabilidade

### 1.1 — Corrigir os documentos com informação desatualizada do Sprint 0

- **Estado:** `PRÓXIMO`
- **Prioridade:** P1
- **O que eu preciso fazer:** Nove documentos (datados 12/08) ainda descreviam riscos do Sprint 0 como abertos, quando eu mesmo já tinha marcado eles como concluídos em 13/08 no `SPRINT-0.md` e nunca voltei pra atualizar os outros. Eu já corrigi isso nessa rodada de reestruturação de documentação (ver relatório final), mas deixo registrado aqui como item de manutenção: toda vez que eu fechar uma sprint ou marco, preciso atualizar os documentos narrativos que mencionam esse risco no mesmo commit — não depois.
- **Como vou saber que terminei:** Estou seguindo minha própria política de documentação (ver `docs/governance/DOCUMENTATION_POLICY.md`) na prática, sem casos novos como esse.

### 1.2 — Corrigir requisições duplicadas que eu confirmei no frontend

- **Estado:** `CONCLUÍDO`
- **Prioridade:** P1 (era)
- **O que eram as 5 duplicações que eu tinha confirmado (auditoria de 18/08/2026):**
  1. `ClientObligationsPage` e o `ClientObligationsView` que ela renderiza faziam duas chamadas independentes a `listObligations()`.
  2. O Dashboard do cliente buscava `unreadMessages` num endpoint separado, quando esse dado já vinha na resposta do hub.
  3. `listDocumentRequests()` eu chamava de forma independente em pelo menos quatro lugares do portal do cliente, sem cache compartilhada.
  4. `FirmTasksWorkspacePage` buscava a lista de clientes do escritório duas vezes no mesmo carregamento.
  5. A lista de clientes do escritório (`contabilClientsApi.list`) eu buscava de forma independente em pelo menos nove lugares do frontend, sem nenhum compartilhar cache.
- **O que verifiquei em 20/08/2026:** as duplicações 1, 2, 4 e 5 já tinham sido corrigidas no commit `57157ba` (18/08/2026, mesmo dia da auditoria) — obligations passa a vir como prop já carregada, o Dashboard usa `hub.counts.unreadMessages`, e criei `useFirmClientsDirectory` (hook React Query compartilhado) que hoje é usado em 9 lugares do frontend, zero chamada direta remanescente a `contabilClientsApi.list`. Só a duplicação 3 (`listDocumentRequests`) continuava real — corrigi agora criando `useClientDocumentRequests` (mesmo padrão do hook de clientes) e migrando os 4 pontos (`ClientDashboardPage`, `ClientObligationsPage`, `ClientDocumentRequestsPanel`, `useClientNavBadges`) pra ele. De caminho corrigi também um `invalidateQueries({queryKey: ['client-dashboard']})` que nunca batia com nenhuma query real (chave errada, virava no-op silencioso) em `ClientDocumentRequestsPanel`.
- **Como terminei:** `frontend/tsc --noEmit` limpo, suíte completa do frontend (154 testes) passando, `npm run build` concluído sem erro, mais um teste novo (`useClientDocumentRequests.test.tsx`) provando que dois consumidores com o mesmo `clientId` compartilham uma única requisição de rede.
- **Evidência:** `frontend/src/shared/hooks/queries/useClientDocumentRequests.ts` (novo), `frontend/src/shared/hooks/queries/useClientDocumentRequests.test.tsx` (novo), `frontend/src/shared/hooks/queries/useFirmClientsDirectory.ts`, commit `57157ba`, minha auditoria de requisições HTTP/polling de 18/08/2026.

### 1.3 — Corrigir escrita não-debounced a cada poll no calendário operacional de obrigações

- **Estado:** `CONCLUÍDO`
- **Prioridade:** P1 (era)
- **O que era:** O endpoint `obligations/operational-dashboard` executava um `UPDATE` no banco a cada chamada de leitura.
- **O que verifiquei em 20/08/2026:** já estava corrigido — no mesmo commit `57157ba` (18/08/2026) que resolveu boa parte do item 1.2. `getOperationalDashboard()` (`backend/src/modules/obligations/obligation-operational.service.js`) hoje envolve `loadOperationalDashboard` (que contém o `maybeSyncOverdueObligations`, a escrita real) num `ttlCache.getOrSet` de 45 segundos — exatamente o mesmo padrão TTL-cache que já existe em `firm-dashboard.repository.js`. A escrita só roda de novo quando a cache expira, não a cada poll.
- **Evidência:** `backend/src/modules/obligations/obligation-operational.service.js`, `backend/src/utils/cache/ttl-cache.js`, commit `57157ba`.

### 1.4 — Adicionar cache ao endpoint mais chamado do sistema (`live/events`)

- **Estado:** `CONCLUÍDO`
- **Prioridade:** P1 (era)
- **O que era:** `live/events` recalculava do zero, a cada poll de ~120s por usuário, os contadores de mensagem/notificação não lida.
- **O que verifiquei em 20/08/2026:** já estava corrigido no mesmo commit `57157ba`. `backend/src/modules/live/live.service.js` hoje passa o cálculo do badge (`unreadMessages`/`unreadNotifs`) por `cachedLiveBadge()`, que usa `ttlCache.getOrSet` com uma chave por escritório+ator (`liveBadgeKey`) e TTL de 20 segundos — dentro da faixa de 15-30s que eu tinha pedido. Ressalva honesta: a parte de "reaproveitar contadores dos endpoints dedicados em vez de recalcular" eu não fiz — o badge ainda calcula os contadores do zero dentro da factory cacheada, só que agora no máximo uma vez a cada 20s por ator, não a cada poll. Isso já resolve o problema de carga real que motivou o item; a reutilização de contador entre endpoints fica como possível limpeza futura, não bloqueia esse item.
- **Evidência:** `backend/src/modules/live/live.service.js`, `backend/src/utils/cache/tenant-scoped-keys.js`, commit `57157ba`.

### 1.5 — Debounce nas buscas de texto que disparam requisição a cada tecla

- **Estado:** `CONCLUÍDO`
- **Prioridade:** P2 (era)
- **O que era:** O campo de busca do Calendário Fiscal do escritório e o feed de Alertas do portal do cliente disparavam uma requisição nova a cada tecla digitada, sem debounce.
- **O que verifiquei em 20/08/2026:** já estava corrigido, mesmo commit `57157ba`. Criei `frontend/src/shared/hooks/useDebouncedValue.ts` (400ms) e apliquei nos dois pontos que eu tinha identificado — `FiscalCalendarWorkspace.tsx` e `ClientAlertsFeed.tsx` — mais um terceiro ponto que nem estava no escopo original, `AlertsWorkspace.tsx` (o workspace de Alertas do lado do escritório).
- **Evidência:** `frontend/src/shared/hooks/useDebouncedValue.ts`, `frontend/src/features/firm/fiscal-calendar/FiscalCalendarWorkspace.tsx`, `frontend/src/features/client/ClientAlertsFeed.tsx`, `frontend/src/features/firm/alerts/AlertsWorkspace.tsx`, commit `57157ba`.

### 1.6 — Verificar a contradição entre `BOOKING.md` e o Sprint 0 sobre a race condition de agendamento

- **Estado:** `CONCLUÍDO`
- **Prioridade:** P1 (era)
- **O que era:** `docs/product/BOOKING.md` (já removido, consolidado em `FEATURES.md`) descrevia uma race condition de agendamento duplo como se ainda não estivesse corrigida; `SPRINT-0.md` marcava esse mesmo item como resolvido (constraint aplicada em staging e produção). Um dos dois estava errado.
- **O que verifiquei (20/08/2026):** o `SPRINT-0.md` estava certo. A constraint de exclusão `consultations_no_overlap` existe de verdade em `supabase/migrations/20260927010000_consultations_no_overlap.sql` (`EXCLUDE USING gist`, extensão `btree_gist`, bloqueando duas `consultations` ativas do mesmo escritório+staff com horário sobreposto, com verificação prévia de que não havia sobreposição nos dados existentes antes de criar a constraint). Confirmei também que `backend/src/modules/booking/booking.service.js` e `backend/src/modules/connect/connect-payments.service.js` capturam o código de violação (`23P01`) e devolvem 409 ao cliente. Corrigi `docs/product/FEATURES.md` (tabela de módulos e seção de Booking) pra não repetir mais o alerta de contradição.

### 1.7 — Terminar a auditoria técnica ampla (segurança, código, performance, testes)

- **Estado:** `EM ANDAMENTO`
- **Prioridade:** P1
- **O que estou fazendo:** Comecei uma auditoria de CTO mais ampla, cobrindo autenticação, RBAC, RLS completo, storage, Stripe, Google, dependências, qualidade de código, performance e cobertura de testes, em paralelo a esse trabalho de documentação, e ainda não terminei todos os módulos.
- **Como vou saber que terminei:** Auditoria concluída, achados com evidência incorporados nesse roadmap (não antes — não quero antecipar conclusão de um trabalho que eu ainda não terminei).

---

## FASE 2 — Produto Portugal

Portugal é o único mercado onde eu tenho uso real hoje (4 escritórios pilotos) e continua sendo minha prioridade de estabilidade de produto. Itens específicos de produto (não arquitetura) eu guardo em `docs/product/` e adiciono aqui conforme eu for decidindo — não quero listar aqui funcionalidade que eu ainda nem desenhei, pra não inventar prioridade que não existe.

- **Regra que eu sigo nessa fase:** nenhuma mudança que eu fizer nas Fases 3-5 (arquitetura multi-país, Brasil) pode alterar o comportamento que um escritório português vê hoje. Ver Fase 3 pros testes de regressão que eu preciso rodar.

### Frente de evolução de produto/segurança (iniciada 20/08/2026)

Abri uma frente própria, maior que um item avulso desta fase, cobrindo tarefas multi-cliente, hierarquia de serviços, agenda em calendário mensal, MFA, step-up authentication e a base comercial futura (pricing/add-ons/SMS). Fiz a auditoria completa antes de implementar qualquer coisa — o detalhe item a item, com classificação e decisões arquiteturais, fica em [`docs/decisions/AUDITORIA_FASE0_EVOLUCAO_2026-08-20.md`](./decisions/AUDITORIA_FASE0_EVOLUCAO_2026-08-20.md), pra eu não duplicar aqui o que já documentei lá. Este ROADMAP.md continua sendo minha única fonte de prioridade geral — só não repito o detalhe fase-a-fase dessa frente específica nos dois lugares.

- **Fase 1 (tarefas manuais — múltiplos clientes e edição completa): `CONCLUÍDO`.** Tarefa agora pode ter vários clientes (M2M via `client_task_client_links`, ver [ADR-0008](./decisions/ADR-0008-tarefas-multi-cliente-m2m.md)), com backfill das tarefas existentes e `client_id` mantida como ponteiro legado. Edição completa (título, descrição, prioridade, prazo, responsável, clientes) implementada em `Dialog` centralizado (`TaskEditDialog.tsx`), reaproveitando o padrão de `FiscalEventFormDialog.tsx` — antes só o Estado era editável. 525 testes de backend + 165 de frontend passando, typecheck e build limpos. Migration aplicada em staging e produção por mim. Detalhe completo no relatório de fase (fica registrado na minha conversa com o Claude Code, não duplico aqui).
- **Fase 2 (serviços — grupos de 1 nível, imagem reposicionável, Página Pública com accordion): `CONCLUÍDO` em staging.** Grupos reais substituem o texto livre `public_group` (`accounting_service_groups`, ver [ADR-0009](./decisions/ADR-0009-servicos-grupos-e-posicionamento-imagem.md)) — nome único por escritório, ordenação, ativo/inativo, visível/oculto na Página Pública. Banner de serviço passou de recorte assado nos pixels (`ImageCropDialog.tsx`) para posicionamento reversível (ponto focal + zoom em CSS, `ImagePositionEditor.tsx` + `servicePositionedImageStyle.ts`) — a imagem original fica guardada, o enquadramento pode mudar sem reenviar o arquivo. Página Pública agora agrupa serviços por grupo real dentro de um accordion (`ui/accordion.tsx`, novo — primeiro uso de `@radix-ui/react-accordion` no projeto) em vez do cabeçalho estático de texto que a auditoria da Fase 0 encontrou. 525 testes de backend + 165 de frontend passando, typecheck limpo. Migrations aplicadas em staging e produção por mim. Serviços com imagem enviada antes desta fase não têm reposicionamento disponível (limitação conhecida, comunicada na UI) — precisam de reenvio da imagem para ganhar a funcionalidade.
- **Fases 3-7 dessa frente:** não iniciadas — aguardando eu revisar e aprovar a Fase 2 antes de seguir, como combinei.

---

## FASE 3 — Arquitetura multi-país

Pré-requisito técnico antes de eu ter qualquer escritório brasileiro real. Nenhum desses itens exige eu reescrever schema, RLS ou a arquitetura de isolamento — são todos pontos de "fiação": ligar uma configuração que eu já tenho (`country-config.registry.js`, já cadastrado com Portugal e Brasil) a lugares que hoje ainda leem um valor fixo.

### 3.1 — Ligar a moeda ao país do escritório

- **Estado:** `PLANEJADO`
- **Prioridade:** P0
- **O que eu preciso fazer:** `backend/src/config/pricing-plans.js` tem `CURRENCY = 'EUR'` fixo, e eu repito o mesmo padrão (`DEFAULT 'EUR'`) em `service_requests`, `services`, `consultations` e `firm_payments` — nenhum ligado a `firm.country_code`. Já tenho um branch pronto (não configurado) lendo `STRIPE_PRICE_ID_BRL` em `resolveSubscriptionPriceId` — ou seja, hoje, se eu configurasse esse preço, um escritório brasileiro veria o preço em euros mas seria cobrado em reais.
- **Como vou saber que terminei:** Moeda exibida = moeda cobrada, pra qualquer país, com teste automatizado. `STRIPE_PRICE_ID_BRL` configurado no Stripe e no ambiente.

### 3.2 — Dar ao escritório um fuso horário próprio, reconhecido no sistema inteiro

- **Estado:** `PLANEJADO`
- **Prioridade:** P0
- **O que eu preciso fazer:** Eu não tenho uma coluna `timezone` na tabela `firms`. O único fuso horário que eu salvo por escritório vive dentro de `settings.booking` (JSON), restrito a uma lista fixa de quatro valores (`Europe/Lisbon`, `Europe/Madrid`, `Atlantic/Azores`, `UTC`) que não inclui nenhum fuso brasileiro — se alguém tenta configurar um fuso fora dessa lista, eu reescrevo silenciosamente pra Lisboa, sem erro nenhum.
- **Como vou saber que terminei:** Coluna `firms.timezone` existe; obrigações, automações e agendamento lendo dessa mesma fonte; lista de fusos aceitos incluindo pelo menos os principais fusos brasileiros; nenhuma reescrita silenciosa.
- **Do que depende:** Item 0.3 (corrigir o cálculo de "hoje").

### 3.3 — Corrigir a exibição de horário fixada em Lisboa na agenda do escritório

- **Estado:** `PLANEJADO`
- **Prioridade:** P1
- **O que eu preciso fazer:** `AgendaWorkspace.tsx` força a conversão de horário pra `Europe/Lisbon` ao exibir o detalhe de um evento, independente do fuso real que estiver configurado.
- **Do que depende:** Item 3.2.

### 3.4 — Criar seletor de país real no cadastro principal do escritório

- **Estado:** `PLANEJADO`
- **Prioridade:** P0
- **O que eu preciso fazer:** `FirmRegisterPage.tsx` tem `countryCode = 'PT'` fixo no código — hoje não existe forma de um escritório se cadastrar como Brasil pelo fluxo principal, mesmo o backend já aceitando esse parâmetro (e eu já ter um seletor funcional, mas isolado, no fluxo secundário de cadastro via Google).
- **Como vou saber que terminei:** Seletor de país no cadastro principal; teste de regressão garantindo que o comportamento padrão pra Portugal não muda.

### 3.5 — Construir formulário de endereço pro Brasil

- **Estado:** `PLANEJADO`
- **Prioridade:** P1
- **O que eu preciso fazer:** Meu formulário de endereço hoje é estruturado só pra Portugal (distrito, concelho, freguesia). A busca de CEP via ViaCEP pro Brasil **eu já implementei no backend** — falta só eu construir a interface.
- **Como vou saber que terminei:** Formulário bairro/UF/CEP funcionando, reaproveitando o backend que eu já tenho.

### 3.6 — Corrigir identidade fiscal e formas jurídicas pro Brasil

- **Estado:** `PLANEJADO`
- **Prioridade:** P1
- **O que eu preciso fazer:** O conjunto de regras de cadastro pro Brasil (`clientRegistrationConfig.ts`) já existe, mas hoje é uma cópia literal das regras de Portugal — exijo CAE (classificação portuguesa) em vez de CNAE, e ofereço formas jurídicas portuguesas (Lda., SA) em vez de brasileiras (LTDA, MEI, EIRELI, S.A.).
- **Como vou saber que terminei:** Regras brasileiras reais, com rótulo de identidade fiscal (`NIF` vs. `CNPJ`/`CPF`) dinâmico a partir da configuração de país que eu já tenho.

### 3.7 — Corrigir reconhecimento de números de telefone brasileiros no SMS

- **Estado:** `PLANEJADO`
- **Prioridade:** P2
- **O que eu preciso fazer:** Minha normalização de telefone pro SMS só reconhece automaticamente números portugueses; um número brasileiro digitado sem o `+` fica sem indicativo de país.

### 3.8 — Popular conteúdo real em português do Brasil

- **Estado:** `PLANEJADO`
- **Prioridade:** P2
- **O que eu preciso fazer:** A chave `pt-BR` do meu sistema de tradução hoje é um alias apontando pro mesmo conteúdo `pt-PT` — não existe tradução real ainda. Eu já tenho, no próprio código, uma função com diferenças reais entre português europeu e brasileiro implementadas, mas bloqueada por uma restrição de tipo que só aceita `pt-PT`.
- **Como vou saber que terminei:** Pelo menos os fluxos críticos (cadastro, portal do cliente, e-mails transacionais) com conteúdo `pt-BR` real, não um alias.

### 3.9 — Formalizar as decisões arquiteturais que eu já tomei (ADRs)

- **Estado:** `PRÓXIMO`
- **Prioridade:** P2
- **O que eu preciso fazer:** Documentar como ADR as decisões que eu já tomei implicitamente no código (isolamento por `firm_id`, país como propriedade do tenant, tipo de obrigação `CUSTOM` como minha estratégia de entrada em novo país, entre outras — ver `docs/decisions/`).
- **Como vou saber que terminei:** ADRs publicados (já fiz isso como parte dessa própria reestruturação de documentação).

---

## FASE 4 — Brasil MVP

O menor conjunto que eu preciso pra deixar um escritório brasileiro real operar com segurança — sem depender de eu ter automação fiscal brasileira completa.

| Item | Depende de | Prioridade | Estado |
|---|---|---|---|
| Seletor de país real no cadastro | 3.4 | P0 | PLANEJADO |
| Correção do cálculo de "hoje" (fuso do escritório) | 0.3, 3.2 | P0 | PLANEJADO |
| Moeda BRL correta ponta-a-ponta | 3.1 | P0 | PLANEJADO |
| Formulário de endereço brasileiro | 3.5 | P1 | PLANEJADO |
| CNPJ/CPF como identidade fiscal, com rótulo dinâmico | 3.6 | P1 | PLANEJADO |
| Formas jurídicas brasileiras reais | 3.6 | P1 | PLANEJADO |
| Obrigações via tipo `CUSTOM` | — | — | **Já funciona hoje, sem eu precisar fazer nada** |
| SMS com prefixo `+55` correto | 3.7 | P2 | PLANEJADO |
| Conteúdo pt-BR nos fluxos críticos | 3.8 | P2 | PLANEJADO |
| Validação jurídica mínima (consentimento aplicável ao Brasil) | — | P0 | `A VALIDAR` — preciso de aconselhamento jurídico, fora do que eu resolvo sozinho no código |

**O que eu preciso lembrar:** o tipo de obrigação `CUSTOM` já é totalmente funcional hoje e é literalmente o caminho que eu já deixei o próprio sistema anunciar (`fiscal-calendar.service.js` devolve uma mensagem explicando isso) pra operar sem calendário fiscal automático. Isso significa que meu Brasil MVP não precisa esperar nenhuma automação fiscal brasileira — só precisa dos itens P0/P1 acima.

## FASE 5 — Brasil produção

- Validação jurídica LGPD completa (representante legal no Brasil se for exigido, consentimento, direito ao apagamento de dados — hoje meu sistema só arquiva/soft-delete, não apaga de verdade, o que é a mesma lacuna que eu tenho pro GDPR).
- Primeiro escritório brasileiro real validado em staging antes de eu ir pra produção.
- `STRIPE_PRICE_ID_BRL` configurado e testado em ambiente de teste antes de produção.
- Nenhum teste de regressão de Portugal falhando (ver Fase 3).

## FASE 6 — Escala

### Meu caminho de escala: 4 → 100.000 escritórios

Essa seção existe pra eu responder com honestidade uma pergunta que qualquer investidor técnico ou comprador em due diligence vai me fazer: *"isso aguenta crescer?"* Minha resposta curta é: a arquitetura de isolamento (por `firm_id`) não me impede de escalar — mas hoje eu não tenho evidência de que já testei o sistema além de 4 escritórios reais, e na minha auditoria de requisições eu já encontrei pontos concretos que vão doer antes dos outros.

| Estágio | O que eu tenho hoje | O que eu preciso comprovar | Gargalo que eu espero | Solução provável | Evidência que eu preciso |
|---|---|---|---|---|---|
| **4 escritórios (atual)** | Em produção real | — | Nenhum que eu tenha observado até agora | — | — |
| **~50 escritórios** | Minha arquitetura suporta sem mudança | Comportamento do polling central com múltiplos escritórios simultâneos | `live/events` sem cache, chamado por todo usuário a cada 120s (item 1.4); `operational-dashboard` escrevendo no banco a cada poll (item 1.3) | Corrigir 1.3 e 1.4 antes de eu chegar aqui | Teste de carga simulando N escritórios com M usuários cada, medindo consultas ao banco por segundo |
| **~500 escritórios** | Não comprovado | Meus índices atuais (`firm_id`) continuam suficientes; conexões de banco não esgotam | Volume de consultas duplicadas do frontend (lista de clientes pedida em 9 lugares sem cache — item 1.2) começa a pesar em banda e em carga do backend | Consolidar as duplicações da Fase 1; avaliar connection pooling se eu ainda não tiver | Métrica de queries/segundo por escritório ativo, antes e depois das correções da Fase 1 |
| **~5.000 escritórios** | Não comprovado | Cache (Redis já está na minha stack) sendo usada de forma consistente, não só pontual | Consultas de agregação sem cache (dashboard sem TTL, contagens recalculadas) ficam caras em volume | Expandir o padrão de cache que eu já uso em `firm-dashboard.repository.js` (TTL de 45s) pros outros endpoints de agregação | Latência p95 dos endpoints de dashboard/badges sob carga simulada |
| **~50.000 escritórios** | Não comprovado | Meu bucket único de storage e banco único ainda comportam o volume; jobs em `setInterval` dentro do processo (não fila real) ainda são suficientes | Meus agendadores hoje rodam como `setInterval` no próprio processo Node — não tenho fila (a fila Redis que eu já tenho nunca foi usada em produção). Isso não escala horizontalmente sem coordenação | Avaliar fila real (já tenho a infraestrutura Redis) ou coordenação entre instâncias antes desse estágio | Teste com múltiplas instâncias do backend rodando simultaneamente, confirmando que os agendadores não duplicam trabalho |
| **~100.000 escritórios e mais** | Não comprovado, não é minha prioridade agora | Estratégia de particionamento ou multi-região, se precisar; arquitetura de billing/Stripe sob esse volume | Não tenho evidência suficiente pra prever com precisão — seria especulação da minha parte. Fica como item de pesquisa quando eu tiver resolvido e medido os estágios anteriores | A definir com base em métricas reais dos estágios anteriores | — |

**Regra que eu sigo aqui:** nenhuma célula dessa tabela é uma promessa de capacidade. É meu plano de trabalho e de medição. Eu não testei nenhum desses números — são hipóteses de engenharia baseadas na minha arquitetura atual e nos gargalos que eu já confirmei em código, não em testes de carga reais (que eu ainda não tenho — ver observabilidade e testes, abaixo).

### Observabilidade

- **Onde eu estou hoje:** Tenho o Sentry configurado pra rastrear erros (`A VALIDAR` — ainda não confirmei se a separação entre staging e produção está correta). Até onde eu auditei, não tenho métricas de performance (p50/p95/p99), tracing distribuído, nem alertas automáticos de degradação.
- **Prioridade:** P1, antes de eu expandir tráfego de forma significativa.
- **Como vou saber que terminei:** Métricas de latência por endpoint, taxa de erro, e utilização de banco visíveis num painel; alertas configurados pros endpoints mais críticos que eu já identifiquei (`live/events`, `operational-dashboard`).

### Testes de carga, stress e endurance

- **Onde eu estou hoje:** `PLANEJADO` — eu ainda não fiz nenhum teste de carga.
- **Prioridade:** P2, vira P1 antes de qualquer captação de investimento que dependa de eu mostrar capacidade de escala.

---

## FASE 7 — Expansão futura

- Calendário fiscal automático completo pro Brasil (ICMS, ISS, PIS/COFINS, IRPJ, CSLL, Simples Nacional) — hoje eu resolvo isso de forma manual via obrigações `CUSTOM`.
- Catálogo de acessos oficiais brasileiros (Receita Federal, eSocial, Simples Nacional) — hoje meu catálogo é 100% português (AT, Segurança Social, ViaCTT, IAPMEI) e não tem equivalente brasileiro.
- Tradução completa da interface pro português do Brasil (a Fase 4 cobre só os fluxos críticos).
- Meios de pagamento locais brasileiros (PIX), se fizer sentido além do que o Stripe já me oferece.
- Terceiro país — minha arquitetura de configuração por país já foi desenhada pra suportar isso (`country-config.registry.js` é um registro extensível), mas eu ainda não avaliei nenhum terceiro país.
- Exportação e apagamento efetivo de dados pessoais (GDPR e LGPD) como capacidade self-service — hoje eu não tenho isso, é a mesma lacuna nos dois regimes.

---

## Minha preparação organizacional pra crescer a equipe

Hoje o projeto depende muito do que só eu sei. Pra isso deixar de ser verdade:

- Essa reestruturação de documentação (ver `docs/README.md`) é meu primeiro passo — um novo engenheiro precisa conseguir entender arquitetura, segurança e as minhas decisões sem precisar me perguntar antes de ler.
- Minha política de documentação viva (`docs/governance/DOCUMENTATION_POLICY.md`): toda mudança arquitetural relevante gera ou atualiza um ADR; toda mudança de prioridade atualiza esse roadmap, nunca uma lista paralela.
- **Estado:** `EM ANDAMENTO` — esse documento e a reestruturação que vem junto são a minha primeira entrega concreta desse esforço.

---

## O que eu deixei de fora desse roadmap de propósito

Pra eu não inventar prioridade onde não existe base: métricas de negócio (MRR, ARR, número de clientes pagantes), certificações de compliance, e capacidade de carga comprovada não aparecem como itens "concluídos" em lugar nenhum desse documento porque eu não tenho evidência hoje que sustente essas afirmações. Quando eu tiver, entram aqui — não antes.
