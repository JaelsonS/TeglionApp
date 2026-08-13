-- Sprint 0 — defesa em profundidade nas 4 tabelas public sem RLS no staging.
-- O backend acede via service_role (bypassa RLS). Estas policies fecham o
-- PostgREST (anon/authenticated) e alinham com o padrão já usado em
-- stripe_connect_webhook_events / obligation_reminder_sends.

-- ---------------------------------------------------------------------------
-- Global / backend-only (sem firm_id): deny-all para roles de API.
-- Writers/readers reais: repositórios backend com getSupabaseAdmin().
-- ---------------------------------------------------------------------------

ALTER TABLE public.stripe_webhook_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS stripe_webhook_events_deny ON public.stripe_webhook_events;
CREATE POLICY stripe_webhook_events_deny ON public.stripe_webhook_events
  FOR ALL
  USING (false)
  WITH CHECK (false);

ALTER TABLE public.auth_login_attempts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS auth_login_attempts_deny ON public.auth_login_attempts;
CREATE POLICY auth_login_attempts_deny ON public.auth_login_attempts
  FOR ALL
  USING (false)
  WITH CHECK (false);

-- ---------------------------------------------------------------------------
-- Tenant-scoped: staff do firm via JWT claims (preparação; tráfego real
-- continua em service_role).
-- ---------------------------------------------------------------------------

ALTER TABLE public.obligation_templates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS obligation_templates_firm_staff ON public.obligation_templates;
CREATE POLICY obligation_templates_firm_staff ON public.obligation_templates
  FOR ALL
  USING (firm_id = public.current_firm_id() AND public.is_firm_staff())
  WITH CHECK (firm_id = public.current_firm_id() AND public.is_firm_staff());

ALTER TABLE public.obligation_recurrence_rules ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS obligation_recurrence_rules_firm_staff ON public.obligation_recurrence_rules;
CREATE POLICY obligation_recurrence_rules_firm_staff ON public.obligation_recurrence_rules
  FOR ALL
  USING (firm_id = public.current_firm_id() AND public.is_firm_staff())
  WITH CHECK (firm_id = public.current_firm_id() AND public.is_firm_staff());

-- Rollback (documentação):
-- DROP POLICY IF EXISTS obligation_recurrence_rules_firm_staff ON public.obligation_recurrence_rules;
-- DROP POLICY IF EXISTS obligation_templates_firm_staff ON public.obligation_templates;
-- DROP POLICY IF EXISTS auth_login_attempts_deny ON public.auth_login_attempts;
-- DROP POLICY IF EXISTS stripe_webhook_events_deny ON public.stripe_webhook_events;
-- ALTER TABLE public.obligation_recurrence_rules DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.obligation_templates DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.auth_login_attempts DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.stripe_webhook_events DISABLE ROW LEVEL SECURITY;
