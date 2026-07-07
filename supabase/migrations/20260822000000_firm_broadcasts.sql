-- ContaBil — Central de Alertas (broadcasts inteligentes)

CREATE TABLE IF NOT EXISTS public.firm_broadcasts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  firm_id UUID NOT NULL REFERENCES public.firms(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  slug TEXT NOT NULL,
  excerpt TEXT,
  body TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'AVISO'
    CHECK (category IN (
      'IVA', 'IRS', 'IRC', 'SS', 'DOC_PENDING', 'LEGAL', 'MAINTENANCE', 'INTERNAL', 'URGENT', 'AVISO'
    )),
  priority TEXT NOT NULL DEFAULT 'MEDIUM'
    CHECK (priority IN ('LOW', 'MEDIUM', 'HIGH', 'URGENT')),
  due_at TIMESTAMPTZ,
  scheduled_at TIMESTAMPTZ,
  published_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'DRAFT'
    CHECK (status IN ('DRAFT', 'SCHEDULED', 'PUBLISHED', 'ARCHIVED')),
  target_type TEXT NOT NULL DEFAULT 'ALL_CLIENTS'
    CHECK (target_type IN ('ALL_CLIENTS', 'SELECTED')),
  target_client_ids UUID[] NOT NULL DEFAULT '{}',
  cta_label TEXT,
  cta_url TEXT,
  attachments JSONB NOT NULL DEFAULT '[]'::jsonb,
  pinned BOOLEAN NOT NULL DEFAULT false,
  read_confirmation_required BOOLEAN NOT NULL DEFAULT false,
  cover_url TEXT,
  author_id UUID REFERENCES public.firm_users(id) ON DELETE SET NULL,
  author_name TEXT,
  delivery_count INT NOT NULL DEFAULT 0,
  read_count INT NOT NULL DEFAULT 0,
  ack_count INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (firm_id, slug)
);

CREATE TABLE IF NOT EXISTS public.firm_broadcast_reads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  broadcast_id UUID NOT NULL REFERENCES public.firm_broadcasts(id) ON DELETE CASCADE,
  firm_id UUID NOT NULL REFERENCES public.firms(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  read_at TIMESTAMPTZ,
  acknowledged_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (broadcast_id, client_id)
);

CREATE INDEX IF NOT EXISTS idx_firm_broadcasts_firm_status ON public.firm_broadcasts (firm_id, status, published_at DESC);
CREATE INDEX IF NOT EXISTS idx_firm_broadcasts_firm_pinned ON public.firm_broadcasts (firm_id, pinned, priority);
CREATE INDEX IF NOT EXISTS idx_firm_broadcast_reads_broadcast ON public.firm_broadcast_reads (broadcast_id);
CREATE INDEX IF NOT EXISTS idx_firm_broadcast_reads_client ON public.firm_broadcast_reads (client_id, read_at);

ALTER TABLE public.firm_broadcasts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.firm_broadcast_reads ENABLE ROW LEVEL SECURITY;

CREATE POLICY firm_broadcasts_staff ON public.firm_broadcasts FOR ALL
  USING (firm_id = public.current_firm_id() AND public.is_firm_staff());

CREATE POLICY firm_broadcast_reads_staff ON public.firm_broadcast_reads FOR ALL
  USING (firm_id = public.current_firm_id() AND public.is_firm_staff());

CREATE POLICY firm_broadcast_reads_client ON public.firm_broadcast_reads FOR SELECT
  USING (client_id = public.current_client_id() AND public.is_client_user());

CREATE POLICY firm_broadcast_reads_client_update ON public.firm_broadcast_reads FOR UPDATE
  USING (client_id = public.current_client_id() AND public.is_client_user());

CREATE POLICY firm_broadcasts_client ON public.firm_broadcasts FOR SELECT
  USING (
    firm_id = public.current_firm_id()
    AND status = 'PUBLISHED'
    AND public.is_client_user()
    AND (expires_at IS NULL OR expires_at > now())
  );
