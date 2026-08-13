-- Deduplicação de lembrete de obrigação. O scheduler roda de hora em hora;
-- sem isto, o mesmo lembrete (mensagem interna e/ou email) pode ser
-- reenviado várias vezes no mesmo dia para o mesmo cliente/obrigação.
-- Mesmo princípio já usado para SMS (sms_logs + dedupeWindowMs), mas aqui
-- via constraint única no banco em vez de checagem por janela de tempo —
-- garante no máximo 1 envio por canal por obrigação por dia civil.

CREATE TABLE IF NOT EXISTS public.obligation_reminder_sends (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  firm_id UUID NOT NULL REFERENCES public.firms(id) ON DELETE CASCADE,
  obligation_id UUID NOT NULL REFERENCES public.obligations(id) ON DELETE CASCADE,
  channel TEXT NOT NULL CHECK (channel IN ('message', 'email')),
  day_bucket DATE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (obligation_id, channel, day_bucket)
);

CREATE INDEX IF NOT EXISTS idx_obligation_reminder_sends_firm
  ON public.obligation_reminder_sends (firm_id, created_at DESC);

COMMENT ON TABLE public.obligation_reminder_sends IS
  'Marca de envio por (obrigação, canal, dia) — evita reenvio duplicado do lembrete horário.';

ALTER TABLE public.obligation_reminder_sends ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS obligation_reminder_sends_firm_staff ON public.obligation_reminder_sends;
CREATE POLICY obligation_reminder_sends_firm_staff ON public.obligation_reminder_sends
  FOR SELECT
  USING (firm_id = public.current_firm_id() AND public.is_firm_staff());

-- Rollback (documentação):
-- DROP TABLE IF EXISTS public.obligation_reminder_sends;
