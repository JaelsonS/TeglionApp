-- Tarefas internas do escritório sem cliente da carteira.

ALTER TABLE public.client_tasks
  ALTER COLUMN client_id DROP NOT NULL;

ALTER TABLE public.client_tasks
  DROP CONSTRAINT IF EXISTS client_tasks_client_id_fkey;

ALTER TABLE public.client_tasks
  ADD CONSTRAINT client_tasks_client_id_fkey
  FOREIGN KEY (client_id) REFERENCES public.clients(id) ON DELETE SET NULL;

-- Rollback (documentação):
-- ALTER TABLE public.client_tasks DROP CONSTRAINT IF EXISTS client_tasks_client_id_fkey;
-- ALTER TABLE public.client_tasks ALTER COLUMN client_id SET NOT NULL;
-- ALTER TABLE public.client_tasks ADD CONSTRAINT client_tasks_client_id_fkey
--   FOREIGN KEY (client_id) REFERENCES public.clients(id) ON DELETE CASCADE;
