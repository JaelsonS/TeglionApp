-- Stripe Connect Express — conta do escritório para receber pagamentos dos clientes.
-- Separado do Billing SaaS (firms.stripe_customer_id / stripe_subscription_id).
-- Aceite legal imutável: Teglion não custodia dinheiro; Stripe + escritório.

CREATE TABLE IF NOT EXISTS public.firm_stripe_connect_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  firm_id UUID NOT NULL UNIQUE REFERENCES public.firms(id) ON DELETE CASCADE,
  stripe_account_id TEXT NOT NULL UNIQUE,
  details_submitted BOOLEAN NOT NULL DEFAULT false,
  charges_enabled BOOLEAN NOT NULL DEFAULT false,
  payouts_enabled BOOLEAN NOT NULL DEFAULT false,
  requirements_currently_due JSONB NOT NULL DEFAULT '[]'::jsonb,
  requirements_disabled_reason TEXT,
  onboarding_status TEXT NOT NULL DEFAULT 'not_started'
    CHECK (onboarding_status IN ('not_started', 'pending', 'restricted', 'complete')),
  livemode BOOLEAN NOT NULL DEFAULT false,
  created_by_user_id UUID REFERENCES public.firm_users(id) ON DELETE SET NULL,
  last_account_updated_event_id TEXT,
  latest_terms_version TEXT,
  latest_terms_accepted_at TIMESTAMPTZ,
  latest_terms_accepted_by_user_id UUID REFERENCES public.firm_users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_firm_stripe_connect_accounts_firm
  ON public.firm_stripe_connect_accounts (firm_id);

CREATE INDEX IF NOT EXISTS idx_firm_stripe_connect_accounts_stripe
  ON public.firm_stripe_connect_accounts (stripe_account_id);

COMMENT ON TABLE public.firm_stripe_connect_accounts IS
  'Conta Stripe Connect Express do escritório (pagamentos de clientes). Não misturar com billing Teglion.';

-- Histórico imutável do aceite da política de responsabilidade de pagamentos Connect.
CREATE TABLE IF NOT EXISTS public.firm_stripe_connect_terms_acceptances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  firm_id UUID NOT NULL REFERENCES public.firms(id) ON DELETE CASCADE,
  firm_user_id UUID NOT NULL REFERENCES public.firm_users(id) ON DELETE CASCADE,
  terms_version TEXT NOT NULL,
  terms_text_sha256 TEXT NOT NULL,
  accepted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_firm_stripe_connect_terms_firm
  ON public.firm_stripe_connect_terms_acceptances (firm_id, accepted_at DESC);

CREATE INDEX IF NOT EXISTS idx_firm_stripe_connect_terms_user
  ON public.firm_stripe_connect_terms_acceptances (firm_user_id, accepted_at DESC);

COMMENT ON TABLE public.firm_stripe_connect_terms_acceptances IS
  'Aceites imutáveis (INSERT only) da política Connect: Stripe processa; Teglion não custodia.';

-- Idempotência de webhooks Connect (separada do billing SaaS).
CREATE TABLE IF NOT EXISTS public.stripe_connect_webhook_events (
  event_id TEXT PRIMARY KEY,
  event_type TEXT NOT NULL,
  processed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS stripe_connect_webhook_events_processed_at_idx
  ON public.stripe_connect_webhook_events (processed_at DESC);

ALTER TABLE public.firm_stripe_connect_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.firm_stripe_connect_terms_acceptances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stripe_connect_webhook_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS firm_stripe_connect_accounts_firm_staff ON public.firm_stripe_connect_accounts;
CREATE POLICY firm_stripe_connect_accounts_firm_staff ON public.firm_stripe_connect_accounts
  FOR SELECT
  USING (firm_id = public.current_firm_id() AND public.is_firm_staff());

DROP POLICY IF EXISTS firm_stripe_connect_terms_firm_staff ON public.firm_stripe_connect_terms_acceptances;
CREATE POLICY firm_stripe_connect_terms_firm_staff ON public.firm_stripe_connect_terms_acceptances
  FOR SELECT
  USING (firm_id = public.current_firm_id() AND public.is_firm_staff());

-- Webhook events: sem acesso staff (só service role via API).
DROP POLICY IF EXISTS stripe_connect_webhook_events_deny ON public.stripe_connect_webhook_events;
CREATE POLICY stripe_connect_webhook_events_deny ON public.stripe_connect_webhook_events
  FOR ALL
  USING (false)
  WITH CHECK (false);

-- Rollback (documentação):
-- DROP TABLE IF EXISTS public.stripe_connect_webhook_events;
-- DROP TABLE IF EXISTS public.firm_stripe_connect_terms_acceptances;
-- DROP TABLE IF EXISTS public.firm_stripe_connect_accounts;
