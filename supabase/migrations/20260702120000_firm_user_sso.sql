-- SSO (Google) — ligação opcional por utilizador do escritório
ALTER TABLE public.firm_users
  ADD COLUMN IF NOT EXISTS sso_provider TEXT,
  ADD COLUMN IF NOT EXISTS sso_subject TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS idx_firm_users_sso_subject
  ON public.firm_users (sso_subject)
  WHERE sso_subject IS NOT NULL;

COMMENT ON COLUMN public.firm_users.sso_provider IS 'IdP: google, etc.';
COMMENT ON COLUMN public.firm_users.sso_subject IS 'Subject estável do IdP (ex.: Google sub)';
