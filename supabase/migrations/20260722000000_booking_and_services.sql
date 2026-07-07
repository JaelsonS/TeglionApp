-- Catálogo de serviços por escritório + metadados em consultas para reservas cliente

CREATE TABLE IF NOT EXISTS public.accounting_services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  firm_id UUID NOT NULL REFERENCES public.firms(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  duration_minutes INT NOT NULL DEFAULT 60 CHECK (duration_minutes >= 15 AND duration_minutes <= 480),
  price_cents INT NOT NULL DEFAULT 0 CHECK (price_cents >= 0),
  currency TEXT NOT NULL DEFAULT 'EUR',
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_accounting_services_firm_active
  ON public.accounting_services (firm_id)
  WHERE is_active = true;

ALTER TABLE public.consultations
  ADD COLUMN IF NOT EXISTS accounting_service_id UUID REFERENCES public.accounting_services(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS price_cents INT,
  ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'EUR',
  ADD COLUMN IF NOT EXISTS source TEXT NOT NULL DEFAULT 'FIRM' CHECK (source IN ('FIRM', 'CLIENT'));

ALTER TABLE public.accounting_services ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS accounting_services_firm ON public.accounting_services;
CREATE POLICY accounting_services_firm ON public.accounting_services
  FOR ALL
  USING (firm_id = public.current_firm_id() AND public.is_firm_staff())
  WITH CHECK (firm_id = public.current_firm_id() AND public.is_firm_staff());
