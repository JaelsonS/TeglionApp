# Roadmap do Teglion

**Este é o único roadmap oficial do Teglion.** Se você encontrar qualquer outro documento com uma lista de tarefas, sprints ou "próximos passos" que não seja este arquivo, esse outro documento está desatualizado — reporte ou corrija. Nenhuma outra lista de prioridades no repositório tem autoridade sobre esta.

Última atualização: 18 de agosto de 2026, com base em três auditorias técnicas completas realizadas nesta data (multi-tenancy e segurança, requisições HTTP/polling, e preparação para expansão internacional). Onde uma afirmação vem de uma dessas auditorias, isso está indicado. Onde uma área ainda não foi auditada com profundidade suficiente para termos certeza, isso também está indicado — este documento não finge saber o que não sabe.

---

## Como usar este documento

Cada item tem: **objetivo**, **motivo**, **prioridade** (P0 a P3), **dependências**, **estado**, **critério de conclusão** e, quando aplicável, **evidência**.

Estados possíveis:

- `CONCLUÍDO` — feito, com evidência verificável (teste, código lido diretamente, log de execução real).
- `EM ANDAMENTO` — há trabalho ativo, ainda não fechado.
- `PRÓXIMO` — é a prioridade imediata depois do que está em andamento.
- `PLANEJADO` — está no roadmap, mas ainda não começou.
- `BLOQUEADO` — não pode avançar até outra coisa acontecer (técnica, jurídica ou de decisão).
- `A VALIDAR` — pode já estar pronto, mas não foi comprovado o suficiente para marcar como concluído.

Prioridades:

- **P0** — risco ativo hoje (segurança, integridade de dados, ou algo que já está quebrado para o usuário). Não espera a próxima sprint.
- **P1** — importante, deve entrar no próximo ciclo de trabalho.
- **P2** — relevante, mas pode esperar sem risco imediato.
- **P3** — otimização ou preparação para um estágio futuro que ainda não chegou.

Regra de honestidade: um item só vira `CONCLUÍDO` quando existe evidência — código lido, teste rodando, log real. Código parcialmente implementado é `EM ANDAMENTO`, não `CONCLUÍDO`.

---

## Visão de longo prazo

O Teglion existe para tirar o contador de dentro do WhatsApp e da planilha e dar ao escritório de contabilidade um lugar único onde cliente, documento, obrigação e cobrança se encontram. Nasceu em Portugal, foi criado por um fundador brasileiro, e a tese de expansão sempre foi natural: se funciona para um escritório português, o mesmo problema existe — com regras fiscais diferentes — no Brasil, e depois em qualquer mercado onde contabilidade ainda vive espalhada entre apps genéricos.

A visão de dez anos é uma plataforma que um escritório de qualquer tamanho, em qualquer país de língua portuguesa (e depois além disso), possa adotar com confiança de que os dados do cliente A nunca vazam para o escritório B, que o sistema não cai quando a equipe cresce de 4 para 40 pessoas, e que a Teglion continua evoluindo sem depender de uma única pessoa saber onde cada coisa está guardada.

Isso não é uma promessa de que já chegamos lá. É a régua contra a qual cada decisão de arquitetura deste roadmap é medida.

## Estado atual (agosto de 2026)

- **4 escritórios pilotos** usando o sistema em produção/staging.
- Monólito modular: backend Node/Express, frontend React/Vite, Postgres via Supabase (Auth + Storage + RLS), Stripe para cobrança, integração com Google Calendar/Drive, e-mail transacional via Brevo.
- Isolamento multi-tenant por `firm_id`, aplicado de forma consistente nos repositórios de dados, com RLS como camada adicional de defesa (não a fronteira primária — o backend acessa via `service_role`, que ignora RLS; a fronteira real é o filtro explícito em cada consulta).
- Documentação recentemente reconstruída (12/08/2026) com disciplina real de "implementado vs. parcial vs. não existe" — mas com um roadmap historicamente fragmentado em onze arquivos contando duas histórias diferentes, o que este documento resolve.
- Uma auditoria de segurança e multi-tenancy mais ampla está em andamento (iniciada em paralelo a este trabalho de documentação) e ainda não terminou todos os seus módulos — os achados que já têm evidência concreta estão listados na Fase 0; o restante será incorporado a este roadmap assim que concluído, não antes.

