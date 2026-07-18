-- Corrige tarefas duplicadas ("Duplicar" no workspace) que desapareceram da listagem
-- de Tarefas Manuais.
--
-- Causa raiz: `duplicateTask` (backend/src/modules/tasks/tasks-workspace.service.js)
-- não propagava `task_type` da tarefa de origem para a cópia. A coluna `task_type`
-- tem DEFAULT 'manual_task', mas o frontend (FirmTasksWorkspacePage.tsx -> manualItems)
-- só mostra tarefas com task_type = 'internal_task'. Resultado: toda tarefa duplicada
-- a partir de uma tarefa manual ficava gravada com sucesso na base de dados, mas
-- invisível em Tarefas Manuais / Visão Geral / Calendário / Por Cliente.
--
-- Este backfill é seguro porque `duplicated_from_id` só é preenchido pelo fluxo de
-- duplicação (nenhum outro código escreve nesta coluna), logo conseguimos identificar
-- com certeza as linhas afectadas e reconciliar o task_type com o da tarefa de origem.

UPDATE public.client_tasks AS dup
SET
  task_type = src.task_type,
  period_month = COALESCE(dup.period_month, CASE WHEN dup.due_date IS NOT NULL THEN to_char(dup.due_date, 'YYYY-MM') ELSE NULL END)
FROM public.client_tasks AS src
WHERE dup.duplicated_from_id = src.id
  AND dup.task_type IS DISTINCT FROM src.task_type;
