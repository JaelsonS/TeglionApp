-- Correção de dívida técnica: separação messages / document_requests / tasks / documents

-- 1) Conversas (1 por par escritório-cliente)
CREATE TABLE IF NOT EXISTS public.conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  firm_id UUID NOT NULL REFERENCES public.firms(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (firm_id, client_id)
);

CREATE INDEX IF NOT EXISTS idx_conversations_firm_client ON public.conversations (firm_id, client_id);

-- 2) Pedidos de documento (fonte única de pedidos)
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

-- 3) Regras de tarefas recorrentes (templates mensais — nunca reset)
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

-- 4) Instâncias mensais de tarefas (snapshot — nunca reutilizar mês anterior)
ALTER TABLE public.client_tasks
  ADD COLUMN IF NOT EXISTS task_type TEXT NOT NULL DEFAULT 'manual_task'
    CHECK (task_type IN ('recurring_obligation', 'manual_task', 'internal_task')),
  ADD COLUMN IF NOT EXISTS period_month TEXT,
  ADD COLUMN IF NOT EXISTS recurring_rule_id UUID REFERENCES public.task_recurring_rules(id) ON DELETE SET NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_client_tasks_recurring_snapshot
  ON public.client_tasks (firm_id, client_id, recurring_rule_id, period_month)
  WHERE recurring_rule_id IS NOT NULL AND period_month IS NOT NULL;

-- 5) Conversas + limpeza de messages (remover workflow embutido)
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

UPDATE public.messages SET is_read = true WHERE read_at IS NOT NULL;

ALTER TABLE public.messages
  ALTER COLUMN conversation_id SET NOT NULL;

-- Migrar pedidos que estavam em messages (dívida da passagem anterior), se existir coluna kind
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'messages' AND column_name = 'kind'
  ) THEN
    INSERT INTO public.document_requests (
      firm_id, client_id, conversation_id, message_id, obligation_id,
      instructions, status, seen_at, document_id, created_at
    )
    SELECT
      m.firm_id, m.client_id, m.conversation_id, m.id, m.obligation_id, m.body,
      CASE
        WHEN m.request_status = 'COMPLETED' THEN 'completed'
        WHEN m.request_status = 'RESPONDED' THEN 'answered'
        WHEN m.request_status = 'SEEN' THEN 'seen'
        ELSE 'pending'
      END,
      m.client_viewed_at, m.document_id, m.created_at
    FROM public.messages m
    WHERE m.kind = 'DOCUMENT_REQUEST'
      AND m.conversation_id IS NOT NULL
      AND NOT EXISTS (SELECT 1 FROM public.document_requests dr WHERE dr.message_id = m.id);
  END IF;
END $$;

-- Remover colunas de workflow em messages
ALTER TABLE public.messages DROP COLUMN IF EXISTS kind;
ALTER TABLE public.messages DROP COLUMN IF EXISTS request_status;
ALTER TABLE public.messages DROP COLUMN IF EXISTS client_task_id;
ALTER TABLE public.messages DROP COLUMN IF EXISTS client_viewed_at;

DROP INDEX IF EXISTS idx_messages_document_requests;

ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_recurring_rules ENABLE ROW LEVEL SECURITY;

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
