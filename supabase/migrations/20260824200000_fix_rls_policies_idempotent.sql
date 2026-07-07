-- Corrige reexecução de migrations com policies já criadas (erro 42710).
-- Seguro para correr múltiplas vezes.

DROP POLICY IF EXISTS task_comments_staff ON public.task_comments;
DROP POLICY IF EXISTS task_comments_client ON public.task_comments;
DROP POLICY IF EXISTS task_comments_client_insert ON public.task_comments;
DROP POLICY IF EXISTS firm_notifications_staff ON public.firm_notifications;
DROP POLICY IF EXISTS task_automation_rules_staff ON public.task_automation_rules;
DROP POLICY IF EXISTS push_subscriptions_own ON public.push_subscriptions;

CREATE POLICY task_comments_staff ON public.task_comments FOR ALL
  USING (firm_id = public.current_firm_id() AND public.is_firm_staff());

CREATE POLICY task_comments_client ON public.task_comments FOR SELECT
  USING (public.is_client_user());

CREATE POLICY task_comments_client_insert ON public.task_comments FOR INSERT
  WITH CHECK (public.is_client_user() AND author_role = 'CLIENT');

CREATE POLICY firm_notifications_staff ON public.firm_notifications FOR ALL
  USING (firm_id = public.current_firm_id() AND public.is_firm_staff());

CREATE POLICY task_automation_rules_staff ON public.task_automation_rules FOR ALL
  USING (firm_id = public.current_firm_id() AND public.is_firm_staff());

CREATE POLICY push_subscriptions_own ON public.push_subscriptions FOR ALL
  USING (
    firm_id = public.current_firm_id()
    AND (
      (user_role = 'FIRM' AND public.is_firm_staff())
      OR (user_role = 'CLIENT' AND public.is_client_user())
    )
  );
