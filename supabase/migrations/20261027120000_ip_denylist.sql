-- Denylist de IPs para Control Center / middleware API (Render).
-- Edge Cloudflare pode espelhar esta lista numa onda futura; aqui a fonte de verdade é Postgres.
CREATE TABLE IF NOT EXISTS public.ip_denylist (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ip text NOT NULL,
  reason text,
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid,
  revoked_at timestamptz,
  revoked_by uuid,
  CONSTRAINT ip_denylist_ip_format CHECK (char_length(ip) >= 3 AND char_length(ip) <= 64)
);

-- Um IP activo de cada vez (revogados podem repetir histórico).
CREATE UNIQUE INDEX IF NOT EXISTS ip_denylist_active_ip_uidx
  ON public.ip_denylist (ip)
  WHERE revoked_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_ip_denylist_active ON public.ip_denylist (ip)
  WHERE revoked_at IS NULL;

ALTER TABLE public.ip_denylist ENABLE ROW LEVEL SECURITY;
-- Sem policies para authenticated/anon — só service role (backend).
