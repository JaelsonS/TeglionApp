-- Cache de geo-IP para Control Center (sem PII além do IP já registado em auth).
CREATE TABLE IF NOT EXISTS public.ip_geo_cache (
  ip text PRIMARY KEY,
  country_code text,
  country_name text,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ip_geo_cache_updated_at ON public.ip_geo_cache (updated_at DESC);

ALTER TABLE public.ip_geo_cache ENABLE ROW LEVEL SECURITY;
-- Sem policies para roles authenticated/anon — só service role (backend).
