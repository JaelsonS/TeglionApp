-- Etiquetas firm-wide: mesmas firm_inquiry_tags ligadas a clientes, leads e equipa.

CREATE TABLE IF NOT EXISTS public.client_tag_links (
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES public.firm_inquiry_tags(id) ON DELETE CASCADE,
  firm_id UUID NOT NULL REFERENCES public.firms(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (client_id, tag_id)
);

CREATE INDEX IF NOT EXISTS idx_client_tag_links_firm ON public.client_tag_links (firm_id);
CREATE INDEX IF NOT EXISTS idx_client_tag_links_tag ON public.client_tag_links (tag_id);

ALTER TABLE public.client_tag_links ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS client_tag_links_firm_staff ON public.client_tag_links;
CREATE POLICY client_tag_links_firm_staff ON public.client_tag_links
  FOR ALL
  USING (firm_id = public.current_firm_id() AND public.is_firm_staff())
  WITH CHECK (firm_id = public.current_firm_id() AND public.is_firm_staff());

CREATE TABLE IF NOT EXISTS public.lead_tag_links (
  lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES public.firm_inquiry_tags(id) ON DELETE CASCADE,
  firm_id UUID NOT NULL REFERENCES public.firms(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (lead_id, tag_id)
);

CREATE INDEX IF NOT EXISTS idx_lead_tag_links_firm ON public.lead_tag_links (firm_id);
CREATE INDEX IF NOT EXISTS idx_lead_tag_links_tag ON public.lead_tag_links (tag_id);

ALTER TABLE public.lead_tag_links ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS lead_tag_links_firm_staff ON public.lead_tag_links;
CREATE POLICY lead_tag_links_firm_staff ON public.lead_tag_links
  FOR ALL
  USING (firm_id = public.current_firm_id() AND public.is_firm_staff())
  WITH CHECK (firm_id = public.current_firm_id() AND public.is_firm_staff());

CREATE TABLE IF NOT EXISTS public.firm_user_tag_links (
  firm_user_id UUID NOT NULL REFERENCES public.firm_users(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES public.firm_inquiry_tags(id) ON DELETE CASCADE,
  firm_id UUID NOT NULL REFERENCES public.firms(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (firm_user_id, tag_id)
);

CREATE INDEX IF NOT EXISTS idx_firm_user_tag_links_firm ON public.firm_user_tag_links (firm_id);
CREATE INDEX IF NOT EXISTS idx_firm_user_tag_links_tag ON public.firm_user_tag_links (tag_id);

ALTER TABLE public.firm_user_tag_links ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS firm_user_tag_links_firm_staff ON public.firm_user_tag_links;
CREATE POLICY firm_user_tag_links_firm_staff ON public.firm_user_tag_links
  FOR ALL
  USING (firm_id = public.current_firm_id() AND public.is_firm_staff())
  WITH CHECK (firm_id = public.current_firm_id() AND public.is_firm_staff());
