-- Eventos de segurança (login falhado antes de identificar tenant)
ALTER TABLE public.audit_logs
  ALTER COLUMN firm_id DROP NOT NULL;

CREATE INDEX IF NOT EXISTS idx_audit_logs_action_created
  ON public.audit_logs (action, created_at DESC);
