-- Corrige client_tasks_status_check se a migração 20260823000000 falhou ao meio
-- (UPDATE para TODO com a constraint antiga ainda ativa).
-- Seguro para reexecutar.

ALTER TABLE public.client_tasks DROP CONSTRAINT IF EXISTS client_tasks_status_check;

UPDATE public.client_tasks SET status = 'TODO' WHERE status = 'OPEN';
UPDATE public.client_tasks SET status = 'WAITING_CLIENT' WHERE status = 'SUBMITTED';
UPDATE public.client_tasks SET status = 'DONE' WHERE status = 'APPROVED';
UPDATE public.client_tasks SET status = 'ARCHIVED' WHERE status = 'CANCELLED';

-- Valores fora do enum novo → TODO
UPDATE public.client_tasks
SET status = 'TODO'
WHERE status IS NULL
   OR status NOT IN (
     'BACKLOG', 'TODO', 'IN_PROGRESS', 'WAITING_CLIENT', 'REVIEW', 'DONE', 'ARCHIVED'
   );

ALTER TABLE public.client_tasks
  ADD CONSTRAINT client_tasks_status_check CHECK (status IN (
    'BACKLOG', 'TODO', 'IN_PROGRESS', 'WAITING_CLIENT', 'REVIEW', 'DONE', 'ARCHIVED'
  ));
