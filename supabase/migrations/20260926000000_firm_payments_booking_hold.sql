-- Fatia 2: pagamento obrigatório no serviço + hold PENDING_PAYMENT + firm_payments
-- Compatível: payment_required DEFAULT false; bookings gratuitos inalterados.

-- 1) Política de pagamento no catálogo
ALTER TABLE public.accounting_services
  ADD COLUMN IF NOT EXISTS payment_required BOOLEAN NOT NULL DEFAULT false;

COMMENT ON COLUMN public.accounting_services.payment_required IS
  'Se true, agendamento público exige Checkout Stripe Connect antes de confirmar (SCHEDULED).';

-- 2) Estados de consultation: PENDING_PAYMENT (hold)
ALTER TABLE public.consultations
  DROP CONSTRAINT IF EXISTS consultations_status_check;

ALTER TABLE public.consultations
  ADD CONSTRAINT consultations_status_check
  CHECK (status IN ('PENDING_PAYMENT', 'SCHEDULED', 'COMPLETED', 'CANCELLED', 'NO_SHOW'));

ALTER TABLE public.consultations
  ADD COLUMN IF NOT EXISTS hold_expires_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS cancel_reason TEXT;

CREATE INDEX IF NOT EXISTS idx_consultations_hold_expires
  ON public.consultations (hold_expires_at)
  WHERE status = 'PENDING_PAYMENT' AND hold_expires_at IS NOT NULL;

-- 3) Motor de pagamentos (reutilizável: booking agora; service_request depois)
CREATE TABLE IF NOT EXISTS public.firm_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  firm_id UUID NOT NULL REFERENCES public.firms(id) ON DELETE CASCADE,
  purpose TEXT NOT NULL CHECK (purpose IN ('booking', 'service_request')),
  reference_type TEXT NOT NULL CHECK (reference_type IN ('consultation', 'service_request')),
  reference_id UUID NOT NULL,
  amount_cents INT NOT NULL CHECK (amount_cents > 0),
  currency TEXT NOT NULL DEFAULT 'EUR',
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'paid', 'failed', 'expired', 'refunded', 'cancelled')),
  stripe_checkout_session_id TEXT UNIQUE,
  stripe_payment_intent_id TEXT,
  stripe_account_id TEXT NOT NULL,
  checkout_expires_at TIMESTAMPTZ,
  public_status_token TEXT NOT NULL UNIQUE,
  paid_at TIMESTAMPTZ,
  failed_at TIMESTAMPTZ,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_firm_payments_firm_ref
  ON public.firm_payments (firm_id, reference_type, reference_id);

CREATE INDEX IF NOT EXISTS idx_firm_payments_pending_expiry
  ON public.firm_payments (checkout_expires_at)
  WHERE status = 'pending';

CREATE UNIQUE INDEX IF NOT EXISTS idx_firm_payments_one_pending_consultation
  ON public.firm_payments (firm_id, reference_id)
  WHERE purpose = 'booking' AND reference_type = 'consultation' AND status = 'pending';

ALTER TABLE public.firm_payments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS firm_payments_firm_staff ON public.firm_payments;
CREATE POLICY firm_payments_firm_staff ON public.firm_payments
  FOR SELECT
  USING (firm_id = public.current_firm_id() AND public.is_firm_staff());

COMMENT ON TABLE public.firm_payments IS
  'Pagamentos Connect (clientes → escritório). purpose=booking|service_request; paid só via webhook.';

-- Rollback (documentação):
-- DROP TABLE IF EXISTS public.firm_payments;
-- ALTER TABLE public.consultations DROP COLUMN IF EXISTS hold_expires_at, DROP COLUMN IF EXISTS cancel_reason;
-- ALTER TABLE public.consultations DROP CONSTRAINT IF EXISTS consultations_status_check;
-- ALTER TABLE public.consultations ADD CONSTRAINT consultations_status_check CHECK (status IN ('SCHEDULED','COMPLETED','CANCELLED','NO_SHOW'));
-- ALTER TABLE public.accounting_services DROP COLUMN IF EXISTS payment_required;