---

## FASE 0 — Segurança e fundação

Prioridade absoluta. Nada do resto importa se a base não é sólida.

### 0.1 — Corrigir vazamento cross-tenant confirmado no rastreamento de visualizações

- **Estado:** `PRÓXIMO`
- **Prioridade:** P0
- **Objetivo:** Fechar uma falha real e confirmada por leitura de código: os endpoints `POST /api/me/contabil/documents/:id/view` e `.../obligations/:id/view` leem `view_count` e `lastViewedAt` filtrando só por `id`, sem `firm_id`, em `backend/src/services/tracking/view-tracking.service.js`. Um usuário com papel CLIENT de qualquer escritório que descubra o UUID de um documento ou obrigação de outro escritório consegue ler essa metadata.
- **Motivo:** É a única falha de isolamento entre tenants confirmada por evidência direta até agora. A escrita (UPDATE) já está corretamente filtrada por `firm_id` — só as duas leituras que compõem a resposta não estão.
- **Dependências:** Nenhuma.
- **Critério de conclusão:** As duas leituras em `view-tracking.service.js` passam a filtrar também por `firm_id`; teste automatizado cobrindo o cenário (cliente do escritório A tenta ler contador de visualização de documento do escritório B, espera 403/404).
- **Evidência:** Auditoria de multi-tenancy, 18/08/2026 (achado F1, verificado por leitura direta de `view-tracking.service.js` e `tracking.controller.js`).

### 0.2 — SEC-H1 (escalação de staff a FIRM_OWNER) — CONFIRMADO CORRIGIDO

- **Estado:** `CONCLUÍDO`
- **Prioridade:** P0 (era) — item fechado.
- **Objetivo original:** `docs/historico/FASE-1-PRODUCT-AUDIT.md` (13/08/2026) registrou um achado de que um usuário com papel STAFF e permissão `USERS_UPDATE` poderia se promover a `FIRM_OWNER` via `PATCH /team/:id`.
- **Resolução:** Confirmado por leitura direta de código em 19/08/2026 (durante a reestruturação de documentação): `backend/src/modules/firm/team.service.js` tem uma guarda dedicada (`assertActorCanAssignRole`, com comentário citando "SEC-H1" explicitamente), e existem 8 testes automatizados cobrindo o cenário em `team.service.test.js`, todos passando no CI. Correção aplicada no commit `f1c3121` (13/08/2026) — o mesmo dia do fechamento do Sprint 0, só que nenhum documento narrativo tinha registrado essa correção especificamente até agora.
- **Evidência:** `docs/security/AUTHORIZATION.md`, seção sobre SEC-H1; commit `f1c3121`; `backend/src/modules/firm/team.service.test.js`.
- **Lição:** este é mais um exemplo do padrão descrito na Fase 1 — uma correção real que aconteceu, mas cuja documentação não foi atualizada para refletir isso. A diferença é que, desta vez, encontramos e corrigimos o registro no mesmo ciclo de trabalho.

### 0.3 — Corrigir cálculo de "hoje" em obrigações (usa UTC fixo, não o fuso do escritório)

- **Estado:** `PRÓXIMO`
- **Prioridade:** P0
- **Objetivo:** `syncOverdueObligations` (`backend/src/db/supabase/repositories/contabil/obligations.repository.js`) e `automation.service.js` calculam "hoje" com `new Date().toISOString().slice(0, 10)` — sempre UTC. Isso já introduz um pequeno erro para Portugal em horário de verão, e um erro estrutural maior para qualquer fuso distante de Lisboa.
- **Motivo:** É um bug de correção de dados, não uma preferência estética — obrigações podem ser marcadas como atrasadas antes da hora certa. Bloqueia diretamente a Fase 4 (Brasil).
- **Dependências:** Nenhuma para a correção em si; é pré-requisito para 4.1.
- **Critério de conclusão:** "Hoje" passa a ser calculado a partir de um fuso horário associado ao escritório (ver 3.2); teste automatizado com datas no limite do dia civil em pelo menos dois fusos.
- **Evidência:** Auditoria de preparação multi-país, 18/08/2026.

