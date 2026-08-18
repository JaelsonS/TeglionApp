-- Acessos oficiais (AT, Segurança Social, ViaCTT, IAPMEI, Relatório Único).
-- Senhas de portais do Estado: a equipa PRECISA de as ler de volta.
-- Por isso NÃO se usa hash (Argon2/bcrypt). Cifra reversível AES-256-GCM
-- (enc:v1, mesmo padrão de crypto-fields.js / Google Calendar).
-- A API nunca devolve secret_enc; revelar exige step-up (palavra-passe do staff).
-- O portal do cliente NÃO tem rotas para esta tabela.

CREATE TABLE IF NOT EXISTS public.client_official_accesses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  firm_id UUID NOT NULL REFERENCES public.firms(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  portal_key TEXT NOT NULL,
  label TEXT,
  username TEXT,
  secret_enc TEXT,
  updated_by UUID REFERENCES public.firm_users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT client_official_accesses_portal_key_chk CHECK (
    portal_key IN (
      'AT_FINANCAS',
      'SEGURANCA_SOCIAL',
      'VIA_CTT',
      'IAPMEI',
      'RELATORIO_UNICO',
      'CUSTOM'
    )
  ),
  CONSTRAINT client_official_accesses_label_chk CHECK (
    label IS NULL OR char_length(label) <= 80
  ),
  CONSTRAINT client_official_accesses_username_chk CHECK (
    username IS NULL OR char_length(username) <= 200
  )
);

COMMENT ON TABLE public.client_official_accesses IS
  'Credenciais de portais oficiais por cliente. secret_enc = AES-GCM (enc:v1), nunca texto plano.';

CREATE UNIQUE INDEX IF NOT EXISTS client_official_accesses_catalog_unique
  ON public.client_official_accesses (client_id, portal_key)
  WHERE portal_key <> 'CUSTOM';

CREATE INDEX IF NOT EXISTS idx_client_official_accesses_firm_client
  ON public.client_official_accesses (firm_id, client_id);

ALTER TABLE public.client_official_accesses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS client_official_accesses_firm_staff ON public.client_official_accesses;
CREATE POLICY client_official_accesses_firm_staff ON public.client_official_accesses
  FOR ALL
  USING (firm_id = public.current_firm_id() AND public.is_firm_staff())
  WITH CHECK (firm_id = public.current_firm_id() AND public.is_firm_staff());

-- Rollback (documentação):
-- DROP POLICY IF EXISTS client_official_accesses_firm_staff ON public.client_official_accesses;
-- DROP TABLE IF EXISTS public.client_official_accesses;
