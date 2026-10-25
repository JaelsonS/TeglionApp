-- Onda 6 V10: importações SAF-T PT em LEITURA (totais / resumo).
-- Sem envio à AT, sem XSD oficial completo (validação estrutural no serviço).
-- Não aplicar em produção sem autorização.

CREATE TABLE IF NOT EXISTS public.client_saft_imports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  firm_id UUID NOT NULL REFERENCES public.firms(id) ON DELETE CASCADE,
  client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
  original_filename TEXT NOT NULL,
  content_sha256 CHAR(64) NOT NULL,
  file_bytes INTEGER NOT NULL CHECK (file_bytes > 0),
  source_kind TEXT NOT NULL DEFAULT 'xml'
    CHECK (source_kind IN ('xml', 'zip')),
  audit_file_version TEXT,
  company_id TEXT,
  tax_registration_number TEXT,
  company_name TEXT,
  fiscal_year INTEGER,
  start_date DATE,
  end_date DATE,
  currency_code TEXT,
  product_id TEXT,
  product_version TEXT,
  summary JSONB NOT NULL DEFAULT '{}'::jsonb,
  validation_status TEXT NOT NULL DEFAULT 'ok'
    CHECK (validation_status IN ('ok', 'warning', 'invalid')),
  validation_notes TEXT[] NOT NULL DEFAULT '{}',
  created_by UUID REFERENCES public.firm_users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_client_saft_imports_firm_created
  ON public.client_saft_imports (firm_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_client_saft_imports_firm_client
  ON public.client_saft_imports (firm_id, client_id)
  WHERE client_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_client_saft_imports_firm_hash
  ON public.client_saft_imports (firm_id, content_sha256);

COMMENT ON TABLE public.client_saft_imports IS
  'Resumos de SAF-T PT lidos no Teglion (sem ficheiro completo, sem envio AT).';

ALTER TABLE public.client_saft_imports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS client_saft_imports_firm_staff ON public.client_saft_imports;
CREATE POLICY client_saft_imports_firm_staff ON public.client_saft_imports
  FOR SELECT USING (firm_id = public.current_firm_id() AND public.is_firm_staff());

-- Rollback:
-- DROP TABLE IF EXISTS public.client_saft_imports;