### 0.4 — Manter o gate de segurança automatizado no CI

- **Estado:** `CONCLUÍDO`
- **Prioridade:** P0 (manutenção contínua)
- **Objetivo:** O teste de isolamento entre tenants roda automaticamente no CI e falha o pipeline (fail-closed) se os segredos de staging estiverem ausentes.
- **Evidência:** Confirmado por leitura direta de `.github/workflows/ci.yml` (linhas 57-72) durante a auditoria de documentação, 18/08/2026. Isso corrige uma afirmação desatualizada que ainda existe em `docs/04-ARQUITETURA/MULTI-TENANCY.md` e `docs/06-SEGURANCA/MULTI-TENANT-SECURITY.md` (ambos de 12/08, nunca atualizados depois de o gate entrar em produção em 13/08) — ver Fase 1.

### 0.5 — Rotação de segredos de produção

- **Estado:** `CONCLUÍDO` *(segundo `docs/historico/SPRINT-0.md`, item concluído em 13/08/2026 — não foi reverificado de forma independente nesta rodada de auditoria)*
- **Prioridade:** P0 (manutenção contínua)
- **Evidência:** `SPRINT-0.md`. Recomenda-se uma verificação independente periódica (não só confiar no registro), especialmente antes de qualquer expansão de equipe.

### 0.6 — Teste de restauração de backup

- **Estado:** `CONCLUÍDO` *(dois drills reais registrados em 13/08/2026, com RTO observado, em `docs/database/BACKUPS.md`, migrado de `docs/operations/BACKUP_RESTORE.md`)*
- **Prioridade:** P0 (repetir periodicamente, não é um evento único)
- **Próximo passo:** Definir uma cadência de repetição do drill (trimestral é uma referência razoável para o estágio atual) — hoje não há essa cadência definida. Ver item 0.7.

### 0.7 — Definir RPO/RTO formalmente e uma cadência de teste de disaster recovery

- **Estado:** `PLANEJADO`
- **Prioridade:** P1
- **Objetivo:** Os dois drills de 13/08 já dão um RTO observado na prática, mas não existe um RPO/RTO formalmente definido como meta (o que é diferente de "o que aconteceu na única vez que testamos").
- **Critério de conclusão:** Documento formal com RPO/RTO-alvo, cadência de teste definida (sugestão: trimestral), e o próximo drill agendado.

---

## FASE 1 — Estabilidade

### 1.1 — Corrigir os documentos com informação desatualizada do Sprint 0

- **Estado:** `PRÓXIMO`
- **Prioridade:** P1
- **Objetivo:** Nove documentos (datados 12/08) ainda descrevem riscos do Sprint 0 como abertos, quando o próprio `SPRINT-0.md` os marcou como concluídos em 13/08 e nunca foram atualizados depois. Isso já foi corrigido nesta rodada de reestruturação de documentação (ver relatório final), mas fica registrado aqui como item de manutenção: sempre que uma sprint ou marco fechar, os documentos narrativos que mencionam esse risco precisam ser atualizados no mesmo commit — não depois.
- **Critério de conclusão:** Política de documentação (ver `docs/governance/DOCUMENTATION_POLICY.md`) sendo seguida na prática, sem novos casos como este.

### 1.2 — Corrigir requisições duplicadas confirmadas no frontend

