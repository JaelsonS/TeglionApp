-- ContaBil — enable Row Level Security (multi-tenant)

ALTER TABLE public.firms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.firm_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.obligations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consultations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.accounting_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sms_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.news_articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.in_app_notifications ENABLE ROW LEVEL SECURITY;

-- Helpers: firm_id do JWT (custom claims) — ver policies.sql
CREATE OR REPLACE FUNCTION public.current_firm_id()
RETURNS UUID AS $$
  SELECT NULLIF(auth.jwt() ->> 'firm_id', '')::uuid;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.current_client_id()
RETURNS UUID AS $$
  SELECT NULLIF(auth.jwt() ->> 'client_id', '')::uuid;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_firm_staff()
RETURNS BOOLEAN AS $$
  SELECT COALESCE((auth.jwt() ->> 'role') IN ('FIRM_OWNER', 'FIRM_STAFF', 'FIRM_CONSULTANT'), false);
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_client_user()
RETURNS BOOLEAN AS $$
  SELECT COALESCE((auth.jwt() ->> 'role') = 'CLIENT_USER', false);
$$ LANGUAGE sql STABLE SECURITY DEFINER;
