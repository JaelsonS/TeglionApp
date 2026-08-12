-- Fase 1 production-ready — estados de auth/sync + metadados do calendário escolhido.
-- Compatível com dados existentes: defaults seguros, sem backfill obrigatório.
-- A tabela firm_google_calendar_connections e consultations.google_event_id
-- já existem (20260915000000).

ALTER TABLE public.firm_google_calendar_connections
  ADD COLUMN IF NOT EXISTS auth_status TEXT NOT NULL DEFAULT 'ok',
  ADD COLUMN IF NOT EXISTS last_auth_error TEXT,
  ADD COLUMN IF NOT EXISTS last_auth_check_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS calendar_summary TEXT;

ALTER TABLE public.firm_google_calendar_connections
  DROP CONSTRAINT IF EXISTS firm_google_calendar_connections_auth_status_check;

ALTER TABLE public.firm_google_calendar_connections
  ADD CONSTRAINT firm_google_calendar_connections_auth_status_check
  CHECK (auth_status IN ('ok', 'needs_reconnect'));

ALTER TABLE public.consultations
  ADD COLUMN IF NOT EXISTS google_sync_status TEXT,
  ADD COLUMN IF NOT EXISTS google_sync_error TEXT,
  ADD COLUMN IF NOT EXISTS google_synced_at TIMESTAMPTZ;

ALTER TABLE public.consultations
  DROP CONSTRAINT IF EXISTS consultations_google_sync_status_check;

ALTER TABLE public.consultations
  ADD CONSTRAINT consultations_google_sync_status_check
  CHECK (
    google_sync_status IS NULL
    OR google_sync_status IN ('pending', 'synced', 'failed', 'skipped')
  );

-- Rollback (documentação; não executar em produção sem necessidade):
-- ALTER TABLE public.consultations DROP CONSTRAINT IF EXISTS consultations_google_sync_status_check;
-- ALTER TABLE public.consultations DROP COLUMN IF EXISTS google_sync_status;
-- ALTER TABLE public.consultations DROP COLUMN IF EXISTS google_sync_error;
-- ALTER TABLE public.consultations DROP COLUMN IF EXISTS google_synced_at;
-- ALTER TABLE public.firm_google_calendar_connections DROP CONSTRAINT IF EXISTS firm_google_calendar_connections_auth_status_check;
-- ALTER TABLE public.firm_google_calendar_connections DROP COLUMN IF EXISTS auth_status;
-- ALTER TABLE public.firm_google_calendar_connections DROP COLUMN IF EXISTS last_auth_error;
-- ALTER TABLE public.firm_google_calendar_connections DROP COLUMN IF EXISTS last_auth_check_at;
-- ALTER TABLE public.firm_google_calendar_connections DROP COLUMN IF EXISTS calendar_summary;