- **Estado:** `PRÓXIMO`
- **Prioridade:** P1
- **Objetivo:** A auditoria de requisições HTTP (18/08/2026) confirmou, com evidência de código, duplicações reais — não hipotéticas:
  - `ClientObligationsPage` e o `ClientObligationsView` que ela renderiza fazem duas chamadas independentes a `listObligations()`, cada uma com seu próprio `refetchInterval` de 60 segundos.
  - O Dashboard do cliente busca `unreadMessages` num endpoint separado, quando esse dado já vem na resposta do hub que a mesma página já buscou.
  - `listDocumentRequests()` é chamado de forma independente em pelo menos quatro lugares do portal do cliente, sem cache compartilhada.
  - `FirmTasksWorkspacePage` busca a lista de clientes do escritório duas vezes no mesmo carregamento.
  - A lista de clientes do escritório (`contabilClientsApi.list`) é buscada de forma independente em pelo menos nove lugares do frontend, cada um com um limite diferente, sem nenhum compartilhar cache.
- **Motivo:** Não é sobre reduzir número de requisições por vaidade — é sobre eliminar trabalho repetido que cresce proporcionalmente ao número de usuários simultâneos, e cujo custo real (banco de dados, latência) aumenta com escala.
- **Critério de conclusão:** Cada duplicação confirmada tem uma única fonte de dados; teste de regressão garantindo que a página continua funcionando com o mesmo comportamento visível ao usuário.
- **Evidência:** Auditoria de requisições HTTP/polling, 18/08/2026 (relatório completo entregue nesta conversa).

### 1.3 — Corrigir escrita não-debounced a cada poll no calendário operacional de obrigações

- **Estado:** `PRÓXIMO`
- **Prioridade:** P1 (torna-se P0 conforme o número de escritórios simultâneos cresce)
- **Objetivo:** O endpoint `obligations/operational-dashboard` executa um `UPDATE` no banco a cada chamada de leitura (a cada 90 segundos, por aba ativa). O padrão correto já existe no próprio código — o endpoint `firm/dashboard` faz exatamente a mesma operação, mas protegida por um debounce de 5 minutos via cache.
- **Critério de conclusão:** `operational-dashboard` usa o mesmo padrão de debounce já implementado em `firm-dashboard.repository.js`.
- **Evidência:** Auditoria de requisições HTTP/polling, 18/08/2026.

### 1.4 — Adicionar cache ao endpoint mais chamado do sistema (`live/events`)

- **Estado:** `PLANEJADO`
- **Prioridade:** P1
- **Objetivo:** `live/events` é chamado por todos os usuários autenticados a cada ~120 segundos e está explicitamente isento do rate-limit global por ser tratado como "seguro para poll frequente" — mas não tem nenhuma cache, e duas de suas cinco consultas recalculam contadores do zero que outros endpoints dedicados já calculam.
- **Critério de conclusão:** Cache curta (15-30s) aplicada; contadores reaproveitados dos endpoints dedicados em vez de recalculados.
- **Evidência:** Auditoria de requisições HTTP/polling, 18/08/2026.

### 1.5 — Debounce em buscas de texto que disparam requisição a cada tecla

- **Estado:** `PLANEJADO`
- **Prioridade:** P2
- **Objetivo:** O campo de busca do Calendário Fiscal do escritório e o feed de Alertas do portal do cliente disparam uma nova requisição de rede a cada tecla digitada, sem debounce — no caso do Calendário Fiscal, buscando o ano inteiro de eventos a cada tecla.
- **Critério de conclusão:** Debounce de ~300-500ms aplicado nos dois pontos.

### 1.6 — Verificar a contradição entre `BOOKING.md` e o Sprint 0 sobre a race condition de agendamento

- **Estado:** `PRÓXIMO`
- **Prioridade:** P1
- **Objetivo:** `docs/product/BOOKING.md` descreve uma race condition de agendamento duplo como ainda não corrigida; `SPRINT-0.md` marca esse mesmo item como resolvido (constraint aplicada em staging e produção). Um dos dois está errado — precisa verificação direta no código antes de corrigir a documentação.
- **Critério de conclusão:** Verificado em código (existência real da constraint de banco), documento corrigido para refletir a realidade.

