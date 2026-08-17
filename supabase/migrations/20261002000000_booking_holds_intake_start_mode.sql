-- Agenda-primeiro (opt-in): modo de início do intake + hold anónimo do horário.
ALTER TABLE public.accounting_services
  ADD COLUMN IF NOT EXISTS intake_start_mode TEXT NOT NULL DEFAULT 'form';

ALTER TABLE public.accounting_services
  DROP CONSTRAINT IF EXISTS accounting_services_intake_start_mode_check;

ALTER TABLE public.accounting_services
  ADD CONSTRAINT accounting_services_intake_start_mode_check
  CHECK (intake_start_mode IN ('form', 'calendar'));

COMMENT ON COLUMN public.accounting_services.intake_start_mode IS
  'form = dados primeiro (default). calendar = horários primeiro. Só aplica se requires_booking.';

CREATE TABLE IF NOT EXISTS public.booking_holds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  firm_id UUID NOT NULL REFERENCES public.firms(id) ON DELETE CASCADE,
  accounting_service_id UUID NOT NULL REFERENCES public.accounting_services(id) ON DELETE CASCADE,
  scheduled_at TIMESTAMPTZ NOT NULL,
  duration_minutes INT NOT NULL CHECK (duration_minutes BETWEEN 15 AND 480),
  hold_token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_booking_holds_firm_expiry
  ON public.booking_holds (firm_id, expires_at);

CREATE INDEX IF NOT EXISTS idx_booking_holds_token
  ON public.booking_holds (hold_token);

ALTER TABLE public.booking_holds
  DROP CONSTRAINT IF EXISTS booking_holds_no_overlap;

ALTER TABLE public.booking_holds
  ADD CONSTRAINT booking_holds_no_overlap
  EXCLUDE USING gist (
    firm_id WITH =,
    public.consultation_time_range(scheduled_at, duration_minutes) WITH &&
  );

ALTER TABLE public.booking_holds ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS booking_holds_firm_staff ON public.booking_holds;
CREATE POLICY booking_holds_firm_staff ON public.booking_holds
  FOR SELECT
  USING (firm_id = public.current_firm_id() AND public.is_firm_staff());

COMMENT ON TABLE public.booking_holds IS
  'Hold temporário anónimo (token de sessão) antes dos dados pessoais. API pública usa service role.';
