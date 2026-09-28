-- Exclusões por regra de recorrência (mês específico sem apagar a série)

ALTER TABLE public.task_month_exclusions
  ADD COLUMN IF NOT EXISTS task_recurring_rule_id UUID REFERENCES public.task_recurring_rules(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS obligation_recurrence_rule_id UUID REFERENCES public.obligation_recurrence_rules(id) ON DELETE CASCADE;

ALTER TABLE public.task_month_exclusions
  DROP CONSTRAINT IF EXISTS task_month_exclusions_target_chk;

ALTER TABLE public.task_month_exclusions
  ADD CONSTRAINT task_month_exclusions_target_chk CHECK (
    (
      obligation_id IS NOT NULL
      AND task_id IS NULL
      AND task_recurring_rule_id IS NULL
      AND obligation_recurrence_rule_id IS NULL
    )
    OR (
      task_id IS NOT NULL
      AND obligation_id IS NULL
      AND task_recurring_rule_id IS NULL
      AND obligation_recurrence_rule_id IS NULL
    )
    OR (
      task_recurring_rule_id IS NOT NULL
      AND obligation_id IS NULL
      AND task_id IS NULL
      AND obligation_recurrence_rule_id IS NULL
    )
    OR (
      obligation_recurrence_rule_id IS NOT NULL
      AND obligation_id IS NULL
      AND task_id IS NULL
      AND task_recurring_rule_id IS NULL
    )
  );

CREATE UNIQUE INDEX IF NOT EXISTS idx_task_month_exclusions_task_rule
  ON public.task_month_exclusions (firm_id, client_id, month, task_recurring_rule_id)
  WHERE task_recurring_rule_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_task_month_exclusions_ob_rule
  ON public.task_month_exclusions (firm_id, client_id, month, obligation_recurrence_rule_id)
  WHERE obligation_recurrence_rule_id IS NOT NULL;