### 1.7 — Concluir a auditoria técnica ampla (segurança, código, performance, testes)

- **Estado:** `EM ANDAMENTO`
- **Prioridade:** P1
- **Objetivo:** Uma auditoria de CTO mais ampla, cobrindo autenticação, RBAC, RLS completo, storage, Stripe, Google, dependências, qualidade de código, performance e cobertura de testes, foi iniciada em paralelo a este trabalho de documentação e ainda não terminou todos os seus módulos.
- **Critério de conclusão:** Auditoria concluída, achados com evidência incorporados a este roadmap (não antes — este roadmap não antecipa conclusões de um trabalho que ainda não terminou).

---

## FASE 2 — Produto Portugal

Portugal é o único mercado com uso real hoje (4 escritórios pilotos) e continua sendo a prioridade de estabilidade do produto. Itens específicos de produto (não arquitetura) pertencem aos documentos em `docs/product/` e devem ser adicionados aqui conforme forem decididos — este roadmap não lista funcionalidades de produto específicas que ainda não foram desenhadas, para não inventar prioridade onde ela ainda não existe.

- **Regra fixa desta fase:** nenhuma mudança feita nas Fases 3-5 (arquitetura multi-país, Brasil) pode alterar o comportamento hoje visível para um escritório português. Ver Fase 3 para os testes de regressão obrigatórios.

---

## FASE 3 — Arquitetura multi-país

Pré-requisito técnico antes de qualquer escritório brasileiro real. Nenhum destes itens exige reescrever schema, RLS ou a arquitetura de isolamento — são todos pontos de "fiação": ligar uma configuração que já existe (`country-config.registry.js`, já cadastrado com Portugal e Brasil) a lugares que hoje leem um valor fixo.

### 3.1 — Ligar moeda ao país do escritório

- **Estado:** `PLANEJADO`
- **Prioridade:** P0
- **Objetivo:** `backend/src/config/pricing-plans.js` tem `CURRENCY = 'EUR'` fixo, e o mesmo padrão (`DEFAULT 'EUR'`) se repete em `service_requests`, `services`, `consultations` e `firm_payments` — nenhum ligado a `firm.country_code`. Existe um branch já pronto (não configurado) lendo `STRIPE_PRICE_ID_BRL` em `resolveSubscriptionPriceId` — ou seja, hoje, se esse preço fosse configurado, um escritório brasileiro veria o preço em euros mas seria cobrado em reais.
- **Critério de conclusão:** Moeda exibida = moeda cobrada, para qualquer país, com teste automatizado. `STRIPE_PRICE_ID_BRL` configurado no Stripe e no ambiente.

### 3.2 — Dar ao escritório um fuso horário próprio, reconhecido em todo o sistema

- **Estado:** `PLANEJADO`
- **Prioridade:** P0
- **Objetivo:** Não existe uma coluna `timezone` na tabela `firms`. O único fuso horário salvo por escritório vive dentro de `settings.booking` (JSON), restrito a uma lista fixa de quatro valores (`Europe/Lisbon`, `Europe/Madrid`, `Atlantic/Azores`, `UTC`) que não inclui nenhum fuso brasileiro — uma tentativa de configurar um fuso fora dessa lista é reescrita silenciosamente para Lisboa, sem erro.
- **Critério de conclusão:** Coluna `firms.timezone` existe; obrigações, automações e agendamento leem dessa mesma fonte; lista de fusos aceitos inclui pelo menos os principais fusos brasileiros; nenhuma reescrita silenciosa.
- **Dependência:** 0.3 (corrigir o cálculo de "hoje").

### 3.3 — Corrigir a exibição de horário fixado em Lisboa na agenda do escritório

- **Estado:** `PLANEJADO`
- **Prioridade:** P1
- **Objetivo:** `AgendaWorkspace.tsx` força a conversão de horário para `Europe/Lisbon` ao exibir o detalhe de um evento, independente do fuso real configurado.
- **Dependência:** 3.2.

### 3.4 — Criar seletor de país real no cadastro principal do escritório

