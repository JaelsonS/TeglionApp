# ADR-0008 — Tarefas manuais ↔ clientes: relação muitos-para-muitos, `client_id` como ponteiro legado

## Status

Aceito. Decisão em vigor — implementada em 20/08/2026, como Fase 1 da evolução aprovada a partir da auditoria de 20/08/2026 (`docs/decisions/AUDITORIA_FASE0_EVOLUCAO_2026-08-20.md`).

## Contexto

Uma tarefa manual (`client_tasks`) sempre teve `client_id` como FK singular para `clients` — obrigatória até a migration `20261005000000_client_tasks_optional_client.sql` (13/10/2026), que a tornou `NULLABLE` com `ON DELETE SET NULL` para permitir tarefa sem cliente (tarefa interna do escritório). Isso já cobria "zero ou um cliente", mas não "vários clientes na mesma tarefa" — um pedido real (ex.: "Solicitar documentos para IRS" endereçado a quatro clientes ao mesmo tempo).

## Problema

Como modelar "uma tarefa pode ter vários clientes" sem: (a) forçar duplicação da mesma tarefa uma vez por cliente, (b) quebrar as ~9 consultas existentes que hoje leem `client_tasks.client_id` diretamente (listagem do workspace, ficha do cliente, métricas, duplicação de tarefa, criação via scheduler/automação), e (c) inventar um padrão de dado que o resto do projeto não usa.

## Decisão

Criei `client_task_client_links` como tabela de junção M2M entre `client_tasks` e `clients`, seguindo exatamente o padrão que o projeto já usa para outras relações N:N — `firm_entity_tag_links` (`client_tag_links`, `lead_tag_links`, `firm_user_tag_links`, migration `20260930000000_firm_entity_tag_links.sql`): PK composta `(client_task_id, client_id)`, `firm_id` redundante na própria linha (para a política de RLS não depender de um `JOIN`), política `client_task_client_links_firm_staff` idêntica em forma às políticas `*_tag_links_firm_staff`.

`client_tasks.client_id` não foi removida. Passa a ser um **ponteiro legado**: sempre sincronizada, em toda escrita, para o primeiro cliente do conjunto M2M (ou `NULL` se a tarefa ficar sem cliente). A tabela `client_task_client_links` é a fonte de verdade — toda leitura nova (listagem filtrada por cliente, ficha do cliente, detalhe da tarefa) consulta ela, não a coluna legada.

Fiz backfill na própria migration (`INSERT ... SELECT id, client_id, firm_id FROM client_tasks WHERE client_id IS NOT NULL ON CONFLICT DO NOTHING`, idempotente) — toda tarefa existente antes desta mudança ganhou o vínculo M2M equivalente ao seu `client_id` de então.

## Alternativas consideradas

- **Array de UUID em `client_tasks.client_ids` (`UUID[]`)**, do jeito que `firm_broadcasts.target_client_ids` já faz para destinatários de difusão. Descartei porque essa relação já precisa de metadado próprio no meu roadmap (quem removeu o vínculo, quando — auditoria por vínculo individual), e uma coluna array não dá RLS por linha nem índice reverso eficiente ("quais tarefas este cliente tem" vira scan, não index lookup). O padrão M2M já é o dominante no projeto para esse tipo de relação; escolhi ficar consistente com ele.
- **Manter só `client_id` singular e simular "vários clientes" duplicando a tarefa por cliente.** Descartei porque duplica dado (o pedido original é explícito: "evite duplicar dados desnecessariamente") e quebra a intenção real — é uma tarefa, um estado, um histórico, endereçado a vários clientes, não N tarefas independentes que por acaso têm o mesmo título.
- **Remover `client_id` imediatamente, substituindo por M2M em todo lugar de uma vez.** Descartei por risco desnecessário nesta fase: há caminhos de escrita antigos (scheduler de recorrência interna, `automation.service.js`) que constroem a linha de `client_tasks` diretamente com `client_id`, sem passar pelo service novo. Manter a coluna, sincronizada automaticamente dentro do próprio `insertTask`/`setTaskClients`, evita ter que tocar nesses chamadores nesta fase.

## Motivos da decisão

- Consistência com o padrão M2M que já uso no projeto (`*_tag_links`) — quem já conhece esse padrão entende esta tabela sem esforço extra.
- RLS por linha desde o primeiro dia, no mesmo nível de proteção que as outras relações M2M já têm.
- Sincronização automática do ponteiro legado dentro do próprio repositório (`insertTask`/`setTaskClients`) significa que os chamadores antigos que ainda inserem `client_id` direto continuam funcionando sem saber que a tabela nova existe.
- Backfill idempotente na própria migration — não preciso rodar um script separado nem coordenar isso manualmente em produção.

