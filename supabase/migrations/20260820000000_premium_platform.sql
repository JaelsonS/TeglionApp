-- ContaBil — evolução premium: documentos, obrigações fiscais, visualizações, SMS, notícias

-- Documentos: metadados enriquecidos
ALTER TABLE public.documents
  ADD COLUMN IF NOT EXISTS description TEXT,
  ADD COLUMN IF NOT EXISTS observations TEXT,
  ADD COLUMN IF NOT EXISTS category TEXT,
  ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS workflow_status TEXT NOT NULL DEFAULT 'SENT'
    CHECK (workflow_status IN ('SENT', 'RECEIVED', 'IN_ANALYSIS', 'PROCESSED')),
  ADD COLUMN IF NOT EXISTS uploaded_by_name TEXT;

-- Obrigações fiscais: pagamento e prioridade
ALTER TABLE public.obligations
  ADD COLUMN IF NOT EXISTS amount_cents BIGINT,
  ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'EUR',
  ADD COLUMN IF NOT EXISTS payment_status TEXT NOT NULL DEFAULT 'PENDING'
    CHECK (payment_status IN ('PENDING', 'PAID', 'OVERDUE', 'PROCESSING')),
  ADD COLUMN IF NOT EXISTS priority TEXT NOT NULL DEFAULT 'NORMAL'
    CHECK (priority IN ('LOW', 'NORMAL', 'HIGH', 'URGENT')),
  ADD COLUMN IF NOT EXISTS document_id UUID REFERENCES public.documents(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS accountant_notes TEXT,
  ADD COLUMN IF NOT EXISTS payment_proof_document_id UUID REFERENCES public.documents(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS paid_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS view_count INT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS first_viewed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS last_viewed_at TIMESTAMPTZ;

-- Rastreamento de visualização (documentos e obrigações)
CREATE TABLE IF NOT EXISTS public.content_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  firm_id UUID NOT NULL REFERENCES public.firms(id) ON DELETE CASCADE,
  client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE,
  entity_type TEXT NOT NULL CHECK (entity_type IN ('DOCUMENT', 'OBLIGATION')),
  entity_id UUID NOT NULL,
  viewer_role TEXT NOT NULL CHECK (viewer_role IN ('FIRM', 'CLIENT')),
  viewer_id UUID,
  viewer_name TEXT,
  ip_address INET,
  user_agent TEXT,
  device_type TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_content_views_entity ON public.content_views (entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_content_views_firm ON public.content_views (firm_id, created_at DESC);

-- Timeline de atividades
CREATE TABLE IF NOT EXISTS public.activity_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  firm_id UUID NOT NULL REFERENCES public.firms(id) ON DELETE CASCADE,
  client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
  actor_role TEXT,
  actor_id UUID,
  actor_name TEXT,
  event_type TEXT NOT NULL,
  entity_type TEXT,
  entity_id UUID,
  title TEXT NOT NULL,
  description TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_activity_events_firm ON public.activity_events (firm_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_events_entity ON public.activity_events (entity_type, entity_id);

-- SMS (Brevo)
CREATE TABLE IF NOT EXISTS public.sms_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  firm_id UUID NOT NULL REFERENCES public.firms(id) ON DELETE CASCADE,
  client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
  phone TEXT NOT NULL,
  template_key TEXT,
  message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'PENDING'
    CHECK (status IN ('PENDING', 'DELIVERED', 'FAILED', 'READ')),
  brevo_message_id TEXT,
  error_message TEXT,
  entity_type TEXT,
  entity_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  delivered_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_sms_logs_firm ON public.sms_logs (firm_id, created_at DESC);

-- Notícias / blog interno
CREATE TABLE IF NOT EXISTS public.news_articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  firm_id UUID NOT NULL REFERENCES public.firms(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  slug TEXT NOT NULL,
  excerpt TEXT,
  body TEXT NOT NULL,
  cover_url TEXT,
  category TEXT,
  tags TEXT[] DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'DRAFT'
    CHECK (status IN ('DRAFT', 'SCHEDULED', 'PUBLISHED', 'ARCHIVED')),
  is_featured BOOLEAN NOT NULL DEFAULT false,
  reading_time_minutes INT,
  author_id UUID REFERENCES public.firm_users(id) ON DELETE SET NULL,
  author_name TEXT,
  published_at TIMESTAMPTZ,
  scheduled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (firm_id, slug)
);

CREATE INDEX IF NOT EXISTS idx_news_articles_firm_status ON public.news_articles (firm_id, status, published_at DESC);

-- Notificações in-app
CREATE TABLE IF NOT EXISTS public.in_app_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  firm_id UUID NOT NULL REFERENCES public.firms(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT,
  entity_type TEXT,
  entity_id UUID,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_in_app_notifications_client ON public.in_app_notifications (client_id, read_at, created_at DESC);

-- Políticas RLS (staff / cliente)
CREATE POLICY content_views_staff ON public.content_views FOR ALL
  USING (firm_id = public.current_firm_id() AND public.is_firm_staff());

CREATE POLICY content_views_client ON public.content_views FOR SELECT
  USING (client_id = public.current_client_id() AND public.is_client_user());

CREATE POLICY content_views_client_insert ON public.content_views FOR INSERT
  WITH CHECK (client_id = public.current_client_id() AND public.is_client_user());

CREATE POLICY activity_events_staff ON public.activity_events FOR ALL
  USING (firm_id = public.current_firm_id() AND public.is_firm_staff());

CREATE POLICY activity_events_client ON public.activity_events FOR SELECT
  USING (client_id = public.current_client_id() AND public.is_client_user());

CREATE POLICY sms_logs_staff ON public.sms_logs FOR ALL
  USING (firm_id = public.current_firm_id() AND public.is_firm_staff());

CREATE POLICY news_articles_staff ON public.news_articles FOR ALL
  USING (firm_id = public.current_firm_id() AND public.is_firm_staff());

CREATE POLICY news_articles_client ON public.news_articles FOR SELECT
  USING (firm_id = public.current_firm_id() AND status = 'PUBLISHED' AND public.is_client_user());

CREATE POLICY in_app_notifications_client ON public.in_app_notifications FOR ALL
  USING (client_id = public.current_client_id() AND public.is_client_user());

-- RLS
ALTER TABLE public.content_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sms_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.news_articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.in_app_notifications ENABLE ROW LEVEL SECURITY;