- **Estado:** `PLANEJADO`
- **Prioridade:** P0
- **Objetivo:** `FirmRegisterPage.tsx` tem `countryCode = 'PT'` fixo no código — não existe forma de um escritório se cadastrar como Brasil pelo fluxo principal, apesar do backend já aceitar esse parâmetro (e já existir um seletor funcional, mas isolado, no fluxo secundário de cadastro via Google).
- **Critério de conclusão:** Seletor de país no cadastro principal; teste de regressão garantindo que o comportamento padrão para Portugal não muda.

### 3.5 — Construir formulário de endereço para o Brasil

- **Estado:** `PLANEJADO`
- **Prioridade:** P1
- **Objetivo:** O formulário de endereço atual é estruturado só para Portugal (distrito, concelho, freguesia). A busca de CEP via ViaCEP para o Brasil **já está implementada no backend** — falta só a interface.
- **Critério de conclusão:** Formulário bairro/UF/CEP funcional, reaproveitando o backend existente.

### 3.6 — Corrigir identidade fiscal e formas jurídicas para o Brasil

- **Estado:** `PLANEJADO`
- **Prioridade:** P1
- **Objetivo:** O conjunto de regras de cadastro para Brasil (`clientRegistrationConfig.ts`) existe, mas hoje é uma cópia literal das regras de Portugal — exige CAE (classificação portuguesa) em vez de CNAE, e oferece formas jurídicas portuguesas (Lda., SA) em vez de brasileiras (LTDA, MEI, EIRELI, S.A.).
- **Critério de conclusão:** Regras brasileiras reais, com rótulo de identidade fiscal (`NIF` vs. `CNPJ`/`CPF`) dinâmico a partir da configuração de país já existente.

### 3.7 — Corrigir reconhecimento de números de telefone brasileiros no SMS

- **Estado:** `PLANEJADO`
- **Prioridade:** P2
- **Objetivo:** A normalização de telefone para SMS só reconhece automaticamente números portugueses; um número brasileiro digitado sem o `+` fica sem indicativo de país.

### 3.8 — Popular conteúdo real em português do Brasil

- **Estado:** `PLANEJADO`
- **Prioridade:** P2
- **Objetivo:** A chave `pt-BR` do sistema de tradução hoje é um alias apontando para o mesmo conteúdo `pt-PT` — não existe tradução real. Já existe, no próprio código, uma função com diferenças reais entre português europeu e brasileiro implementadas, mas bloqueada por uma restrição de tipo que só aceita `pt-PT`.
- **Critério de conclusão:** Pelo menos os fluxos críticos (cadastro, portal do cliente, e-mails transacionais) com conteúdo `pt-BR` real, não um alias.

### 3.9 — Formalizar as decisões arquiteturais já tomadas (ADRs)

- **Estado:** `PRÓXIMO`
- **Prioridade:** P2
- **Objetivo:** Documentar como ADR as decisões que já existem implicitamente no código (isolamento por `firm_id`, país como propriedade do tenant, tipo de obrigação `CUSTOM` como estratégia de entrada em novo país, entre outras — ver `docs/decisions/`).
- **Critério de conclusão:** ADRs publicados (parte desta própria reestruturação de documentação).

---

## FASE 4 — Brasil MVP

O menor conjunto que permite um escritório brasileiro real operar com segurança — sem depender de automação fiscal brasileira completa.

| Item | Depende de | Prioridade | Estado |
|---|---|---|---|
| Seletor de país real no cadastro | 3.4 | P0 | PLANEJADO |
| Correção do cálculo de "hoje" (fuso do escritório) | 0.3, 3.2 | P0 | PLANEJADO |
| Moeda BRL correta ponta-a-ponta | 3.1 | P0 | PLANEJADO |
| Formulário de endereço brasileiro | 3.5 | P1 | PLANEJADO |
| CNPJ/CPF como identidade fiscal, com rótulo dinâmico | 3.6 | P1 | PLANEJADO |
| Formas jurídicas brasileiras reais | 3.6 | P1 | PLANEJADO |
| Obrigações via tipo `CUSTOM` | — | — | **Já funciona hoje, sem trabalho adicional** |
| SMS com prefixo `+55` correto | 3.7 | P2 | PLANEJADO |
| Conteúdo pt-BR nos fluxos críticos | 3.8 | P2 | PLANEJADO |
| Validação jurídica mínima (consentimento aplicável ao Brasil) | — | P0 | `A VALIDAR` — depende de aconselhamento jurídico, fora do escopo técnico |

