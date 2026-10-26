-- Reaproveita Imóveis e rendas para custos/contratos do gabinete.
-- client_id passa a ser opcional (NULL = custo do próprio escritório).

ALTER TABLE public.client_properties
  ALTER COLUMN client_id DROP NOT NULL;

ALTER TABLE public.client_properties
  ADD COLUMN IF NOT EXISTS cost_category TEXT NOT NULL DEFAULT 'outro'
    CHECK (cost_category IN (
      'arrendamento',
      'luz',
      'gas',
      'agua',
      'software',
      'telecom',
      'seguro',
      'outro'
    ));

ALTER TABLE public.client_properties
  ADD COLUMN IF NOT EXISTS supplier_name TEXT;

COMMENT ON COLUMN public.client_properties.client_id IS
  'Cliente senhorio (legado). NULL = contrato/custo do próprio gabinete.';
COMMENT ON COLUMN public.client_properties.cost_category IS
  'Categoria do custo/contrato do gabinete (ou legado de imóvel de cliente).';
COMMENT ON COLUMN public.client_properties.supplier_name IS
  'Fornecedor (EDP, Vodafone, senhorio do escritório, etc.).';

COMMENT ON TABLE public.client_properties IS
  'Contratos/custos do gabinete (ou imóveis de clientes legado) — registo interno Teglion.';
