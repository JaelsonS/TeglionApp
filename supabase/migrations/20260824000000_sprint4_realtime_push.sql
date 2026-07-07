-- Sprint 4 — Realtime (publication), anexos em mensagens, Web Push, automações ativas

-- Anexos em mensagens
ALTER TABLE public.messages
  ADD COLUMN IF NOT EXISTS attachment_storage_key TEXT,
  ADD COLUMN IF NOT EXISTS attachment_name TEXT,
  ADD COLUMN IF NOT EXISTS attachment_mime TEXT,
  ADD COLUMN IF NOT EXISTS attachment_size_bytes BIGINT;

-- Subscrições Web Push (PWA / FCM futuro)
CREATE TABLE IF NOT EXISTS public.push_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  firm_id UUID NOT NULL REFERENCES public.firms(id) ON DELETE CASCADE,
  user_role TEXT NOT NULL CHECK (user_role IN ('FIRM', 'CLIENT')),
  user_id UUID NOT NULL,
  endpoint TEXT NOT NULL,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (endpoint)
);

CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user ON public.push_subscriptions (firm_id, user_role, user_id);

ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS push_subscriptions_own ON public.push_subscriptions;
CREATE POLICY push_subscriptions_own ON public.push_subscriptions FOR ALL
  USING (
    firm_id = public.current_firm_id()
    AND (
      (user_role = 'FIRM' AND public.is_firm_staff())
      OR (user_role = 'CLIENT' AND public.is_client_user())
    )
  );

-- Realtime Supabase (mensagens + notificações)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'messages'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'firm_notifications'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.firm_notifications;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'in_app_notifications'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.in_app_notifications;
  END IF;
END $$;

-- Regras de automação default por escritório (idempotente)
INSERT INTO public.task_automation_rules (firm_id, name, trigger_type, action_type, config, enabled)
SELECT f.id, 'Lembrete obrigação a vencer (7 dias)', 'OBLIGATION_DUE', 'CREATE_TASK', '{"daysBefore": 7}'::jsonb, true
FROM public.firms f
WHERE NOT EXISTS (
  SELECT 1 FROM public.task_automation_rules r
  WHERE r.firm_id = f.id AND r.trigger_type = 'OBLIGATION_DUE' AND r.action_type = 'CREATE_TASK'
);

INSERT INTO public.task_automation_rules (firm_id, name, trigger_type, action_type, config, enabled)
SELECT f.id, 'Alerta tarefa em atraso', 'TASK_OVERDUE', 'NOTIFY_STAFF', '{"priority": "HIGH"}'::jsonb, true
FROM public.firms f
WHERE NOT EXISTS (
  SELECT 1 FROM public.task_automation_rules r
  WHERE r.firm_id = f.id AND r.trigger_type = 'TASK_OVERDUE' AND r.action_type = 'NOTIFY_STAFF'
);
