-- Grupos de serviço (hierarquia de 1 nível: grupo -> serviços), ROADMAP Fase 2.
-- Mesmo padrão de firm_fiscal_categories (id, firm_id, name, sort_order, is_active).
-- accounting_services.public_group (texto livre) NÃO é removida -- fica como coluna
-- legada; a partir desta migration, o campo público `publicGroup` da API passa a ser
-- resolvido a partir do nome do grupo real (accounting_service_groups.name), não mais
-- do texto livre. Ver ADR-0009.

CREATE TABLE IF NOT EXISTS public.accounting_service_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  firm_id UUID NOT NULL REFERENCES public.firms(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_publicly_listed BOOLEAN NOT NULL DEFAULT true,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (firm_id, name)
);

CREATE INDEX IF NOT EXISTS idx_accounting_service_groups_firm
  ON public.accounting_service_groups (firm_id, is_active);

ALTER TABLE public.accounting_service_groups ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS accounting_service_groups_firm ON public.accounting_service_groups;
CREATE POLICY accounting_service_groups_firm ON public.accounting_service_groups
  FOR ALL
  USING (firm_id = public.current_firm_id() AND public.is_firm_staff())
  WITH CHECK (firm_id = public.current_firm_id() AND public.is_firm_staff());

ALTER TABLE public.accounting_services
  ADD COLUMN IF NOT EXISTS group_id UUID REFERENCES public.accounting_service_groups(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_accounting_services_group ON public.accounting_services (group_id);

-- Backfill: 1 grupo real por valor distinto de public_group já usado por cada firma,
-- e liga os serviços a ele. Idempotente (UNIQUE firm_id+name protege contra reexecução).
INSERT INTO public.accounting_service_groups (firm_id, name, sort_order)
SELECT DISTINCT ON (firm_id, public_group)
  firm_id,
  public_group,
  0
FROM public.accounting_services
WHERE public_group IS NOT NULL AND btrim(public_group) <> ''
ON CONFLICT (firm_id, name) DO NOTHING;

UPDATE public.accounting_services s
SET group_id = g.id
FROM public.accounting_service_groups g
WHERE s.group_id IS NULL
  AND s.public_group IS NOT NULL AND btrim(s.public_group) <> ''
  AND g.firm_id = s.firm_id
  AND g.name = s.public_group;

-- Rollback (documentação):
-- ALTER TABLE public.accounting_services DROP COLUMN IF EXISTS group_id;
-- DROP TABLE IF EXISTS public.accounting_service_groups;
