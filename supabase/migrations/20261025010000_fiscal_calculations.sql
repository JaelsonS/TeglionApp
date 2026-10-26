-- Onda 2 V10: registos de cálculos fiscais (simulações auditáveis).
-- Motor independente da UI; histórico não muda se a regra futura mudar.
-- Não aplicar em produção sem autorização.

CREATE TABLE IF NOT EXISTS public.fiscal_calculations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  firm_id UUID NOT NULL REFERENCES public.firms(id) ON DELETE CASCADE,
  client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
  calc_type TEXT NOT NULL CHECK (calc_type IN ('vat_net_gross')),
  jurisdiction TEXT NOT NULL DEFAULT 'PT',
  tax TEXT NOT NULL DEFAULT 'IVA',
  rule_version TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'simulation'
    CHECK (status IN ('draft', 'simulation', 'reviewed')),
  input_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  result_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  meta_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_by UUID REFERENCES public.firm_users(id) ON DELETE SET NULL,
  reviewed_by UUID REFERENCES public.firm_users(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_fiscal_calculations_firm_created
  ON public.fiscal_calculations (firm_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_fiscal_calculations_firm_client
  ON public.fiscal_calculations (firm_id, client_id, created_at DESC)
  WHERE client_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_fiscal_calculations_rule
  ON public.fiscal_calculations (firm_id, rule_version);

COMMENT ON TABLE public.fiscal_calculations IS
  'Simulações fiscais persistidas (ex. IVA líquido/bruto). Não são declarações oficiais.';

ALTER TABLE public.fiscal_calculations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS fiscal_calculations_firm_staff ON public.fiscal_calculations;
CREATE POLICY fiscal_calculations_firm_staff ON public.fiscal_calculations
  FOR SELECT
  USING (firm_id = public.current_firm_id() AND public.is_firm_staff());

-- Rollback:
-- DROP TABLE IF EXISTS public.fiscal_calculations;
