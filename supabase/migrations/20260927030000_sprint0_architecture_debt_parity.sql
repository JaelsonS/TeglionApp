-- Sprint 0: paridade de schema staging ↔ produção para as tabelas das
-- migrations de maio (20260522*) que o baseline de staging não reaplicou.
-- Idempotente: em produção (já presentes) é no-op seguro (IF NOT EXISTS).

-- 1) Conversas
CREATE TABLE IF NOT EXISTS public.conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  firm_id UUID NOT NULL REFERENCES public.firms(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (firm_id, client_id)
);

CREATE INDEX IF NOT EXISTS idx_conversations_firm_client
  ON public.conversations (firm_id, client_id);

-- 2) Pedidos de documento
CREATE TABLE IF NOT EXISTS public.document_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  firm_id UUID NOT NULL REFERENCES public.firms(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  message_id UUID REFERENCES public.messages(id) ON DELETE SET NULL,
  obligation_id UUID REFERENCES public.obligations(id) ON DELETE SET NULL,
  period_month TEXT,
  title TEXT,
  instructions TEXT,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'seen', 'answered', 'completed')),
  seen_at TIMESTAMPTZ,
  answered_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  document_id UUID REFERENCES public.documents(id) ON DELETE SET NULL,
  created_by UUID REFERENCES public.firm_users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_document_requests_firm_client
  ON public.document_requests (firm_id, client_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_document_requests_conversation
  ON public.document_requests (conversation_id, created_at DESC);

-- 3) Regras de tarefas recorrentes
CREATE TABLE IF NOT EXISTS public.task_recurring_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  firm_id UUID NOT NULL REFERENCES public.firms(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  obligation_type TEXT,
  recurrence_frequency TEXT NOT NULL DEFAULT 'MONTHLY'
    CHECK (recurrence_frequency IN ('MONTHLY', 'QUARTERLY', 'SEMIANNUAL', 'ANNUAL')),
  due_day_of_month INT CHECK (due_day_of_month IS NULL OR (due_day_of_month >= 1 AND due_day_of_month <= 28)),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_task_recurring_rules_firm
  ON public.task_recurring_rules (firm_id, client_id) WHERE is_active = true;

-- 4) Colunas client_tasks (snapshot recorrente)
ALTER TABLE public.client_tasks
  ADD COLUMN IF NOT EXISTS task_type TEXT NOT NULL DEFAULT 'manual_task';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'client_tasks_task_type_check'
      AND conrelid = 'public.client_tasks'::regclass
  ) THEN
    ALTER TABLE public.client_tasks
      ADD CONSTRAINT client_tasks_task_type_check
      CHECK (task_type IN ('recurring_obligation', 'manual_task', 'internal_task'));
  END IF;
EXCEPTION WHEN duplicate_object THEN
  NULL;
END $$;

ALTER TABLE public.client_tasks
  ADD COLUMN IF NOT EXISTS period_month TEXT;

ALTER TABLE public.client_tasks
  ADD COLUMN IF NOT EXISTS recurring_rule_id UUID REFERENCES public.task_recurring_rules(id) ON DELETE SET NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_client_tasks_recurring_snapshot
  ON public.client_tasks (firm_id, client_id, recurring_rule_id, period_month)
  WHERE recurring_rule_id IS NOT NULL AND period_month IS NOT NULL;

-- 5) messages ↔ conversations
INSERT INTO public.conversations (firm_id, client_id)
SELECT DISTINCT m.firm_id, m.client_id
FROM public.messages m
WHERE NOT EXISTS (
  SELECT 1 FROM public.conversations c
  WHERE c.firm_id = m.firm_id AND c.client_id = m.client_id
);

ALTER TABLE public.messages
  ADD COLUMN IF NOT EXISTS conversation_id UUID REFERENCES public.conversations(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS is_read BOOLEAN NOT NULL DEFAULT false;

UPDATE public.messages m
SET conversation_id = c.id
FROM public.conversations c
WHERE c.firm_id = m.firm_id AND c.client_id = m.client_id
  AND m.conversation_id IS NULL;

UPDATE public.messages SET is_read = true WHERE read_at IS NOT NULL AND is_read = false;

-- Só forçar NOT NULL se todas as linhas tiverem conversation_id
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'messages' AND column_name = 'conversation_id'
  ) AND NOT EXISTS (
    SELECT 1 FROM public.messages WHERE conversation_id IS NULL
  ) THEN
    ALTER TABLE public.messages ALTER COLUMN conversation_id SET NOT NULL;
  END IF;
END $$;

-- 6) Exclusões mensais
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

-- 7) RLS (equivalente a produção)
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_recurring_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_month_exclusions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS conversations_staff ON public.conversations;
CREATE POLICY conversations_staff ON public.conversations FOR ALL
  USING (firm_id = public.current_firm_id() AND public.is_firm_staff());

DROP POLICY IF EXISTS conversations_client ON public.conversations;
CREATE POLICY conversations_client ON public.conversations FOR SELECT
  USING (public.is_client_user());

DROP POLICY IF EXISTS document_requests_staff ON public.document_requests;
CREATE POLICY document_requests_staff ON public.document_requests FOR ALL
  USING (firm_id = public.current_firm_id() AND public.is_firm_staff());

DROP POLICY IF EXISTS document_requests_client ON public.document_requests;
CREATE POLICY document_requests_client ON public.document_requests FOR SELECT
  USING (public.is_client_user());

DROP POLICY IF EXISTS document_requests_client_update ON public.document_requests;
CREATE POLICY document_requests_client_update ON public.document_requests FOR UPDATE
  USING (public.is_client_user());

DROP POLICY IF EXISTS task_recurring_rules_staff ON public.task_recurring_rules;
CREATE POLICY task_recurring_rules_staff ON public.task_recurring_rules FOR ALL
  USING (firm_id = public.current_firm_id() AND public.is_firm_staff());

DROP POLICY IF EXISTS task_month_exclusions_firm_staff ON public.task_month_exclusions;
CREATE POLICY task_month_exclusions_firm_staff ON public.task_month_exclusions FOR ALL
  USING (firm_id = public.current_firm_id() AND public.is_firm_staff());