## Consequências positivas

- Uma tarefa com vários clientes aparece corretamente na ficha de cada um deles (implementei isso em `listClientTasks`, que hoje resolve os IDs de tarefa via `client_task_client_links` antes de filtrar `client_tasks`, não mais via `.eq('client_id', clientId)` direto).
- Filtro por cliente no workspace geral (`listTasks({clientId})`) também passou a usar a M2M como fonte — um cliente que só está vinculado como "segundo cliente" de uma tarefa aparece no filtro, o que não acontecia antes.
- Nenhum dado histórico foi perdido ou precisou de intervenção manual — o backfill cobre 100% das tarefas com `client_id` preenchido antes desta migration.

## Consequências negativas

- `client_tasks.getMetrics()` (contagem "tarefas por cliente" no dashboard) continua agrupando só pelo `client_id` legado (o primeiro cliente do conjunto) — uma tarefa com 3 clientes conta só para 1 deles nessa métrica específica. Deixei assim de propósito nesta fase (é uma métrica de dashboard, não uma listagem operacional) — registro aqui como dívida conhecida, não escondida.
- Toda leitura de tarefa agora faz uma segunda consulta (a `client_task_client_links`) para montar `clientIds` — troquei uma leitura por duas em `listTasks`/`findTaskById`. Para o volume atual (poucas centenas de tarefas por escritório) isso não é um problema real; viraria um se o volume crescesse muito antes de eu considerar um `JOIN` nativo via PostgREST embedding.
- Recorrência de tarefa (`task_recurring_rules`) continua presa a um cliente só — bloqueei explicitamente a combinação "recorrência + mais de um cliente" no backend (`RECURRENCE_REQUIRES_SINGLE_CLIENT`), em vez de tentar resolver ambiguidade nenhuma regra de negócio real definiu ainda.

## Riscos

- Se algum caminho de escrita que eu não migrei (fora dos que revisei: `tasks-workspace.service.js`, `internal-recurring.scheduler.js`, `automation.service.js`) inserir direto em `client_tasks` sem passar por `tasksRepo.insertTask`, essa tarefa nasce sem vínculo M2M — o ponteiro legado `client_id` continua correto, mas ela não aparece nas consultas que já migrei para M2M-first (ficha do cliente, filtro do workspace). Não encontrei nenhum caminho assim na auditoria que fiz antes de implementar, mas é o tipo de risco que só uma nova busca completa por `.from('client_tasks').insert(` descobriria com certeza.
- `setTaskClients` faz delete-then-insert sem transação multi-statement (limitação do cliente PostgREST que já é aceita em outros pontos do projeto) — uma falha exatamente entre o delete e o insert deixaria a tarefa temporariamente sem nenhum cliente vinculado. Na prática, o delete e o insert acontecem em sequência síncrona dentro da mesma requisição HTTP, então a janela de risco é mínima, mas não é atomicidade real de banco.

## Estratégia de depreciação de `client_id`

Não removo `client_tasks.client_id` nesta fase. Meu plano, para quando eu decidir seguir com a remoção:

1. Confirmar que nenhum consumidor (frontend, backend, relatório, exportação) lê `client_id` diretamente — hoje ainda leio (como ponteiro legado) em `getMetrics()` e como valor de exibição de fallback no frontend (`WorkspaceTask.clientId`, marcado como `@deprecated` no tipo TypeScript desde esta mudança).
2. Migrar `getMetrics()` para agregar por `client_task_client_links` (resolve a consequência negativa registrada acima).
3. Só depois disso, considerar uma migration que remove a coluna — nunca antes de ter certeza de que nada mais depende dela, e nunca sem uma janela de observação em produção primeiro.

## Impacto futuro

- Qualquer nova tela ou relatório que precise saber "os clientes desta tarefa" deve consultar `client_task_client_links` (via `tasksRepo.listClientLinksForTaskIds`/`listTaskIdsForClient`), nunca `client_tasks.client_id` diretamente — esse já é o padrão que uso a partir de agora.
- Se eu decidir generalizar esse padrão para outras entidades que hoje têm relação 1:N forçada com cliente (não identifiquei nenhuma outra nesta auditoria), esta ADR e a tabela `client_task_client_links` servem de modelo direto a replicar.

## Relação com outros ADRs

- Segue o princípio de isolamento por `firm_id` do ADR-0001 — `client_task_client_links.firm_id` é redundante de propósito, na mesma lógica já usada em `firm_entity_tag_links`, para a política RLS não depender de `JOIN`.
