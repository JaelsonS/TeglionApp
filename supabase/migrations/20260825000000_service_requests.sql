-- Sprint 5 — Central de Serviços (pedidos / orçamentos)

CREATE TABLE IF NOT EXISTS public.service_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  firm_id UUID NOT NULL REFERENCES public.firms(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  accounting_service_id UUID REFERENCES public.accounting_services(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'SUBMITTED' CHECK (status IN (
    'DRAFT', 'SUBMITTED', 'ASSIGNED', 'QUOTED', 'APPROVED', 'PAID',
    'IN_PROGRESS', 'DONE', 'RATED', 'CANCELLED'
  )),
  priority TEXT NOT NULL DEFAULT 'NORMAL' CHECK (priority IN ('LOW', 'NORMAL', 'HIGH', 'URGENT')),
  assignee_id UUID REFERENCES public.firm_users(id) ON DELETE SET NULL,
  quoted_amount_cents INT,
  currency TEXT NOT NULL DEFAULT 'EUR',
  sla_due_at TIMESTAMPTZ,
  internal_notes TEXT,
  client_notes TEXT,
  consultation_id UUID REFERENCES public.consultations(id) ON DELETE SET NULL,
  submitted_at TIMESTAMPTZ,
  quoted_at TIMESTAMPTZ,
  approved_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_by_role TEXT CHECK (created_by_role IN ('FIRM', 'CLIENT')),
  created_by_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_service_requests_firm_status ON public.service_requests (firm_id, status);
CREATE INDEX IF NOT EXISTS idx_service_requests_client ON public.service_requests (firm_id, client_id);

CREATE TABLE IF NOT EXISTS public.service_request_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  firm_id UUID NOT NULL REFERENCES public.firms(id) ON DELETE CASCADE,
  service_request_id UUID NOT NULL REFERENCES public.service_requests(id) ON DELETE CASCADE,
  author_role TEXT NOT NULL CHECK (author_role IN ('FIRM', 'CLIENT')),
  author_id UUID NOT NULL,
  author_name TEXT,
  body TEXT NOT NULL,
  is_internal BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_sr_comments_request ON public.service_request_comments (service_request_id, created_at);

ALTER TABLE public.service_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_request_comments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS service_requests_staff ON public.service_requests;
CREATE POLICY service_requests_staff ON public.service_requests FOR ALL
  USING (firm_id = public.current_firm_id() AND public.is_firm_staff());

DROP POLICY IF EXISTS service_requests_client_select ON public.service_requests;
CREATE POLICY service_requests_client_select ON public.service_requests FOR SELECT
  USING (public.is_client_user() AND client_id = public.current_client_id());

DROP POLICY IF EXISTS service_requests_client_insert ON public.service_requests;
CREATE POLICY service_requests_client_insert ON public.service_requests FOR INSERT
  WITH CHECK (public.is_client_user() AND created_by_role = 'CLIENT');

DROP POLICY IF EXISTS service_requests_client_update ON public.service_requests;
CREATE POLICY service_requests_client_update ON public.service_requests FOR UPDATE
  USING (public.is_client_user() AND client_id = public.current_client_id());

DROP POLICY IF EXISTS service_request_comments_staff ON public.service_request_comments;
CREATE POLICY service_request_comments_staff ON public.service_request_comments FOR ALL
  USING (firm_id = public.current_firm_id() AND public.is_firm_staff());

DROP POLICY IF EXISTS service_request_comments_client ON public.service_request_comments;
CREATE POLICY service_request_comments_client ON public.service_request_comments FOR SELECT
  USING (public.is_client_user() AND NOT is_internal);

DROP POLICY IF EXISTS service_request_comments_client_insert ON public.service_request_comments;
CREATE POLICY service_request_comments_client_insert ON public.service_request_comments FOR INSERT
  WITH CHECK (public.is_client_user() AND author_role = 'CLIENT' AND is_internal = false);