**Importante:** o tipo de obrigação `CUSTOM` já é totalmente funcional hoje e é literalmente o caminho que o próprio sistema já anuncia (`fiscal-calendar.service.js` devolve uma mensagem explicando isso) para operar sem calendário fiscal automático. Isso significa que o Brasil MVP não precisa esperar por nenhuma automação fiscal brasileira — precisa só dos itens P0/P1 acima.

## FASE 5 — Brasil produção

- Validação jurídica LGPD completa (representante legal no Brasil se exigido, consentimento, direito ao apagamento de dados — hoje o sistema só tem arquivamento/soft-delete, não apagamento efetivo, o que é uma lacuna igual para GDPR).
- Primeiro escritório brasileiro real validado em staging antes de produção.
- `STRIPE_PRICE_ID_BRL` configurado e testado em ambiente de teste antes de produção.
- Nenhum teste de regressão de Portugal falhando (ver Fase 3).

## FASE 6 — Escala

### Caminho de escala: 4 → 100.000 escritórios

Esta seção existe para responder com honestidade a uma pergunta que qualquer investidor técnico ou comprador em due diligence vai fazer: *"isso aguenta crescer?"* A resposta curta é: a arquitetura de isolamento (por `firm_id`) não impede escalar — mas hoje não existe evidência de que o sistema já foi testado além de 4 escritórios reais, e a auditoria de requisições já encontrou pontos concretos que vão doer antes dos outros.

| Estágio | O que temos hoje | O que precisa ser comprovado | Gargalo esperado | Solução provável | Evidência necessária |
|---|---|---|---|---|---|
| **4 escritórios (atual)** | Em produção real | — | Nenhum observado até agora | — | — |
| **~50 escritórios** | Arquitetura suporta sem mudança | Comportamento do polling central com múltiplos escritórios simultâneos | `live/events` sem cache, chamado por todo usuário a cada 120s (item 1.4); `operational-dashboard` escrevendo no banco a cada poll (item 1.3) | Corrigir 1.3 e 1.4 antes de chegar aqui | Teste de carga simulando N escritórios com M usuários cada, medindo consultas ao banco por segundo |
| **~500 escritórios** | Não comprovado | Índices existentes (`firm_id`) continuam suficientes; conexões de banco não esgotam | Volume de consultas duplicadas do frontend (lista de clientes pedida em 9 lugares sem cache — item 1.2) começa a pesar em banda e em carga do backend | Consolidar as duplicações da Fase 1; avaliar connection pooling se ainda não houver | Métrica de queries/segundo por escritório ativo, antes e depois das correções da Fase 1 |
| **~5.000 escritórios** | Não comprovado | Cache (Redis já existe na stack) sendo usada de forma consistente, não só pontual | Consultas de agregação sem cache (dashboard sem TTL, contagens recalculadas) tornam-se caras em volume | Expandir o padrão de cache já usado em `firm-dashboard.repository.js` (TTL de 45s) para os outros endpoints de agregação | Latência p95 dos endpoints de dashboard/badges sob carga simulada |
| **~50.000 escritórios** | Não comprovado | Bucket único de storage e banco único ainda comportam o volume; jobs em `setInterval` dentro do processo (não fila real) ainda são suficientes | Os agendadores hoje rodam como `setInterval` no próprio processo Node — não há fila (a fila Redis existente nunca foi usada em produção). Isso não escala horizontalmente sem coordenação | Avaliar fila real (a infraestrutura Redis já existe) ou coordenação entre instâncias antes deste estágio | Teste com múltiplas instâncias do backend rodando simultaneamente, confirmando que os agendadores não duplicam trabalho |
| **~100.000 escritórios e mais** | Não comprovado, não é a prioridade atual | Estratégia de particionamento ou multi-região, se necessário; arquitetura de billing/Stripe sob esse volume | Não temos evidência suficiente para prever com precisão — seria especulação. Fica como item de pesquisa quando os estágios anteriores estiverem resolvidos e medidos | A definir com base em métricas reais dos estágios anteriores | — |

