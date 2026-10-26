-- Onda 4 V10: alargar fiscal_calculations a retenção na fonte IRS.
-- Não aplicar em produção sem autorização.

ALTER TABLE public.fiscal_calculations
  DROP CONSTRAINT IF EXISTS fiscal_calculations_calc_type_check;

ALTER TABLE public.fiscal_calculations
  ADD CONSTRAINT fiscal_calculations_calc_type_check
  CHECK (calc_type IN (
    'vat_net_gross',
    'irs_brackets',
    'ss_contributions',
    'irs_withholding'
  ));

COMMENT ON TABLE public.fiscal_calculations IS
  'Simulações fiscais persistidas (IVA, IRS, SS, retenção). Não são declarações oficiais.';

-- Rollback:
-- ALTER TABLE public.fiscal_calculations DROP CONSTRAINT IF EXISTS fiscal_calculations_calc_type_check;
-- ALTER TABLE public.fiscal_calculations ADD CONSTRAINT fiscal_calculations_calc_type_check
--   CHECK (calc_type IN ('vat_net_gross', 'irs_brackets', 'ss_contributions'));
