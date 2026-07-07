-- Rastreamento avançado de visualização

ALTER TABLE public.content_views
  ADD COLUMN IF NOT EXISTS session_id TEXT,
  ADD COLUMN IF NOT EXISTS browser_name TEXT,
  ADD COLUMN IF NOT EXISTS device_label TEXT,
  ADD COLUMN IF NOT EXISTS duration_seconds INT,
  ADD COLUMN IF NOT EXISTS view_ended_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_content_views_session ON public.content_views (session_id);
