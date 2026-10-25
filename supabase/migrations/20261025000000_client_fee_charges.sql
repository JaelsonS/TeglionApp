-- Onda 1 V10: avenças / honorários do cliente ao escritório (registo manual).
-- Stripe Connect é opcional — estas tabelas não dependem de firm_payments.
-- Não aplicar em produção sem autorização; staging só com confirmação.

ALTER TABLE public.clients
  ADD COLUMN IF NOT EXISTS retainer_amount_cents INTEGER
    CHECK (retainer_amount_cents IS NULL OR retainer_amount_cents >= 0),
  ADD COLUMN IF NOT EXISTS retainer_currency TEXT NOT NULL DEFAULT 'EUR',
  ADD COLUMN IF NOT EXISTS retainer_active BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS retainer_due_day INTEGER NOT NULL DEFAULT 1
    CHECK (retainer_due_day >= 1 AND retainer_due_day <= 28);

COMMENT ON COLUMN public.clients.retainer_amount_cents IS
  'Avença mensal (honorários escritório), em cêntimos. Independente de Stripe Connect.';
COMMENT ON COLUMN public.clients.retainer_active IS
  'Se true, entra no gerar pagamentos em massa.';
COMMENT ON COLUMN public.clients.retainer_due_day IS
  'Dia civil de vencimento preferido (1–28) para a avença do mês.';

CREATE TABLE IF NOT EXISTS public.client_fee_charges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  firm_id UUID NOT NULL REFERENCES public.firms(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  year_month CHAR(7) NOT NULL,
  amount_cents INTEGER NOT NULL CHECK (amount_cents >= 0),
  currency TEXT NOT NULL DEFAULT 'EUR',
  status TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'confirmed', 'sent', 'paid', 'cancelled')),
  payment_method TEXT
    CHECK (
      payment_method IS NULL
      OR payment_method IN ('transfer', 'mbway', 'cash', 'multibanco', 'stripe', 'other')
    ),
  paid_at TIMESTAMPTZ,
  due_date DATE,
  notes TEXT,
  source TEXT NOT NULL DEFAULT 'manual'
    CHECK (source IN ('manual', 'bulk', 'stripe')),
  created_by UUID REFERENCES public.firm_users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT client_fee_charges_year_month_fmt
    CHECK (year_month ~ '^[0-9]{4}-(0[1-9]|1[0-2])$')
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_client_fee_charges_one_open_month
  ON public.client_fee_charges (firm_id, client_id, year_month)
  WHERE status <> 'cancelled';

CREATE INDEX IF NOT EXISTS idx_client_fee_charges_firm_year
  ON public.client_fee_charges (firm_id, year_month);

CREATE INDEX IF NOT EXISTS idx_client_fee_charges_client
  ON public.client_fee_charges (firm_id, client_id, year_month);

COMMENT ON TABLE public.client_fee_charges IS
  'Pagamentos de avença/honorários por cliente e mês. Controlo interno do escritório — não é fatura certificada AT.';

ALTER TABLE public.client_fee_charges ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS client_fee_charges_firm_staff ON public.client_fee_charges;
CREATE POLICY client_fee_charges_firm_staff ON public.client_fee_charges
  FOR SELECT
  USING (firm_id = public.current_firm_id() AND public.is_firm_staff());

-- Rollback (documentação):
-- DROP TABLE IF EXISTS public.client_fee_charges;
-- ALTER TABLE public.clients DROP COLUMN IF EXISTS retainer_amount_cents;
-- ALTER TABLE public.clients DROP COLUMN IF EXISTS retainer_currency;
-- ALTER TABLE public.clients DROP COLUMN IF EXISTS retainer_active;
-- ALTER TABLE public.clients DROP COLUMN IF EXISTS retainer_due_day;
