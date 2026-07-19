-- Corrige a check constraint de client_tasks.task_type, que nunca permitiu
-- o valor 'internal_task' em produção, apesar da migration
-- 20260522100000_architecture_debt_fix.sql pretender isso.
--
-- Causa raiz: a coluna `task_type` (e a sua constraint original, com apenas
-- 'recurring_obligation' e 'manual_task') já existia na base de dados antes
-- da migration 20260522100000 ser escrita. Essa migration usa
-- `ADD COLUMN IF NOT EXISTS task_type ... CHECK (...)`; como a coluna já
-- existia, o Postgres ignora silenciosamente TODA a cláusula (incluindo o
-- CHECK), pelo que a constraint em produção ficou permanentemente presa aos
-- 2 valores antigos, mesmo com a migration marcada como "aplicada".
--
-- Impacto: toda a criação de "Tarefa Manual" no workspace do escritório
-- (POST /api/contabil/client-tasks -> tasks-workspace.service.js#createTask)
-- insere com task_type = 'internal_task' e falha com 500
-- ("violates check constraint client_tasks_task_type_check"), porque
-- 'internal_task' nunca esteve na lista de valores permitidos.

ALTER TABLE public.client_tasks
  DROP CONSTRAINT IF EXISTS client_tasks_task_type_check;

ALTER TABLE public.client_tasks
  ADD CONSTRAINT client_tasks_task_type_check
  CHECK (task_type IN ('recurring_obligation', 'manual_task', 'internal_task'));
