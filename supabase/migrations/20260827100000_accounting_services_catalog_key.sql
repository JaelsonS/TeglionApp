-- Chave de catálogo para serviços de consultoria pré-definidos por escritório

ALTER TABLE public.accounting_services
  ADD COLUMN IF NOT EXISTS catalog_key TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS idx_accounting_services_firm_catalog_key
  ON public.accounting_services (firm_id, catalog_key)
  WHERE catalog_key IS NOT NULL;
