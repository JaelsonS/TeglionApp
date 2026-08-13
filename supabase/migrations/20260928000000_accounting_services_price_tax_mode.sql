-- Liliane UX: IVA label mode on public accounting services (display-only; no Stripe tax calc)
ALTER TABLE public.accounting_services
  ADD COLUMN IF NOT EXISTS price_tax_mode text;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'accounting_services_price_tax_mode_check'
  ) THEN
    ALTER TABLE public.accounting_services
      ADD CONSTRAINT accounting_services_price_tax_mode_check
      CHECK (price_tax_mode IS NULL OR price_tax_mode = ANY (ARRAY['included'::text, 'excluded'::text]));
  END IF;
END $$;

COMMENT ON COLUMN public.accounting_services.price_tax_mode IS
  'Public price copy: included = IVA incluído à taxa legal; excluded = acresce o IVA à taxa legal';
