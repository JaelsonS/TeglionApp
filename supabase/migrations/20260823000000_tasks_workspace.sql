-- Sprint 3 — Workspace operacional: tarefas profissionais + notificações escritório
--
-- IMPORTANTE: remover a constraint ANTES de migrar valores (OPEN→TODO falha na constraint antiga).

ALTER TABLE public.client_tasks DROP CONSTRAINT IF EXISTS client_tasks_status_check;

UPDATE public.client_tasks SET status = 'TODO' WHERE status = 'OPEN';
UPDATE public.client_tasks SET status = 'WAITING_CLIENT' WHERE status = 'SUBMITTED';
UPDATE public.client_tasks SET status = 'DONE' WHERE status = 'APPROVED';
UPDATE public.client_tasks SET status = 'ARCHIVED' WHERE status = 'CANCELLED';
-- IN_PROGRESS mantém-se igual

ALTER TABLE public.client_tasks
  ADD CONSTRAINT client_tasks_status_check CHECK (status IN (
    'BACKLOG', 'TODO', 'IN_PROGRESS', 'WAITING_CLIENT', 'REVIEW', 'DONE', 'ARCHIVED'
  ));

ALTER TABLE public.client_tasks
  ADD COLUMN IF NOT EXISTS priority TEXT NOT NULL DEFAULT 'NORMAL'
    CHECK (priority IN ('LOW', 'NORMAL', 'HIGH', 'URGENT')),
  ADD COLUMN IF NOT EXISTS assignee_id UUID REFERENCES public.firm_users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS tags TEXT[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS depends_on_task_id UUID REFERENCES public.client_tasks(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS recurrence_rule JSONB,
  ADD COLUMN IF NOT EXISTS help_requested_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS duplicated_from_id UUID REFERENCES public.client_tasks(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_client_tasks_assignee ON public.client_tasks (firm_id, assignee_id);
CREATE INDEX IF NOT EXISTS idx_client_tasks_priority ON public.client_tasks (firm_id, priority, due_date);
CREATE INDEX IF NOT EXISTS idx_client_tasks_status_due ON public.client_tasks (firm_id, status, due_date);

-- Comentários em tarefas
CREATE TABLE IF NOT EXISTS public.task_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  firm_id UUID NOT NULL REFERENCES public.firms(id) ON DELETE CASCADE,
  client_task_id UUID NOT NULL REFERENCES public.client_tasks(id) ON DELETE CASCADE,
  author_role TEXT NOT NULL CHECK (author_role IN ('FIRM', 'CLIENT')),
  author_id UUID NOT NULL,
  author_name TEXT,
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_task_comments_task ON public.task_comments (client_task_id, created_at);

-- Notificações do escritório (staff)
CREATE TABLE IF NOT EXISTS public.firm_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  firm_id UUID NOT NULL REFERENCES public.firms(id) ON DELETE CASCADE,
  firm_user_id UUID REFERENCES public.firm_users(id) ON DELETE CASCADE,
  category TEXT NOT NULL DEFAULT 'SYSTEM'
    CHECK (category IN ('TASK', 'MESSAGE', 'ALERT', 'DOCUMENT', 'DEADLINE', 'SYSTEM')),
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT,
  entity_type TEXT,
  entity_id UUID,
  action_url TEXT,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_firm_notifications_user ON public.firm_notifications (firm_id, firm_user_id, read_at, created_at DESC);

ALTER TABLE public.task_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.firm_notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS task_comments_staff ON public.task_comments;
CREATE POLICY task_comments_staff ON public.task_comments FOR ALL
  USING (firm_id = public.current_firm_id() AND public.is_firm_staff());

DROP POLICY IF EXISTS task_comments_client ON public.task_comments;
CREATE POLICY task_comments_client ON public.task_comments FOR SELECT
  USING (public.is_client_user());

DROP POLICY IF EXISTS task_comments_client_insert ON public.task_comments;
CREATE POLICY task_comments_client_insert ON public.task_comments FOR INSERT
  WITH CHECK (public.is_client_user() AND author_role = 'CLIENT');

DROP POLICY IF EXISTS firm_notifications_staff ON public.firm_notifications;
CREATE POLICY firm_notifications_staff ON public.firm_notifications FOR ALL
  USING (firm_id = public.current_firm_id() AND public.is_firm_staff());

-- Estrutura para automações operacionais (Sprint 4+)
CREATE TABLE IF NOT EXISTS public.task_automation_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  firm_id UUID NOT NULL REFERENCES public.firms(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  trigger_type TEXT NOT NULL CHECK (trigger_type IN (
    'OBLIGATION_DUE', 'TASK_OVERDUE', 'CLIENT_INACTIVE', 'RECURRENCE', 'SLA_BREACH'
  )),
  action_type TEXT NOT NULL CHECK (action_type IN (
    'CREATE_TASK', 'SEND_REMINDER', 'NOTIFY_STAFF', 'ESCALATE'
  )),
  config JSONB NOT NULL DEFAULT '{}',
  enabled BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.task_automation_rules ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS task_automation_rules_staff ON public.task_automation_rules;
CREATE POLICY task_automation_rules_staff ON public.task_automation_rules FOR ALL
  USING (firm_id = public.current_firm_id() AND public.is_firm_staff());