**Regra explícita:** nenhuma célula desta tabela é uma promessa de capacidade. É um plano de trabalho e de medição. Nenhum destes números foi testado — eles são hipóteses de engenharia baseadas na arquitetura atual e nos gargalos já confirmados em código, não em testes de carga reais (que ainda não existem — ver Fase 6, observabilidade e testes).

### Observabilidade

- **Estado hoje:** Sentry configurado para rastreamento de erros (`A VALIDAR` — separação entre staging e produção não foi confirmada nesta rodada). Não existe, até onde foi auditado, métricas de performance (p50/p95/p99), tracing distribuído, ou alertas automáticos de degradação.
- **Prioridade:** P1, antes de qualquer expansão de tráfego significativa.
- **Critério de conclusão:** Métricas de latência por endpoint, taxa de erro, e utilização de banco visíveis num painel; alertas configurados para os endpoints mais críticos identificados nesta auditoria (`live/events`, `operational-dashboard`).

### Testes de carga, stress e endurance

- **Estado hoje:** `PLANEJADO` — não existe evidência de testes de carga realizados.
- **Prioridade:** P2, torna-se P1 antes de qualquer captação de investimento que dependa de mostrar capacidade de escala.

---

## FASE 7 — Expansão futura

- Calendário fiscal automático completo para o Brasil (ICMS, ISS, PIS/COFINS, IRPJ, CSLL, Simples Nacional) — hoje resolvido de forma manual via obrigações `CUSTOM`.
- Catálogo de acessos oficiais brasileiros (Receita Federal, eSocial, Simples Nacional) — hoje o catálogo existente é 100% português (AT, Segurança Social, ViaCTT, IAPMEI) e não tem equivalente brasileiro.
- Tradução completa da interface para português do Brasil (a Fase 4 cobre só os fluxos críticos).
- Meios de pagamento locais brasileiros (PIX), se fizer sentido além do que o Stripe já oferece.
- Terceiro país — a arquitetura de configuração por país já foi desenhada para suportar isso (`country-config.registry.js` é um registro extensível), mas nenhum terceiro país foi avaliado ainda.
- Exportação e apagamento efetivo de dados pessoais (GDPR e LGPD) como capacidade self-service — hoje não existe, é uma lacuna igual para os dois regimes.

---

## Preparação organizacional para crescimento da equipe

Hoje o projeto depende fortemente do conhecimento do fundador. Para isso deixar de ser verdade:

- Esta reestruturação de documentação (ver `docs/README.md`) é o primeiro passo — um novo engenheiro deve conseguir entender arquitetura, segurança e decisões sem perguntar antes de ler.
- Política de documentação viva (`docs/governance/DOCUMENTATION_POLICY.md`): toda mudança arquitetural relevante gera ou atualiza um ADR; toda mudança de prioridade atualiza este roadmap, nunca uma lista paralela.
- **Estado:** `EM ANDAMENTO` — este documento e a reestruturação que o acompanha são a primeira entrega concreta desse esforço.

---

## Itens explicitamente fora deste roadmap por falta de evidência

Para não inventar prioridade onde não existe base: métricas de negócio (MRR, ARR, número de clientes pagantes), certificações de compliance, e capacidade de carga comprovada não aparecem como itens "concluídos" em lugar nenhum deste documento porque não há evidência hoje que sustente essas afirmações. Quando existirem, entram aqui — não antes.
