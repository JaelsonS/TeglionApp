-- Fase Ha — Google Calendar: ligar/desligar a conta (fundação, sem sync ainda).
-- Ver plan file da sessão, v3 secção L: fonte de verdade continua a ser
-- `consultations`, google_event_id como chave de idempotência. Esta migration
-- só cria o armazenamento da ligação OAuth por membro da equipa — tokens
-- sempre cifrados (enc:v1, mesmo padrão de service_inquiries.answers_enc),
-- nunca em texto plano.

CREATE TABLE IF NOT EXISTS public.firm_google_calendar_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  firm_id UUID NOT NULL REFERENCES public.firms(id) ON DELETE CASCADE,
  staff_user_id UUID NOT NULL REFERENCES public.firm_users(id) ON DELETE CASCADE,
  google_email TEXT,
  access_token_enc TEXT NOT NULL,
  refresh_token_enc TEXT NOT NULL,
  token_expires_at TIMESTAMPTZ NOT NULL,
  calendar_id TEXT NOT NULL DEFAULT 'primary',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (firm_id, staff_user_id)
);

CREATE INDEX IF NOT EXISTS idx_firm_google_calendar_connections_firm
  ON public.firm_google_calendar_connections (firm_id);

ALTER TABLE public.firm_google_calendar_connections ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS firm_google_calendar_connections_firm_staff ON public.firm_google_calendar_connections;
CREATE POLICY firm_google_calendar_connections_firm_staff ON public.firm_google_calendar_connections
  FOR ALL
  USING (firm_id = public.current_firm_id() AND public.is_firm_staff())
  WITH CHECK (firm_id = public.current_firm_id() AND public.is_firm_staff());

-- consultations.google_event_id — chave de idempotência para a Fase Hb (push
-- Teglion → Google), já criada aqui para não precisar de outra migration
-- quando essa fase chegar: nula em todas as consultas até lá, sem efeito.
ALTER TABLE public.consultations
  ADD COLUMN IF NOT EXISTS google_event_id TEXT;

-- Rollback (não executável, documentação apenas):
-- ALTER TABLE public.consultations DROP COLUMN IF EXISTS google_event_id;
-- DROP TABLE IF EXISTS public.firm_google_calendar_connections;
