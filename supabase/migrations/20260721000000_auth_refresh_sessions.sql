-- Sessões JWT refresh por dispositivo (várias simultâneas por firm_user / client)
-- Aplicar no Supabase SQL Editor ou via CLI após migrações anteriores.

CREATE TABLE IF NOT EXISTS public.auth_refresh_sessions (
  jti TEXT PRIMARY KEY,
  actor_type TEXT NOT NULL CHECK (actor_type IN ('firm_user', 'client')),
  actor_id UUID NOT NULL,
  token_hash TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_used_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_auth_refresh_sessions_actor_created
  ON public.auth_refresh_sessions(actor_type, actor_id, created_at DESC);

COMMENT ON TABLE public.auth_refresh_sessions IS 'Refresh tokens ativos por dispositivo; substitui semântica de um único hash em firm_users/clients';

ALTER TABLE public.auth_refresh_sessions ENABLE ROW LEVEL SECURITY;
