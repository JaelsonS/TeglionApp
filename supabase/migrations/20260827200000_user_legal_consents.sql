-- Consentimentos legais (RGPD) — histórico imutável por aceitação

CREATE TABLE IF NOT EXISTS public.user_legal_consents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  firm_user_id UUID REFERENCES public.firm_users(id) ON DELETE CASCADE,
  client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE,
  firm_id UUID NOT NULL REFERENCES public.firms(id) ON DELETE CASCADE,
  account_type TEXT NOT NULL CHECK (account_type IN ('FIRM', 'CLIENT')),
  terms_version TEXT NOT NULL,
  privacy_version TEXT NOT NULL,
  dpa_version TEXT NOT NULL,
  cookies_version TEXT NOT NULL,
  accepted_terms BOOLEAN NOT NULL DEFAULT false,
  accepted_privacy BOOLEAN NOT NULL DEFAULT false,
  accepted_dpa BOOLEAN NOT NULL DEFAULT false,
  accepted_cookies BOOLEAN NOT NULL DEFAULT false,
  accepted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT user_legal_consents_actor_chk CHECK (
    (account_type = 'FIRM' AND firm_user_id IS NOT NULL AND client_id IS NULL)
    OR (account_type = 'CLIENT' AND client_id IS NOT NULL AND firm_user_id IS NULL)
  )
);

CREATE INDEX IF NOT EXISTS idx_user_legal_consents_firm_user
  ON public.user_legal_consents (firm_user_id, accepted_at DESC)
  WHERE firm_user_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_user_legal_consents_firm
  ON public.user_legal_consents (firm_id, accepted_at DESC);

ALTER TABLE public.firm_users
  ADD COLUMN IF NOT EXISTS legal_consent_bundle TEXT;

COMMENT ON TABLE public.user_legal_consents IS 'Histórico imutável de aceitações legais (apenas INSERT).';
COMMENT ON COLUMN public.firm_users.legal_consent_bundle IS 'Versões aceites atuais: terms|privacy|dpa|cookies separadas por pipe.';

ALTER TABLE public.user_legal_consents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS user_legal_consents_firm ON public.user_legal_consents;
CREATE POLICY user_legal_consents_firm ON public.user_legal_consents
  FOR SELECT
  USING (firm_id = public.current_firm_id() AND public.is_firm_staff());
