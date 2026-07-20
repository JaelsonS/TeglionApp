-- Soft-hide activity events from the client hub feed without deleting history.
ALTER TABLE public.activity_events
  ADD COLUMN IF NOT EXISTS hidden_from_feed_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_activity_events_client_feed
  ON public.activity_events (firm_id, client_id, created_at DESC)
  WHERE hidden_from_feed_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_activity_events_client_history
  ON public.activity_events (firm_id, client_id, created_at DESC);
