-- ContaBil — RLS policies 
-- JWT esperado (emitido pelo backend Node durante transição):
--   firm_id, client_id (opcional), role: FIRM_* | CLIENT_USER

-- Firms: staff vê o próprio tenant
DROP POLICY IF EXISTS firms_select_own ON public.firms;
CREATE POLICY firms_select_own ON public.firms
  FOR SELECT USING (id = public.current_firm_id() AND public.is_firm_staff());

DROP POLICY IF EXISTS firms_update_own ON public.firms;
CREATE POLICY firms_update_own ON public.firms
  FOR UPDATE USING (id = public.current_firm_id() AND public.is_firm_staff());

-- Firm users
DROP POLICY IF EXISTS firm_users_tenant ON public.firm_users;
CREATE POLICY firm_users_tenant ON public.firm_users
  FOR ALL USING (firm_id = public.current_firm_id() AND public.is_firm_staff());

-- Clients
DROP POLICY IF EXISTS clients_firm_staff ON public.clients;
CREATE POLICY clients_firm_staff ON public.clients
  FOR ALL USING (firm_id = public.current_firm_id() AND public.is_firm_staff());

DROP POLICY IF EXISTS clients_self_read ON public.clients;
CREATE POLICY clients_self_read ON public.clients
  FOR SELECT USING (
    public.is_client_user()
    AND id = public.current_client_id()
    AND firm_id = public.current_firm_id()
  );

-- Obligations
DROP POLICY IF EXISTS obligations_firm_staff ON public.obligations;
CREATE POLICY obligations_firm_staff ON public.obligations
  FOR ALL USING (firm_id = public.current_firm_id() AND public.is_firm_staff());

DROP POLICY IF EXISTS obligations_client_read ON public.obligations;
CREATE POLICY obligations_client_read ON public.obligations
  FOR SELECT USING (
    public.is_client_user()
    AND firm_id = public.current_firm_id()
    AND client_id = public.current_client_id()
  );

-- Client tasks
DROP POLICY IF EXISTS client_tasks_firm_staff ON public.client_tasks;
CREATE POLICY client_tasks_firm_staff ON public.client_tasks
  FOR ALL USING (firm_id = public.current_firm_id() AND public.is_firm_staff());

DROP POLICY IF EXISTS client_tasks_client ON public.client_tasks;
CREATE POLICY client_tasks_client ON public.client_tasks
  FOR SELECT USING (
    public.is_client_user()
    AND firm_id = public.current_firm_id()
    AND client_id = public.current_client_id()
  );

DROP POLICY IF EXISTS client_tasks_client_update ON public.client_tasks;
CREATE POLICY client_tasks_client_update ON public.client_tasks
  FOR UPDATE USING (
    public.is_client_user()
    AND firm_id = public.current_firm_id()
    AND client_id = public.current_client_id()
  );

-- Documents
DROP POLICY IF EXISTS documents_firm_staff ON public.documents;
CREATE POLICY documents_firm_staff ON public.documents
  FOR ALL USING (firm_id = public.current_firm_id() AND public.is_firm_staff());

DROP POLICY IF EXISTS documents_client ON public.documents;
CREATE POLICY documents_client ON public.documents
  FOR SELECT USING (
    public.is_client_user()
    AND firm_id = public.current_firm_id()
    AND client_id = public.current_client_id()
  );

DROP POLICY IF EXISTS documents_client_insert ON public.documents;
CREATE POLICY documents_client_insert ON public.documents
  FOR INSERT WITH CHECK (
    public.is_client_user()
    AND firm_id = public.current_firm_id()
    AND client_id = public.current_client_id()
  );

-- Messages
DROP POLICY IF EXISTS messages_firm_staff ON public.messages;
CREATE POLICY messages_firm_staff ON public.messages
  FOR ALL USING (firm_id = public.current_firm_id() AND public.is_firm_staff());

DROP POLICY IF EXISTS messages_client ON public.messages;
CREATE POLICY messages_client ON public.messages
  FOR ALL USING (
    public.is_client_user()
    AND firm_id = public.current_firm_id()
    AND client_id = public.current_client_id()
  );

-- Consultations
DROP POLICY IF EXISTS consultations_firm_staff ON public.consultations;
CREATE POLICY consultations_firm_staff ON public.consultations
  FOR ALL USING (firm_id = public.current_firm_id() AND public.is_firm_staff());

DROP POLICY IF EXISTS consultations_client_read ON public.consultations;
CREATE POLICY consultations_client_read ON public.consultations
  FOR SELECT USING (
    public.is_client_user()
    AND firm_id = public.current_firm_id()
    AND client_id = public.current_client_id()
  );

-- Accounting services (catálogo por escritório)
ALTER TABLE IF EXISTS public.accounting_services ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS accounting_services_firm ON public.accounting_services;
CREATE POLICY accounting_services_firm ON public.accounting_services
  FOR ALL
  USING (firm_id = public.current_firm_id() AND public.is_firm_staff())
  WITH CHECK (firm_id = public.current_firm_id() AND public.is_firm_staff());

-- Audit logs: só staff do tenant
DROP POLICY IF EXISTS audit_logs_firm ON public.audit_logs;
CREATE POLICY audit_logs_firm ON public.audit_logs
  FOR SELECT USING (firm_id = public.current_firm_id() AND public.is_firm_staff());

DROP POLICY IF EXISTS audit_logs_insert ON public.audit_logs;
CREATE POLICY audit_logs_insert ON public.audit_logs
  FOR INSERT WITH CHECK (firm_id = public.current_firm_id());

-- Client invites (se a tabela existir)
DROP POLICY IF EXISTS client_invites_firm_staff ON public.client_invites;
CREATE POLICY client_invites_firm_staff ON public.client_invites
  FOR ALL USING (firm_id = public.current_firm_id() AND public.is_firm_staff());

-- Exclusões mensais de visibilidade (obrigações / tarefas)
DROP POLICY IF EXISTS task_month_exclusions_firm_staff ON public.task_month_exclusions;
CREATE POLICY task_month_exclusions_firm_staff ON public.task_month_exclusions
  FOR ALL USING (firm_id = public.current_firm_id() AND public.is_firm_staff());

-- Service role bypass: usar SUPABASE_SERVICE_ROLE_KEY no backend (não expor ao browser)
