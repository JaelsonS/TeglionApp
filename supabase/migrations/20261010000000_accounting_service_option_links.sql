-- Oferta comercial: serviço principal → opções (serviços reais).
-- NÃO é hierarquia recursiva de categorias (ADR-0009 mantém Grupo → Serviço).
-- Padrão M2M do projeto (*_links): PK composta, firm_id redundante, RLS firm_staff.
-- Profundidade máxima = 1 (aplicação + CHECK de auto-referência). Ver ADR-0011.

CREATE TABLE IF NOT EXISTS public.accounting_service_option_links (
  parent_service_id UUID NOT NULL REFERENCES public.accounting_services(id) ON DELETE CASCADE,
  child_service_id UUID NOT NULL REFERENCES public.accounting_services(id) ON DELETE CASCADE,
  firm_id UUID NOT NULL REFERENCES public.firms(id) ON DELETE CASCADE,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (parent_service_id, child_service_id),
  CONSTRAINT accounting_service_option_links_no_self CHECK (parent_service_id <> child_service_id)
);

CREATE INDEX IF NOT EXISTS idx_accounting_service_option_links_firm
  ON public.accounting_service_option_links (firm_id);
CREATE INDEX IF NOT EXISTS idx_accounting_service_option_links_child
  ON public.accounting_service_option_links (child_service_id);
CREATE INDEX IF NOT EXISTS idx_accounting_service_option_links_parent_sort
  ON public.accounting_service_option_links (parent_service_id, sort_order);

ALTER TABLE public.accounting_service_option_links ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS accounting_service_option_links_firm_staff ON public.accounting_service_option_links;
CREATE POLICY accounting_service_option_links_firm_staff ON public.accounting_service_option_links
  FOR ALL
  USING (firm_id = public.current_firm_id() AND public.is_firm_staff())
  WITH CHECK (firm_id = public.current_firm_id() AND public.is_firm_staff());

-- Defesa em profundidade: parent e child têm de pertencer à mesma firma do link.
CREATE OR REPLACE FUNCTION public.accounting_service_option_links_same_firm()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  parent_firm UUID;
  child_firm UUID;
BEGIN
  SELECT firm_id INTO parent_firm FROM public.accounting_services WHERE id = NEW.parent_service_id;
  SELECT firm_id INTO child_firm FROM public.accounting_services WHERE id = NEW.child_service_id;
  IF parent_firm IS NULL OR child_firm IS NULL THEN
    RAISE EXCEPTION 'accounting_service_option_links: serviço inexistente';
  END IF;
  IF parent_firm <> NEW.firm_id OR child_firm <> NEW.firm_id OR parent_firm <> child_firm THEN
    RAISE EXCEPTION 'accounting_service_option_links: parent e child têm de pertencer à mesma firma';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_accounting_service_option_links_same_firm ON public.accounting_service_option_links;
CREATE TRIGGER trg_accounting_service_option_links_same_firm
  BEFORE INSERT OR UPDATE ON public.accounting_service_option_links
  FOR EACH ROW
  EXECUTE FUNCTION public.accounting_service_option_links_same_firm();

-- Rollback (documentação):
-- DROP TRIGGER IF EXISTS trg_accounting_service_option_links_same_firm ON public.accounting_service_option_links;
-- DROP FUNCTION IF EXISTS public.accounting_service_option_links_same_firm();
-- DROP TABLE IF EXISTS public.accounting_service_option_links;
