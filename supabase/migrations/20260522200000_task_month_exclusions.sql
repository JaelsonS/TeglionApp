-- Exclusões mensais de visibilidade (obrigações / tarefas) — persistência multi-dispositivo

CREATE TABLE IF NOT EXISTS public.task_month_exclusions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  firm_id UUID NOT NULL REFERENCES public.firms(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  obligation_id UUID REFERENCES public.obligations(id) ON DELETE CASCADE,
  task_id UUID REFERENCES public.client_tasks(id) ON DELETE CASCADE,
  month TEXT NOT NULL CHECK (month ~ '^\d{4}-\d{2}$'),
  excluded BOOLEAN NOT NULL DEFAULT true,
  created_by UUID REFERENCES public.firm_users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT task_month_exclusions_target_chk CHECK (
    (obligation_id IS NOT NULL AND task_id IS NULL)
    OR (task_id IS NOT NULL AND obligation_id IS NULL)
  )
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_task_month_exclusions_obligation
  ON public.task_month_exclusions (firm_id, client_id, month, obligation_id)
  WHERE obligation_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_task_month_exclusions_task
  ON public.task_month_exclusions (firm_id, client_id, month, task_id)
  WHERE task_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_task_month_exclusions_firm_month
  ON public.task_month_exclusions (firm_id, month)
  WHERE excluded = true;
