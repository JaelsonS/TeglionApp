-- Onda 5 V10: imóveis / contratos / recibos de renda INTERNOS.
-- Sem comunicação AT, sem e-Fatura, sem ATCUD.
-- Não aplicar em produção sem autorização.

CREATE TABLE IF NOT EXISTS public.client_properties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  firm_id UUID NOT NULL REFERENCES public.firms(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  address_line TEXT,
  postal_code TEXT,
  locality TEXT,
  artigo_matricial TEXT,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'archived')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_client_properties_firm_client
  ON public.client_properties (firm_id, client_id)
  WHERE status = 'active';

CREATE TABLE IF NOT EXISTS public.property_leases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  firm_id UUID NOT NULL REFERENCES public.firms(id) ON DELETE CASCADE,
  property_id UUID NOT NULL REFERENCES public.client_properties(id) ON DELETE CASCADE,
  tenant_display_name TEXT NOT NULL,
  tenant_nif TEXT,
  tenant_email TEXT,
  tenant_phone TEXT,
  start_date DATE NOT NULL,
  end_date DATE,
  monthly_rent_cents INTEGER NOT NULL CHECK (monthly_rent_cents >= 0),
  currency TEXT NOT NULL DEFAULT 'EUR',
  rent_due_day INTEGER NOT NULL DEFAULT 1
    CHECK (rent_due_day >= 1 AND rent_due_day <= 28),
  lease_type TEXT NOT NULL DEFAULT 'habitacao'
    CHECK (lease_type IN ('habitacao', 'comercio', 'outro')),
  status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('draft', 'active', 'ended', 'cancelled')),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_property_leases_firm_property
  ON public.property_leases (firm_id, property_id);

CREATE TABLE IF NOT EXISTS public.lease_rent_receipts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  firm_id UUID NOT NULL REFERENCES public.firms(id) ON DELETE CASCADE,
  lease_id UUID NOT NULL REFERENCES public.property_leases(id) ON DELETE CASCADE,
  year_month CHAR(7) NOT NULL,
  amount_cents INTEGER NOT NULL CHECK (amount_cents >= 0),
  currency TEXT NOT NULL DEFAULT 'EUR',
  status TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'issued', 'paid', 'cancelled')),
  payment_method TEXT
    CHECK (
      payment_method IS NULL
      OR payment_method IN ('transfer', 'mbway', 'cash', 'multibanco', 'other')
    ),
  paid_at TIMESTAMPTZ,
  due_date DATE,
  notes TEXT,
  source TEXT NOT NULL DEFAULT 'manual'
    CHECK (source IN ('manual', 'bulk')),
  created_by UUID REFERENCES public.firm_users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT lease_rent_receipts_year_month_fmt
    CHECK (year_month ~ '^[0-9]{4}-(0[1-9]|1[0-2])$')
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_lease_rent_receipts_one_open_month
  ON public.lease_rent_receipts (firm_id, lease_id, year_month)
  WHERE status <> 'cancelled';

CREATE INDEX IF NOT EXISTS idx_lease_rent_receipts_firm_year
  ON public.lease_rent_receipts (firm_id, year_month);

COMMENT ON TABLE public.client_properties IS
  'Imóveis do cliente (senhorio) — registo interno Teglion, sem AT.';
COMMENT ON TABLE public.property_leases IS
  'Contratos de arrendamento internos; inquilino como dados no contrato.';
COMMENT ON TABLE public.lease_rent_receipts IS
  'Recibos de renda INTERNOS (controlo escritório). Não são recibos oficiais AT.';

ALTER TABLE public.client_properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.property_leases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lease_rent_receipts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS client_properties_firm_staff ON public.client_properties;
CREATE POLICY client_properties_firm_staff ON public.client_properties
  FOR SELECT USING (firm_id = public.current_firm_id() AND public.is_firm_staff());

DROP POLICY IF EXISTS property_leases_firm_staff ON public.property_leases;
CREATE POLICY property_leases_firm_staff ON public.property_leases
  FOR SELECT USING (firm_id = public.current_firm_id() AND public.is_firm_staff());

DROP POLICY IF EXISTS lease_rent_receipts_firm_staff ON public.lease_rent_receipts;
CREATE POLICY lease_rent_receipts_firm_staff ON public.lease_rent_receipts
  FOR SELECT USING (firm_id = public.current_firm_id() AND public.is_firm_staff());

-- Rollback:
-- DROP TABLE IF EXISTS public.lease_rent_receipts;
-- DROP TABLE IF EXISTS public.property_leases;
-- DROP TABLE IF EXISTS public.client_properties;
