-- Etiquetas de captação criadas pelo escritório (nome + cor).
-- Regras no serviço: se respostas X → aplicar etiqueta Y.
-- A solicitação chega já com as etiquetas resolvidas.

CREATE TABLE IF NOT EXISTS public.firm_inquiry_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  firm_id UUID NOT NULL REFERENCES public.firms(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color_hex TEXT NOT NULL DEFAULT '#0F2942',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (firm_id, name)
);

CREATE INDEX IF NOT EXISTS idx_firm_inquiry_tags_firm
  ON public.firm_inquiry_tags (firm_id);

ALTER TABLE public.firm_inquiry_tags ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS firm_inquiry_tags_firm_staff ON public.firm_inquiry_tags;
CREATE POLICY firm_inquiry_tags_firm_staff ON public.firm_inquiry_tags
  FOR ALL
  USING (firm_id = public.current_firm_id() AND public.is_firm_staff())
  WITH CHECK (firm_id = public.current_firm_id() AND public.is_firm_staff());

-- Regras por serviço: [{ "questionId": "...", "equals": "sim", "tagId": "uuid" }, ...]
ALTER TABLE public.accounting_services
  ADD COLUMN IF NOT EXISTS intake_tag_rules JSONB NOT NULL DEFAULT '[]'::jsonb;

-- Etiquetas aplicadas à solicitação (resolvidas na submissão)
CREATE TABLE IF NOT EXISTS public.service_inquiry_tag_links (
  service_inquiry_id UUID NOT NULL REFERENCES public.service_inquiries(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES public.firm_inquiry_tags(id) ON DELETE CASCADE,
  firm_id UUID NOT NULL REFERENCES public.firms(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (service_inquiry_id, tag_id)
);

CREATE INDEX IF NOT EXISTS idx_service_inquiry_tag_links_firm
  ON public.service_inquiry_tag_links (firm_id);

CREATE INDEX IF NOT EXISTS idx_service_inquiry_tag_links_tag
  ON public.service_inquiry_tag_links (tag_id);

ALTER TABLE public.service_inquiry_tag_links ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS service_inquiry_tag_links_firm_staff ON public.service_inquiry_tag_links;
CREATE POLICY service_inquiry_tag_links_firm_staff ON public.service_inquiry_tag_links
  FOR ALL
  USING (firm_id = public.current_firm_id() AND public.is_firm_staff())
  WITH CHECK (firm_id = public.current_firm_id() AND public.is_firm_staff());

-- Rollback (documentação):
-- DROP TABLE IF EXISTS public.service_inquiry_tag_links;
-- ALTER TABLE public.accounting_services DROP COLUMN IF EXISTS intake_tag_rules;
-- DROP TABLE IF EXISTS public.firm_inquiry_tags;
