-- Sprint 0.9 — convites de equipa, confirmação de e-mail e permissões por membro

CREATE TABLE IF NOT EXISTS public.firm_member_invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  firm_id UUID NOT NULL REFERENCES public.firms(id) ON DELETE CASCADE,
  member_id UUID NOT NULL REFERENCES public.firm_users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  token TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'ACCEPTED', 'EXPIRED', 'REVOKED')),
  expires_at TIMESTAMPTZ NOT NULL,
  created_by UUID REFERENCES public.firm_users(id) ON DELETE SET NULL,
  accepted_at TIMESTAMPTZ,
  revoked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_firm_member_invites_firm_status
  ON public.firm_member_invites (firm_id, status);

CREATE INDEX IF NOT EXISTS idx_firm_member_invites_member_status
  ON public.firm_member_invites (member_id, status);

CREATE TABLE IF NOT EXISTS public.email_confirmation_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_type TEXT NOT NULL CHECK (user_type IN ('firm_user', 'client')),
  user_id UUID NOT NULL,
  token_hash TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_email_confirmation_tokens_user
  ON public.email_confirmation_tokens (user_type, user_id, created_at DESC);

ALTER TABLE public.firm_users
  ADD COLUMN IF NOT EXISTS email_confirmed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS permissions_override JSONB;

UPDATE public.firm_users
SET email_confirmed_at = COALESCE(email_confirmed_at, now())
WHERE is_active = true;

ALTER TABLE public.firm_member_invites ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS firm_member_invites_firm_staff ON public.firm_member_invites;
CREATE POLICY firm_member_invites_firm_staff ON public.firm_member_invites
  FOR ALL
  USING (firm_id = public.current_firm_id() AND public.is_firm_staff())
  WITH CHECK (firm_id = public.current_firm_id() AND public.is_firm_staff());

ALTER TABLE public.email_confirmation_tokens ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS email_confirmation_tokens_firm_staff ON public.email_confirmation_tokens;
CREATE POLICY email_confirmation_tokens_firm_staff ON public.email_confirmation_tokens
  FOR SELECT
  USING (
    user_type = 'firm_user'
    AND EXISTS (
      SELECT 1 FROM public.firm_users fu
      WHERE fu.id = email_confirmation_tokens.user_id
        AND fu.firm_id = public.current_firm_id()
        AND public.is_firm_staff()
    )
  );
